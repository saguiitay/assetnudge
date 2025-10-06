import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Add CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    // Validate required parameters
    if (!imageUrl) {
      return new NextResponse(null, { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate image URL format
    try {
      const url = new URL(imageUrl);
      // Allow Unity Asset Store domains and common CDNs
      const allowedDomains = [
        'assetstorev1-prd-cdn.unity3d.com',
        'cdn.unity3d.com', 
        'connect-prd-cdn.unity.com',
        'assetstore-keyimage.unity.com'
      ];
      
      if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
        return new NextResponse(null, { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (urlError) {
      return new NextResponse(null, { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Make a HEAD request to the original image
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://assetstore.unity.com/',
        'Origin': 'https://assetstore.unity.com',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return new NextResponse(null, { 
        status: response.status, 
        headers: corsHeaders 
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const contentLength = response.headers.get('content-length');

    // Build response headers for HEAD request
    const responseHeaders = new Headers({
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Cross-Origin-Resource-Policy': 'cross-origin', // Allow cross-origin access
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // Allow embedding
    });

    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    // Add original headers if available
    const originalLastModified = response.headers.get('last-modified');
    if (originalLastModified) {
      responseHeaders.set('Last-Modified', originalLastModified);
    }

    const originalEtag = response.headers.get('etag');
    if (originalEtag) {
      responseHeaders.set('ETag', originalEtag);
    }

    return new NextResponse(null, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error in HEAD request:', error);
    return new NextResponse(null, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('w');
    const height = searchParams.get('h');
    const quality = searchParams.get('q');

    // Validate required parameters
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: url' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate image URL format
    try {
      const url = new URL(imageUrl);
      // Allow Unity Asset Store domains and common CDNs
      const allowedDomains = [
        'assetstorev1-prd-cdn.unity3d.com',
        'cdn.unity3d.com', 
        'connect-prd-cdn.unity.com',
        'assetstore-keyimage.unity.com'
      ];
      
      if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
        return NextResponse.json(
          { success: false, error: 'URL domain not allowed. Only Unity Asset Store images are supported.' },
          { status: 403, headers: corsHeaders }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch the image with appropriate headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://assetstore.unity.com/',
        'Origin': 'https://assetstore.unity.com',
      },
      // Follow redirects and handle various response types
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `Failed to fetch image: ${response.status}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Validate content type
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'URL does not point to a valid image' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build response headers
    const responseHeaders = new Headers({
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800', // Cache for 1 hour, CDN cache for 1 day
      'Content-Length': imageBuffer.byteLength.toString(),
      'Cross-Origin-Resource-Policy': 'cross-origin', // Allow cross-origin access
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // Allow embedding
    });

    // Add original image headers if available
    const originalCacheControl = response.headers.get('cache-control');
    if (originalCacheControl) {
      responseHeaders.set('X-Original-Cache-Control', originalCacheControl);
    }

    const originalLastModified = response.headers.get('last-modified');
    if (originalLastModified) {
      responseHeaders.set('Last-Modified', originalLastModified);
    }

    const originalEtag = response.headers.get('etag');
    if (originalEtag) {
      responseHeaders.set('ETag', originalEtag);
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error proxying image:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}