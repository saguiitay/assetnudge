/**
 * Title-specific AI prompts for Unity Asset Store optimization
 */

import { ExemplarAsset } from 'src/exemplars';
import type { Asset, CategoryRules, CategoryVocabulary } from '../../types';

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
  exemplars: ExemplarAsset[] = [],
  categoryVocabulary: CategoryVocabulary | undefined = undefined,
  categoryRules: CategoryRules | undefined = undefined 
): string {
  const currentShortDesc = asset.short_description || '';
  const currentLongDesc = asset.long_description || '';
  const exemplarTitles = exemplars.slice(0, 20).map(ex => `"${ex.title}"`).join(', ');
  const topWords = categoryVocabulary?.title_words?.slice(0, 10).map((w: any) => w.word).join(', ');
  const topBigrams = categoryVocabulary?.title_bigrams?.slice(0, 5).map((w: any) => w.word).join(', ');

  return `CURRENT ASSET TITLE ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Current Character Count: ${asset.title?.length || 0}
Price: $${asset.price}
Tags: ${asset.tags?.join(', ') || 'None'}
Current Short Description (${currentShortDesc.length} chars): "${currentShortDesc}"
Current Long Description (if any):
\`\`\`
${currentLongDesc}
\'\'\'

CATEGORY VOCABULARY:
${topWords ? `Top Title Words: ${topWords}` : ''}
${topBigrams ? `Top Title Bigrams: ${topBigrams}` : ''}
${categoryVocabulary?.title_length ? `Optimal Title Length:
${categoryVocabulary?.title_length?.min ? `- Min: ${categoryVocabulary.title_length.min} characters` : ''}
${categoryVocabulary?.title_length?.max ? `- Max: ${categoryVocabulary.title_length.max} characters` : ''}
${categoryVocabulary?.title_length?.median ? `- Median: ${categoryVocabulary.title_length.median} characters` : ''}` : ''}

${exemplarTitles ? `HIGH-PERFORMING EXEMPLARS:
${exemplarTitles}` : ''}

IMPROVEMENT FOCUS:
Analyze the current title and suggest 3-4 improved alternatives that:
1. Include high-value keywords from the category vocabulary
2. Clearly communicate the asset's main benefit/purpose
3. Stay within optimal character limits
4. Use proven patterns from successful exemplars
5. Improve discoverability while maintaining clarity

Generate title suggestions with reasoning for each recommendation.`;
}