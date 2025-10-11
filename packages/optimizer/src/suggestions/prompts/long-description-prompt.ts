/**
 * Long description-specific AI prompts for Unity Asset Store optimization
 */

import { ExemplarAsset } from 'src/exemplars';
import type { Asset, CategoryRules, CategoryVocabulary } from '../../types';

/**
 * Build system prompt for long description suggestions
 */
export function buildLongDescSystemPrompt(): string {
  return `You are an expert Unity Asset Store optimization specialist focused specifically on creating comprehensive, conversion-optimized long descriptions.

Your expertise includes:
- Unity Asset Store long description best practices and formatting
- Structured content organization for maximum impact
- Feature-benefit translation and value communication
- Technical documentation integration
- Call-to-action optimization and trust building

CRITICAL GUIDELINES:
1. Use clear structure with headers, bullets, and sections
2. Lead with benefits, follow with features and technical details
3. Include implementation examples and use cases
4. Add social proof elements (compatibility, requirements)
5. Use markdown formatting for better readability
6. Include 3-5 bullet points highlighting key features
7. End with a strong call-to-action
8. Target 200-500 words for comprehensive coverage

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for long description suggestions
 */
export function buildLongDescUserPrompt(
  asset: Asset,
  exemplars: ExemplarAsset[] = [],
  categoryVocabulary: CategoryVocabulary | undefined = undefined,
  categoryRules: CategoryRules | undefined = undefined 
): string {
  const currentShortDesc = asset.short_description || '';
  const currentLongDesc = asset.long_description || '';
  const currentDesc = asset.long_description || '';
  const wordCount = currentDesc.split(/\s+/).length;
  const bulletCount = (currentDesc.match(/[•\-\*]/g) || []).length;
  
  const exemplarStructures = exemplars.slice(0, 2).map(ex => 
    `"${ex.title}": Structure analysis of their description formatting and key sections`
  ).join('\n');

  return `CURRENT LONG DESCRIPTION ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Current Word Count: ${wordCount}
Current Bullet Points: ${bulletCount}
Price: $${asset.price}
Current Short Description (${currentShortDesc.length} chars): "${currentShortDesc}"
Current Long Description (if any):
\`\`\`
${currentLongDesc}
\'\'\'

CURRENT DESCRIPTION:
"${currentDesc}"

CATEGORY BENCHMARKS:
Target Word Count: ${categoryVocabulary?.word_count_long?.median || 300} words
Target Bullet Points: ${categoryVocabulary?.bullet_count?.median || 5}

${exemplarStructures ? `EXEMPLAR STRUCTURE PATTERNS:
${exemplarStructures}` : ''}

OPTIMIZATION GOALS:
Rewrite the long description with:

1. **HOOK SECTION** (1-2 sentences)
   - Immediate value proposition
   - Primary benefit statement

2. **KEY FEATURES** (3-5 bullet points)
   - Specific capabilities and benefits
   - Technical highlights relevant to developers

3. **USE CASES** (2-3 examples)
   - Practical applications
   - Problem-solution scenarios

4. **TECHNICAL DETAILS** (1-2 paragraphs)
   - Compatibility information
   - Requirements and specifications

5. **CALL-TO-ACTION** (1-2 sentences)
   - Compelling reason to purchase
   - Value reinforcement

Use markdown formatting and ensure the content is scannable, informative, and conversion-focused.`;
}