/**
 * Short description-specific AI prompts for Unity Asset Store optimization
 */

import { ExemplarAsset } from '../../../src/exemplars';
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

WRITING PHILOSOPHY:
Answer the question "What is this?" not "Why should I buy this?"

Real best-seller examples:
✅ "Cartoon Tiger Animated 3D Model is completely ready to be used in your games, animations, films, designs etc."
✅ "Simple AI bots out of the box. With custom models textures and effects."
✅ "This pack contains 5 non-photorealistic animated water textures."
✅ Empty (very common!)

❌ What to AVOID:
"Transform your project with this ultimate professional asset! Featuring advanced capabilities and perfect optimization for all your development needs."

SHORT DESCRIPTION GUIDELINES:

1. BE DIRECT:
   - Start with "This [asset type] contains/includes/features..."
   - Or state what it's ready for: "completely ready to be used in your games"
   - Or describe the main thing: "5 horror soundtracks and 6 musical stingers with haunting melodies"
   - Under 150 characters is often perfect

2. IT'S OKAY TO BE CASUAL:
   - Real examples have informal grammar: "Simple AI bots out of the box"
   - Don't force perfect copywriting

3. SKIP MARKETING SPEAK:
   - No "Transform", "Ultimate", "Professional" unless it's literally a pro version
   - No "Perfect for all your needs"
   - No buzzwords or hype
   - Just say what it is

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