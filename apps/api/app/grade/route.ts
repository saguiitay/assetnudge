import { NextRequest, NextResponse } from 'next/server';
import { gradeAsset } from '@repo/optimizer';
import path from 'path';

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

    const { assetData, debug = false } = body;

    // Validate request body
    if (!assetData) {
      return NextResponse.json(
        { success: false, error: 'assetData is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof assetData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'assetData must be an object' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use exemplar vocabulary file
    const vocabPath = path.resolve(process.cwd(), '../../packages/optimizer/data/exemplar_vocab.json');

    if (debug) {
      console.log('Grading asset with data:', JSON.stringify(assetData, null, 2));
      console.log('Using exemplar vocabulary from:', vocabPath);
    }

    // Grade the asset using exemplar vocabulary
    const config = debug ? { debug } : null;
    const result = await gradeAsset(assetData, vocabPath as any, config as any);

    return NextResponse.json({
      success: true,
      grade: result,
      graded_at: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error grading asset:', error);
    
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
    endpoint: '/grade',
    method: 'POST',
    description: 'Grade an asset based on educational criteria using exemplar vocabulary for alignment scoring',
    parameters: {
      assetData: {
        type: 'object',
        required: true,
        description: 'Asset data object containing title, description, tags, etc.'
      },
      debug: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode for detailed grading information'
      }
    },
    example_request: {
      assetData: {
        title: 'Math Learning Game',
        description: 'Educational game for learning basic mathematics...',
        tags: ['education', 'math', 'learning'],
        category: 'Educational',
        price: 0,
        publisher: 'Educational Publisher',
        rating: 4.5,
        reviews_count: 100
      },
      debug: false
    },
    example_response: {
      success: true,
      grade: {
        overall_score: 85,
        educational_value: 90,
        technical_quality: 80,
        accessibility: 85,
        recommendations: ['Add more interactive elements', 'Include assessment features']
      },
      graded_at: '2025-10-03T12:00:00.000Z'
    }
  }, { headers: corsHeaders });
}