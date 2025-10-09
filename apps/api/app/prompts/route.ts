import { NextRequest, NextResponse } from 'next/server';
import type { Asset, Vocabulary } from '@repo/optimizer/src/types';
import { FileValidator } from '@repo/optimizer/src/utils/validation';
import { 
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
  buildTagsSystemPrompt,
  buildTagsUserPrompt,
  buildShortDescSystemPrompt,
  buildShortDescUserPrompt,
  buildLongDescSystemPrompt,
  buildLongDescUserPrompt
} from '@repo/optimizer/src/prompts/index';

/**
 * POST /api/prompts
 * 
 * Development/Debug endpoint to retrieve the actual AI prompts used by the system.
 * This allows the frontend to display the real prompts being sent to the AI.
 * 
 * Loads exemplars and vocabulary data from default file locations based on the asset category.
 * Returns only the combined prompts for each suggestion type.
 * 
 * Request body format: {
 *   "asset": { ... }              // Required: Asset data with title and category
 * }
 * 
 * Only available in development/debug mode for security reasons.
 */
/**
 * Helper function to generate combined prompt for a specific field type
 */
function generateFieldPrompt(
  fieldType: string, 
  asset: Asset, 
  exemplars: any[] = [], 
  vocab: any = {}, 
  validCategories: string[] = []
): string {
  let systemPrompt: string;
  let userPrompt: string;
  
  switch (fieldType) {
    case 'title':
      systemPrompt = buildTitleSystemPrompt();
      userPrompt = buildTitleUserPrompt(asset, exemplars, vocab, validCategories);
      break;
    case 'tags':
      systemPrompt = buildTagsSystemPrompt();
      userPrompt = buildTagsUserPrompt(asset, exemplars, vocab, validCategories);
      break;
    case 'short_description':
      systemPrompt = buildShortDescSystemPrompt();
      userPrompt = buildShortDescUserPrompt(asset, exemplars, vocab, validCategories);
      break;
    case 'long_description':
      systemPrompt = buildLongDescSystemPrompt();
      userPrompt = buildLongDescUserPrompt(asset, exemplars, vocab, validCategories);
      break;
    default:
      throw new Error(`Unsupported field type: ${fieldType}`);
  }
  
  return `${systemPrompt}\n\n---\n\n${userPrompt}`;
}

/**
 * Helper function to generate all combined prompts for an asset
 */
function generateAllPrompts(
  asset: Asset, 
  exemplars: any[] = [], 
  vocab: any = {}, 
  validCategories: string[] = []
): Record<string, string> {
  return {
    title: `${buildTitleSystemPrompt()}\n\n---\n\n${buildTitleUserPrompt(asset, exemplars, vocab, validCategories)}`,
    tags: `${buildTagsSystemPrompt()}\n\n---\n\n${buildTagsUserPrompt(asset, exemplars, vocab, validCategories)}`,
    short_description: `${buildShortDescSystemPrompt()}\n\n---\n\n${buildShortDescUserPrompt(asset, exemplars, vocab, validCategories)}`,
    long_description: `${buildLongDescSystemPrompt()}\n\n---\n\n${buildLongDescUserPrompt(asset, exemplars, vocab, validCategories)}`
  };
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
    
    // Validate asset has required fields
    if (!asset.title || !asset.category) {
      return NextResponse.json(
        { success: false, error: 'Asset must have at least title and category fields' },
        { status: 400 }
      );
    }

    // Load context data from default file locations (like optimizer.ts)
    let categoryExemplars: any[] = [];
    let categoryVocab: any = {};
    const validCategories: string[] = [
      'Tools/Utilities',
      'Templates/Systems',
      '3D/Characters',
      '3D/Environments',
      '3D/Props',
      '2D/Textures & Materials',
      '2D/GUI',
      '2D/Fonts',
      'Audio/Music',
      'Audio/Sound FX',
      'VFX/Particles',
      'VFX/Shaders'
    ];
    
    // Try to load exemplars from default location
    try {
      const exemplarsData = await FileValidator.validateJSONFile('data/exemplars.json');
      categoryExemplars = exemplarsData?.exemplars?.[asset.category] || [];
    } catch (error) {
      console.warn('Failed to load exemplars from data/exemplars.json:', (error as Error).message);
      // Continue without exemplars
    }
    
    // Try to load vocabulary from default location
    try {
      const vocabulary: Vocabulary = await FileValidator.validateJSONFile('data/vocabulary.json') as Vocabulary;
      categoryVocab = vocabulary[asset.category] || {};
    } catch (error) {
      console.warn('Failed to load vocabulary from data/vocabulary.json:', (error as Error).message);
      // Continue without vocabulary
    }

    const { searchParams } = new URL(request.url);
    const fieldType = searchParams.get('type');

    // If specific field type requested, return that prompt only
    if (fieldType) {
      const validTypes = ['title', 'tags', 'short_description', 'long_description'];
      
      if (!validTypes.includes(fieldType)) {
        return NextResponse.json(
          { success: false, error: `Invalid field type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }

      try {
        const combinedPrompt = generateFieldPrompt(fieldType, asset, categoryExemplars, categoryVocab, validCategories);
        
        return NextResponse.json({
          success: true,
          fieldType,
          prompt: combinedPrompt
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: (error as Error).message },
          { status: 400 }
        );
      }
    }

    // Return all prompts
    const allPrompts = generateAllPrompts(asset, categoryExemplars, categoryVocab, validCategories);

    return NextResponse.json({
      success: true,
      prompts: allPrompts
    });

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