import { NextRequest, NextResponse } from 'next/server';
import { validateOriginAndGetCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.json({
    endpoint: '/proxy/image',
    method: 'GET',
    description: 'Proxy server for Unity Asset Store images to bypass CORS restrictions',
    parameters: {
      url: {
        type: 'string',
        required: true,
        description: 'URL of the Unity Asset Store image to proxy'
      },
      w: {
        type: 'string',
        required: false,
        description: 'Desired width (for future image transformation support)'
      },
      h: {
        type: 'string',
        required: false,
        description: 'Desired height (for future image transformation support)'
      },
      q: {
        type: 'string',
        required: false,
        description: 'Image quality 0-100 (for future image transformation support)'
      }
    },
    supported_domains: [
      'assetstorev1-prd-cdn.unity3d.com',
      'cdn.unity3d.com', 
      'connect-prd-cdn.unity.com',
      'assetstore-keyimage.unity.com'
    ],
    cache_policy: {
      browser: '1 hour',
      cdn: '1 day',
      stale_while_revalidate: '1 week'
    },
    example_usage: [
      {
        description: 'Proxy a Unity Asset Store image',
        url: '/proxy/image?url=https://assetstorev1-prd-cdn.unity3d.com/key-image/example.jpg'
      },
      {
        description: 'In React component',
        code: '<img src="/proxy/image?url=${encodeURIComponent(originalImageUrl)}" alt="Asset image" onError={handleImageError} />'
      }
    ],
    features: [
      'CORS bypass for Unity Asset Store images',
      'Proper cache headers for optimal performance',
      'Error handling and validation',
      'Support for various image formats',
      'Maintains original image metadata'
    ]
  }, { headers: corsHeaders });
}