import { NextRequest, NextResponse } from 'next/server';
import { 
  optimizeAsset, 
  suggestTitleForAsset, 
  suggestTagsForAsset, 
  suggestShortDescriptionForAsset, 
  suggestLongDescriptionForAsset 
} from '@repo/optimizer';
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

    // Get field-specific optimization parameters from query params
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');

    // Parse and validate field parameter
    if (field) {
      const validFields = ['title', 'tags', 'short_description', 'long_description'];
      
      if (!validFields.includes(field)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid field: ${field}. Valid fields are: ${validFields.join(', ')}` 
          },
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Add field-specific option to the optimization request
      options.generateField = field;
    } else {
      // Generate all fields by default
      options.generateAll = true;
    }

    if (debug) {
      console.log('Optimizing asset with options:', JSON.stringify(options, null, 2));
      if (options.generateField) {
        console.log('Generating specific field:', options.generateField);
      } else {
        console.log('Generating all fields');
      }
    }

    // Optimize the asset
    const config = debug ? { debug } : null;
    let result: any;

    // Use field-specific methods when a specific field is requested
    if (options.generateField) {
      const fieldKey = options.generateField;
      const assetData = options.assetData;
      
      if (!assetData) {
        return NextResponse.json(
          { success: false, error: 'assetData is required for field generation' },
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        let fieldResult: any;
        
        switch (fieldKey) {
          case 'title':
            fieldResult = await suggestTitleForAsset(
              assetData,
              options.exemplarsPath,
              options.gradingRulesPath,
              options.vocab,
              config
            );
            break;
          case 'tags':
            fieldResult = await suggestTagsForAsset(
              assetData,
              options.exemplarsPath,
              options.gradingRulesPath,
              options.vocab,
              config
            );
            break;
          case 'short_description':
            fieldResult = await suggestShortDescriptionForAsset(
              assetData,
              options.exemplarsPath,
              options.gradingRulesPath,
              options.vocab,
              config
            );
            break;
          case 'long_description':
            fieldResult = await suggestLongDescriptionForAsset(
              assetData,
              options.exemplarsPath,
              options.gradingRulesPath,
              options.vocab,
              config
            );
            break;
          default:
            throw new Error(`Unsupported field: ${fieldKey}`);
        }

        // Structure the response to match the expected format
        result = fieldResult;
        
      } catch (error) {
        console.error(`Error generating field ${fieldKey}:`, error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to generate ${fieldKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
          },
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      // Use the general optimization function for full optimization
      result = await optimizeAsset(options, config as any);
    }

    // Structure response based on whether field-specific generation was requested
    if (options.generateField || options.generateAll) {
      return NextResponse.json({
        success: true,
        result: result,
      }, { headers: corsHeaders });
    } else {
      return NextResponse.json({
        success: true,
        result: result,
      }, { headers: corsHeaders });
    }

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
export async function GET(request: NextRequest) {
  const corsHeaders = validateOriginAndGetCorsHeaders(request);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

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
    query_parameters: {
      field: {
        type: 'string',
        required: false,
        description: 'Specific field to generate/optimize (title, tags, short_description, long_description). If not provided, all fields will be generated.',
        example: 'title'
      }
    },
    example_request: {
      url: '/optimize?field=title',
      body: {
        options: {
          assetData: {
            title: 'Math Learning Game',
            description: 'Educational game for learning basic mathematics...',
            tags: ['education', 'math', 'learning'],
            category: 'Educational'
          },
          useAI: true,
          exemplarsPath: '/path/to/exemplars.json',
          vocabPath: '/path/to/vocab.json'
        },
        debug: false
      }
    },
    example_response: {
      success: true,
      results: {
        tite: [
                {
                    "text": "TileWorldCreator 4 — Professional Tools/Level Design",
                    "rationale": "Includes category with professional keywords"
                },
                {
                    "text": "Complete Tools/Level Design Solution — Build Faster in Unity",
                    "rationale": "Includes category with professional keywords"
                },
                {
                    "text": "TileWorldCreator 4 | Ready-to-Use Tools/Level Design",
                    "rationale": "Includes category with professional keywords"
                }
            ]
      },
      optimized_at: '2025-10-10T12:00:00.000Z'
    }
  }, { headers: corsHeaders });
}