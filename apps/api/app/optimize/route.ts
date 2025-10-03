import { NextRequest, NextResponse } from 'next/server';
import { optimizeAsset } from '@repo/optimizer';

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

    const { options, debug = false } = body;

    // Validate request body
    if (!options) {
      return NextResponse.json(
        { success: false, error: 'options is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof options !== 'object') {
      return NextResponse.json(
        { success: false, error: 'options must be an object' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (debug) {
      console.log('Optimizing asset with options:', JSON.stringify(options, null, 2));
    }

    // Optimize the asset
    const config = debug ? { debug } : null;
    const result = await optimizeAsset(options, config as any);

    return NextResponse.json({
      success: true,
      optimization: result,
      optimized_at: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error optimizing asset:', error);
    
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
    endpoint: '/optimize',
    method: 'POST',
    description: 'Optimize an asset for educational use with recommendations and improvements',
    parameters: {
      options: {
        type: 'object',
        required: true,
        description: 'Optimization options containing asset data and optimization parameters'
      },
      debug: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode for detailed optimization information'
      }
    },
    example_request: {
      options: {
        assetData: {
          title: 'Math Learning Game',
          description: 'Educational game for learning basic mathematics...',
          tags: ['education', 'math', 'learning'],
          category: 'Educational'
        },
        optimizationLevel: 'moderate',
        targetAudience: 'elementary',
        includeAccessibility: true
      },
      debug: false
    },
    example_response: {
      success: true,
      optimization: {
        recommendations: [
          'Add audio narration for accessibility',
          'Include progress tracking features',
          'Simplify user interface for younger users'
        ],
        accessibility_improvements: ['High contrast mode', 'Text-to-speech support'],
        educational_enhancements: ['Assessment tools', 'Learning analytics'],
        technical_optimizations: ['Performance improvements', 'Memory optimization']
      },
      optimized_at: '2025-10-03T12:00:00.000Z'
    }
  }, { headers: corsHeaders });
}