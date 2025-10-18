/**
 * Tags-specific AI prompts for Unity Asset Store optimization
 */

import { ExemplarAsset } from 'src/exemplars';
import type { Asset, CategoryRules, CategoryVocabulary } from '../../types';

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
- Asset grading system requirements for maximum scores

CRITICAL TAGS OPTIMIZATION GUIDELINES:

1. CATEGORY HIERARCHY COVERAGE:
   - Add ALL category hierarchy terms as tags (e.g., for "3D/Characters/Humanoids/Humans", include: "3d", "characters", "humanoids", "humans")
   - Tags should cover at least 35% of category hierarchy terms
   - This is essential for high grading scores

2. TAG STRATEGY:
   - Maximum 12 tags per asset (Unity Asset Store limit)
   - Target the category median tag count for optimal performance
   - Include primary keywords, secondary keywords, and long-tail phrases
   - Mix broad category terms with specific feature descriptors

3. KEYWORD TYPES:
   - Primary keywords (3-4 tags): Main category and asset type
   - Secondary keywords (4-5 tags): Features and functionality
   - Long-tail keywords (2-3 tags): Specific use cases and niche terms
   - Technical terms developers search for

4. DISCOVERABILITY OPTIMIZATION:
   - Use exact terms from category vocabulary when relevant
   - Include high-performing tags from successful exemplars
   - Balance popular tags with less competitive niche tags
   - Consider user search intent and behavior

5. GRADING OPTIMIZATION:
   - Ensure comprehensive category hierarchy coverage
   - Follow proven patterns from top-performing assets
   - Optimize for both broad and specific searches

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for tag suggestions
 */
export function buildTagsUserPrompt(
  asset: Asset,
  exemplars: ExemplarAsset[] = [],
  categoryVocabulary: CategoryVocabulary | undefined = undefined,
  categoryRules: CategoryRules | undefined = undefined
): string {
  const currentShortDesc = asset.short_description || '';
  const currentLongDesc = asset.long_description || '';
  const currentTags = asset.tags?.join(', ') || 'None';
  const topTags = categoryVocabulary?.common_tags?.slice(0, 15).map((t: any) => t.word).join(', ') || '';
  const topCategoryTags = categoryVocabulary?.top_tags?.slice(0, 12).map((t: any) => t.t).join(', ') || '';
  const tagCooccurrence = categoryVocabulary?.tag_cooccurrence?.slice(0, 10).map((t: any) => t.word).join(', ') || '';
  
  // Extract category hierarchy terms
  const categoryHierarchy = asset.category?.split('/').map(term => term.toLowerCase().trim()).filter(Boolean) || [];
  const hierarchyTerms = categoryHierarchy.join(', ');
  
  const exemplarTags = exemplars.filter(e => e.tags.length > 0).slice(0, 8).map(ex => 
    ex.tags ? `"${ex.title}": [${ex.tags.join(', ')}]` : ''
  ).join('\n');

  return `CURRENT ASSET TAG ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Current Tags (${asset.tags?.length || 0}): ${currentTags}
Current Short Description (${currentShortDesc.length} chars): "${currentShortDesc}"
Current Long Description (if any):
\`\`\`
${currentLongDesc}
\'\'\'

CATEGORY HIERARCHY & TAG REQUIREMENTS:
Category Path: ${asset.category}
Required Hierarchy Terms: [${hierarchyTerms}]
Hierarchy Coverage Target: 35%+ of category terms must be included as tags

CATEGORY TAG VOCABULARY:
Most Effective Tags: ${topTags}
Top Category Tags: ${topCategoryTags}
Tag Co-occurrence Patterns: ${tagCooccurrence}
Optimal Tag Count: ${categoryVocabulary?.tag_count?.median || '8-12'} tags

${exemplarTags ? `HIGH-PERFORMING EXEMPLAR TAGS:
${exemplarTags}` : ''}

GRADING OPTIMIZATION FOCUS:
Analyze the current tags and suggest NEW tags that are NOT already assigned to maximize asset grading scores:

IMPORTANT: DO NOT suggest any tags that are already assigned to this asset. Current tags to EXCLUDE from suggestions: [${currentTags}]

1. CATEGORY HIERARCHY COVERAGE (CRITICAL):
   - Include missing category hierarchy terms as tags: [${hierarchyTerms}]
   - Add related terms from the category path (e.g., plurals, variations) that are NOT already tagged
   - Ensure at least 35% coverage of category hierarchy terms

2. KEYWORD STRATEGY:
   - Primary keywords (3-4 tags): Main category and asset type terms not already used
   - Secondary keywords (4-5 tags): Features, functionality, and technical terms not currently tagged
   - Long-tail keywords (2-3 tags): Specific use cases and niche applications not already covered

3. VOCABULARY INTEGRATION:
   - Use high-performing tags from category vocabulary that are NOT already assigned
   - Include proven tag co-occurrence patterns that complement existing tags
   - Follow successful exemplar tag strategies for missing tag opportunities

4. DISCOVERABILITY OPTIMIZATION:
   - Balance broad category terms with specific descriptors (excluding current tags)
   - Include technical terms developers actively search for that are missing
   - Consider user search intent and behavior patterns for untapped keywords

5. TECHNICAL REQUIREMENTS:
   - Target the category median tag count (${categoryVocabulary?.tag_count?.median || 8} tags)
   - Only suggest NEW tags that add value beyond current assignments
   - Remove redundant or low-value tags

For each NEW tag suggestion, provide detailed reasoning explaining its importance for grading scores and discoverability. Indicate whether it's a hierarchy term, primary keyword, secondary keyword, or long-tail keyword. NEVER suggest tags that are already assigned to this asset.`;
}