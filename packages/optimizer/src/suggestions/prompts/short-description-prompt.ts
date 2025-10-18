/**
 * Short description-specific AI prompts for Unity Asset Store optimization
 */

import { ExemplarAsset } from 'src/exemplars';
import type { Asset, CategoryRules, CategoryVocabulary } from '../../types';

/**
 * Build system prompt for short description suggestions
 */
export function buildShortDescSystemPrompt(): string {
  return `You are an expert Unity Asset Store optimization specialist focused specifically on crafting compelling short descriptions.

Your expertise includes:
- Unity Asset Store short description best practices and character limits
- Conversion-focused copywriting techniques
- Value proposition communication
- Benefit-driven messaging over feature lists
- Emotional triggers and urgency creation
- Asset grading system requirements for maximum scores

CRITICAL SHORT DESCRIPTION OPTIMIZATION GUIDELINES:

1. CHARACTER LENGTH:
   - Stay within optimal character limits based on category median (will be provided in user prompt)
   - Avoid descriptions that are statistical outliers in length
   - Suggestions MUST be shorter than 200 characters

2. VALUE PROPOSITION LANGUAGE:
   - Lead with the primary benefit or value proposition
   - Tool descriptors: "pack", "set", "asset", "package", "collection", "kit", "system", "tool"
   - Feature words: "includes", "contains", "features", "offers", "provides"
   - Benefit words: "save", "improve", "boost", "enhance", "optimize"
   - Quality descriptors: "best", "perfect", "ultimate", "complete", "professional", "advanced", "powerful"

3. KEYWORD STRATEGY:
   - Include 1-2 primary keywords from category vocabulary naturally
   - Use relevant game development terminology
   - Incorporate high-value category-specific words

4. CONTENT STRUCTURE:
   - Create immediate clarity about what the asset does
   - Use action-oriented language and strong verbs
   - End with a compelling value statement or benefit
   - Avoid technical jargon unless necessary for the audience

5. GRADING OPTIMIZATION:
   - Ensure strong opening value proposition
   - Follow proven patterns from successful exemplars
   - Optimize for both discoverability and conversion

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for short description suggestions
 */
export function buildShortDescUserPrompt(
  asset: Asset,
  exemplars: ExemplarAsset[] = [],
  categoryVocabulary: CategoryVocabulary | undefined = undefined,
  categoryRules: CategoryRules | undefined = undefined 
): string {
  const currentShortDesc = asset.short_description || '';
  const currentLongDesc = asset.long_description || '';
  const descWords = categoryVocabulary?.description_words?.slice(0, 10).map((w: any) => w.word).join(', ') || '';
  const topUnigrams = categoryVocabulary?.top_unigrams?.slice(0, 8).map((w: any) => w.t).join(', ') || '';
  const topBigrams = categoryVocabulary?.top_bigrams?.slice(0, 5).map((w: any) => w.t).join(', ') || '';
  const commonStructures = categoryVocabulary?.common_structures?.slice(0, 3).join(', ') || '';
  const exemplarDescs = exemplars.slice(0, 10).map(ex => 
    `- "${ex.title}": "${ex.short_description || ''}"`
  ).filter(desc => desc.includes(': "')).join('\n');

  return `CURRENT ASSET ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Price: $${asset.price}
Tags: ${asset.tags?.join(', ') || 'None'}
Current Short Description (${currentShortDesc.length} chars): "${currentShortDesc}"
Current Long Description (if any):
\`\`\`
${currentLongDesc}
\'\'\'

CATEGORY VOCABULARY PATTERNS:
${descWords ? `High-Value Description Words: ${descWords}` : ''}
${topUnigrams ? `Top Category Unigrams: ${topUnigrams}` : ''}
${topBigrams ? `Top Category Bigrams: ${topBigrams}` : ''}
${commonStructures ? `Common Description Structures: ${commonStructures}` : ''}
${categoryVocabulary?.short_desc_length ? `Optimal Short Description Length:
${categoryVocabulary?.short_desc_length?.min ? `- Min: ${categoryVocabulary.short_desc_length.min} characters` : ''}
${categoryVocabulary?.short_desc_length?.max ? `- Max: ${categoryVocabulary.short_desc_length.max} characters` : ''}
${categoryVocabulary?.short_desc_length?.median ? `- Median: ${categoryVocabulary.short_desc_length.median} characters` : ''}` : ''}
${categoryVocabulary?.word_count_short ? `Optimal Word Count:
${categoryVocabulary?.word_count_short?.min ? `- Min: ${categoryVocabulary.word_count_short.min} words` : ''}
${categoryVocabulary?.word_count_short?.max ? `- Max: ${categoryVocabulary.word_count_short.max} words` : ''}
${categoryVocabulary?.word_count_short?.median ? `- Median: ${categoryVocabulary.word_count_short.median} words` : ''}` : ''}


${exemplarDescs ? `HIGH-PERFORMING EXEMPLAR DESCRIPTIONS:
${exemplarDescs}` : ''}

GRADING OPTIMIZATION FOCUS:
Rewrite the short description to maximize asset grading scores:

1. VALUE PROPOSITION:
   - Lead with the primary benefit or value proposition
   - Use strong tool descriptors, feature words, and benefit language
   - Include quality descriptors that convey professionalism

2. KEYWORD INTEGRATION:
   - Naturally incorporate 1-2 high-value keywords from category vocabulary
   - Use relevant unigrams and bigrams from successful assets
   - Include game development terminology where appropriate

3. TECHNICAL REQUIREMENTS:
   - Stay within optimal character limits for the category
   - Suggestions MUST be shorter than 200 characters
   - Follow word count guidelines from category statistics
   - Use proven structural patterns from exemplars

4. CONVERSION OPTIMIZATION:
   - Create immediate clarity about the asset's purpose and value
   - Use action-oriented language and compelling descriptors
   - End with a strong value statement that encourages action

For each suggestion, provide detailed reasoning explaining how it improves the grading score across content quality, findability, and professional presentation dimensions.`;
}