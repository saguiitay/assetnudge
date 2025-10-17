import { NextRequest, NextResponse } from 'next/server';
import { scrapeAsset } from '@repo/optimizer';
import { validateOriginAndGetCorsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { url, method = 'graphql', debug = false } = body;

    // Validate request body
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL must be a string' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate Unity Asset Store URL
    if (!url.includes('assetstore.unity.com/packages/')) {
      return NextResponse.json(
        { success: false, error: 'URL must be a valid Unity Asset Store URL' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Choose scraping method
    let result;
    
    if (debug) {
      console.log(`Using ${method} scraping method for URL: ${url}`);
    }
    
    result = await scrapeAsset(url);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      asset: result.asset,
      scraping_method: (result as any).method || method,
      scraped_at: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error scraping asset:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET method to return API documentation
export async function GET(request: NextRequest) {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.json({
    endpoint: '/scrape',
    method: 'POST',
    description: 'Scrape asset data from Unity Asset Store URL with multiple scraping strategies',
    parameters: {
      url: {
        type: 'string',
        required: true,
        description: 'Unity Asset Store URL (must contain assetstore.unity.com/packages/)'
      },
      method: {
        type: 'string',
        required: false,
        default: 'graphql',
        enum: ['graphql', 'fallback'],
        description: 'Scraping method: graphql (official API), fallback (tries graphql then others)'
      },
      debug: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode for detailed error information'
      }
    },
    scraping_methods: {
      graphql: {
        description: 'Official Unity Asset Store GraphQL API',
        pros: ['Fastest (~500ms)', 'Most reliable', 'Official data source', 'Complete accuracy'],
        cons: ['May require CSRF token', 'Depends on Unity API availability'],
        use_case: 'Production environments, real-time applications, high-accuracy needs'
      },
      fallback: {
        description: 'Smart strategy that tries graphql first',
        pros: ['Best reliability', 'Optimal data quality', 'Graceful degradation'],
        cons: ['Variable speed depending on method used'],
        use_case: 'Production environments, mixed usage scenarios'
      }
    },
    example_request: {
      url: 'https://assetstore.unity.com/packages/...',
      method: 'graphql',
      debug: false
    },
    example_response: {
      success: true,
      asset: {
        title: 'Asset Title',
        description: 'Asset description...',
        tags: ['tag1', 'tag2'],
        category: 'Category Name',
        price: 0,
        publisher: 'Publisher Name',
        rating: 4.5,
        reviews_count: 123,
        url: 'https://assetstore.unity.com/packages/...'
      },
      scraping_method: 'graphql',
      scraped_at: '2025-10-03T12:00:00.000Z'
    }
  });
}