import { NextRequest, NextResponse } from 'next/server';
import type { Asset } from '@repo/optimizer/src/types';
import { generatePrompts } from '@repo/optimizer';

/**
 * POST /api/prompts
 * 
 * Development/Debug endpoint to retrieve the actual AI prompts used by the system.
 * This allows the frontend to display the real prompts being sent to the AI.
 * 
 * Uses the optimizer package's generatePrompts function which handles:
 * - Loading exemplars and vocabulary data from default file locations
 * - Building system and user prompts for each field type
 * - Returning combined prompts ready for AI consumption
 * 
 * Request body format: {
 *   "asset": { ... }              // Required: Asset data with title and category
 * }
 * 
 * Query parameters:
 *   type: (optional) Specific field type to get prompt for (title, tags, short_description, long_description)
 * 
 * Only available in development/debug mode for security reasons.
 */

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Only allow in development/debug mode
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
    
    if (!isDevelopment) {
      return NextResponse.json(
        { success: false, error: 'Prompts endpoint only available in development mode' },
        { status: 403 }
      );
    }

    // Parse request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required asset data
    if (!requestBody.asset) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Asset data required in request body',
          expected_format: {
            asset: '{ title, category, ... } - Required asset data'
          }
        },
        { status: 400 }
      );
    }

    const asset = requestBody.asset as Asset;
    
    // Get field type from query params
    const { searchParams } = new URL(request.url);
    const fieldType = searchParams.get('type');

    // Use the optimizer package's generatePrompts function
    const result = await generatePrompts(asset, fieldType || undefined, { debug: true });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Return the result from the optimizer
    if (fieldType && result.prompt) {
      return NextResponse.json({
        success: true,
        fieldType: result.fieldType,
        prompt: result.prompt
      });
    } else if (result.prompts) {
      return NextResponse.json({
        success: true,
        prompts: result.prompts
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unexpected response format from optimizer' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing POST /api/prompts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate prompts',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}