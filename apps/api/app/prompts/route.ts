import { NextRequest, NextResponse } from 'next/server';
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
 * GET /api/prompts
 * 
 * Development/Debug endpoint to retrieve the actual AI prompts used by the system.
 * This allows the frontend to display the real prompts being sent to the AI.
 * 
 * Only available in development/debug mode for security reasons.
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow in development/debug mode
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
    
    if (!isDevelopment) {
      return NextResponse.json(
        { success: false, error: 'Prompts endpoint only available in development mode' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fieldType = searchParams.get('type');

    // If specific field type requested, return dedicated prompts for that type
    if (fieldType) {
      const validTypes = ['title', 'tags', 'short_description', 'long_description'];
      
      if (!validTypes.includes(fieldType)) {
        return NextResponse.json(
          { success: false, error: `Invalid field type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }

      // Create a sample asset for demonstration purposes
      const sampleAsset = {
        title: '[Your Asset Title]',
        short_description: '[Current short description]',
        long_description: '[Current long description]',
        tags: ['sample', 'tags'],
        category: '[Asset Category]'
      };

      // Get system and user prompts for this specific field type
      let systemPrompt: string;
      let userPrompt: string;
      
      switch (fieldType) {
        case 'title':
          systemPrompt = buildTitleSystemPrompt();
          userPrompt = buildTitleUserPrompt(sampleAsset as any, [], {}, []);
          break;
        case 'tags':
          systemPrompt = buildTagsSystemPrompt();
          userPrompt = buildTagsUserPrompt(sampleAsset as any, [], {}, []);
          break;
        case 'short_description':
          systemPrompt = buildShortDescSystemPrompt();
          userPrompt = buildShortDescUserPrompt(sampleAsset as any, [], {}, []);
          break;
        case 'long_description':
          systemPrompt = buildLongDescSystemPrompt();
          userPrompt = buildLongDescUserPrompt(sampleAsset as any, [], {}, []);
          break;
        default:
          throw new Error(`Unsupported field type: ${fieldType}`);
      }

      return NextResponse.json({
        success: true,
        fieldType,
        prompts: {
          system: systemPrompt,
          user: userPrompt,
          combined: `${systemPrompt}\n\n---\n\n${userPrompt}`
        }
      });
    }

    // Return all field prompts using dedicated prompt functions
    const sampleAsset = {
      title: '[Your Asset Title]',
      short_description: '[Current short description]',
      long_description: '[Current long description]',
      tags: ['sample', 'tags'],
      category: '[Asset Category]'
    };

    const allPrompts: Record<string, any> = {
      title: {
        system: buildTitleSystemPrompt(),
        user: buildTitleUserPrompt(sampleAsset as any, [], {}, []),
        combined: `${buildTitleSystemPrompt()}\n\n---\n\n${buildTitleUserPrompt(sampleAsset as any, [], {}, [])}`
      },
      tags: {
        system: buildTagsSystemPrompt(),
        user: buildTagsUserPrompt(sampleAsset as any, [], {}, []),
        combined: `${buildTagsSystemPrompt()}\n\n---\n\n${buildTagsUserPrompt(sampleAsset as any, [], {}, [])}`
      },
      short_description: {
        system: buildShortDescSystemPrompt(),
        user: buildShortDescUserPrompt(sampleAsset as any, [], {}, []),
        combined: `${buildShortDescSystemPrompt()}\n\n---\n\n${buildShortDescUserPrompt(sampleAsset as any, [], {}, [])}`
      },
      long_description: {
        system: buildLongDescSystemPrompt(),
        user: buildLongDescUserPrompt(sampleAsset as any, [], {}, []),
        combined: `${buildLongDescSystemPrompt()}\n\n---\n\n${buildLongDescUserPrompt(sampleAsset as any, [], {}, [])}`
      }
    };

    return NextResponse.json({
      success: true,
      prompts: allPrompts,
      note: 'These are the actual prompts sent to the AI system. The [placeholder] values will be replaced with real asset data.'
    });

  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch prompts',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}