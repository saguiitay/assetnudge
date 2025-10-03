import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
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

    const { url, method = 'html', debug = false } = body;

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

    // Validate scraping method
    const validMethods = ['html', 'puppeteer', 'fallback'];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { success: false, error: `Method must be one of: ${validMethods.join(', ')}` },
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

    // Dynamically import the optimizer to avoid bundling issues
    const { scrapeAsset, scrapeAssetWithHTMLAPI, scrapeAssetWithPuppeteerAPI } = await import('@repo/optimizer');

    // Choose scraping method
    let result;
    
    if (debug) {
      console.log(`Using ${method} scraping method for URL: ${url}`);
    }
    
    switch (method) {
      case 'html':
        result = await scrapeAssetWithHTMLAPI(url);
        break;
      case 'puppeteer':
        result = await scrapeAssetWithPuppeteerAPI(url);
        break;
      case 'fallback':
      default:
        result = await scrapeAsset(url);
        break;
    }

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
export async function GET() {
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
        default: 'html',
        enum: ['html', 'puppeteer', 'fallback'],
        description: 'Scraping method: html (fast, lightweight), puppeteer (full-featured), fallback (tries puppeteer then html)'
      },
      debug: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode for detailed error information'
      }
    },
    scraping_methods: {
      html: {
        description: 'Fast HTML-only scraping without JavaScript execution',
        pros: ['Fast (~1.5s)', 'No browser dependencies', 'Lightweight'],
        cons: ['Limited to static content', '~90-95% data extraction accuracy'],
        use_case: 'Bulk operations, CI/CD, resource-constrained environments'
      },
      puppeteer: {
        description: 'Full browser scraping with JavaScript rendering',
        pros: ['Complete data extraction', 'JavaScript-rendered content', 'High accuracy'],
        cons: ['Slower (~10s)', 'Browser dependencies', 'Resource intensive'],
        use_case: 'Maximum accuracy needed, research, detailed analysis'
      },
      fallback: {
        description: 'Smart strategy that tries puppeteer first, falls back to html',
        pros: ['Best reliability', 'Optimal data quality', 'Graceful degradation'],
        cons: ['Variable speed depending on method used'],
        use_case: 'Production environments, mixed usage scenarios'
      }
    },
    example_request: {
      url: 'https://assetstore.unity.com/packages/...',
      method: 'html',
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
      scraping_method: 'html',
      scraped_at: '2025-10-03T12:00:00.000Z'
    }
  });
}