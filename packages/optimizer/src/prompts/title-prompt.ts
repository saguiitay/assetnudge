/**
 * Title-specific AI prompts for Unity Asset Store optimization
 */

import type { Asset } from '../types';

/**
 * Build system prompt for title suggestions
 */
export function buildTitleSystemPrompt(): string {
  return `You are an expert Unity Asset Store optimization specialist focused specifically on creating compelling asset titles.

Your expertise includes:
- Unity Asset Store title best practices and character limits
- Keyword optimization for discoverability
- Clear value proposition communication
- Category-appropriate naming conventions
- Emotional appeal and urgency creation

CRITICAL GUIDELINES:
1. Titles should be 20-60 characters for optimal visibility
2. Include primary keywords early in the title
3. Use action words and clear value indicators
4. Avoid generic terms like "Pack", "Collection", "Bundle" unless necessary
5. Consider the target category's naming patterns
6. Balance SEO optimization with human readability
7. Use title case formatting

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for title suggestions
 */
export function buildTitleUserPrompt(
  asset: Asset,
  exemplars: any[] = [],
  vocab: any = {},
  validCategories: string[] = []
): string {
  const exemplarTitles = exemplars.slice(0, 5).map(ex => `"${ex.title}"`).join(', ');
  const topWords = vocab.title_words?.slice(0, 10).map((w: any) => w.word).join(', ') || '';
  const topBigrams = vocab.title_bigrams?.slice(0, 5).map((w: any) => w.word).join(', ') || '';

  return `CURRENT ASSET TITLE ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Current Character Count: ${asset.title?.length || 0}
Price: $${asset.price}
Tags: ${asset.tags?.join(', ') || 'None'}

CATEGORY VOCABULARY:
Top Title Words: ${topWords}
Common Bigrams: ${topBigrams}
Optimal Length: ${vocab.title_length?.median || 40} characters

${exemplarTitles ? `HIGH-PERFORMING EXEMPLARS:
${exemplarTitles}` : ''}

IMPROVEMENT FOCUS:
Analyze the current title and suggest 3-5 improved alternatives that:
1. Include high-value keywords from the category vocabulary
2. Clearly communicate the asset's main benefit/purpose
3. Stay within optimal character limits (20-60 chars)
4. Use proven patterns from successful exemplars
5. Improve discoverability while maintaining clarity

Generate title suggestions with reasoning for each recommendation.`;
}