import { NextRequest, NextResponse } from 'next/server';
import { scrapeAsset, OptimizerConfig } from '@repo/optimizer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, debug = false } = body;

    // Validate request body
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL must be a string' },
        { status: 400 }
      );
    }

    // Validate Unity Asset Store URL
    if (!url.includes('assetstore.unity.com/packages/')) {
      return NextResponse.json(
        { success: false, error: 'URL must be a valid Unity Asset Store URL' },
        { status: 400 }
      );
    }

    // Create config with debug option
    const config = new OptimizerConfig({ debug });

    // Scrape the asset
    const result = await scrapeAsset(url, config);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset: result.asset,
      scraped_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error scraping asset:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET method to return API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/scrape',
    method: 'POST',
    description: 'Scrape asset data from Unity Asset Store URL',
    parameters: {
      url: {
        type: 'string',
        required: true,
        description: 'Unity Asset Store URL (must contain assetstore.unity.com/packages/)'
      },
      debug: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode for detailed error information'
      }
    },
    example_request: {
      url: 'https://assetstore.unity.com/packages/...',
      debug: false
    },
    example_response: {
      success: true,
      asset: {
        title: 'Asset Title',
        description: 'Asset description...',
        tags: ['tag1', 'tag2'],
        category: 'Category Name',
        url: 'https://assetstore.unity.com/packages/...'
      },
      scraped_at: '2025-10-02T12:00:00.000Z'
    }
  });
}