/**
 * Tags-specific AI prompts for Unity Asset Store optimization
 */

import type { Asset } from '../types';

/**
 * Build system prompt for tag suggestions
 */
export function buildTagsSystemPrompt(): string {
  return `You are an expert Unity Asset Store optimization specialist focused specifically on tag strategy and discoverability.

Your expertise includes:
- Unity Asset Store tagging best practices and limits
- Keyword research and semantic grouping
- Category-specific tag patterns
- Discoverability optimization techniques
- Long-tail keyword strategies

CRITICAL GUIDELINES:
1. Maximum 12 tags per asset (Unity Asset Store limit)
2. Include primary keywords, secondary keywords, and long-tail phrases
3. Mix broad category terms with specific feature descriptors
4. Consider user search intent and behavior
5. Include technical terms developers search for
6. Balance popular tags with less competitive niche tags
7. Use exact terms from category vocabulary when relevant

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for tag suggestions
 */
export function buildTagsUserPrompt(
  asset: Asset,
  exemplars: any[] = [],
  vocab: any = {},
  validCategories: string[] = []
): string {
  const currentTags = asset.tags?.join(', ') || 'None';
  const topTags = vocab.common_tags?.slice(0, 15).map((t: any) => t.word).join(', ') || '';
  const exemplarTags = exemplars.slice(0, 3).map(ex => 
    ex.tags ? `"${ex.title}": [${ex.tags.slice(0, 5).join(', ')}]` : ''
  ).filter(Boolean).join('\n');

  return `CURRENT ASSET TAG ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Current Tags (${asset.tags?.length || 0}/12): ${currentTags}
Short Description: "${asset.short_description || ''}"

CATEGORY TAG VOCABULARY:
Most Effective Tags: ${topTags}
Tag Count Benchmark: ${vocab.tag_count?.median || 8} tags

${exemplarTags ? `HIGH-PERFORMING EXEMPLAR TAGS:
${exemplarTags}` : ''}

TAGGING STRATEGY:
Analyze the current tags and suggest an optimized tag set that:
1. Maximizes discoverability for the target audience
2. Includes primary keywords (3-4 tags)
3. Includes secondary/feature keywords (4-5 tags) 
4. Includes long-tail/niche keywords (2-3 tags)
5. Removes redundant or low-value tags
6. Uses proven high-performing tags from the category
7. Stays within the 12-tag limit

Provide specific reasoning for each tag suggestion and indicate whether it's a primary, secondary, or long-tail keyword.`;
}