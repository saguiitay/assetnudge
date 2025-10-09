/**
 * Short description-specific AI prompts for Unity Asset Store optimization
 */

import type { Asset } from '../types';

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

CRITICAL GUIDELINES:
1. Keep within 100-200 characters for optimal display
2. Lead with the primary benefit or value proposition
3. Use action-oriented language and strong verbs
4. Include 1-2 primary keywords naturally
5. Create immediate clarity about what the asset does
6. End with a compelling call-to-action or benefit
7. Avoid technical jargon unless necessary for the audience

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for short description suggestions
 */
export function buildShortDescUserPrompt(
  asset: Asset,
  exemplars: any[] = [],
  vocab: any = {},
  validCategories: string[] = []
): string {
  const currentDesc = asset.short_description || '';
  const descWords = vocab.description_words?.slice(0, 10).map((w: any) => w.word).join(', ') || '';
  const exemplarDescs = exemplars.slice(0, 3).map(ex => 
    `"${ex.title}": "${ex.short_description || ''}"`
  ).filter(desc => desc.includes(': "')).join('\n');

  return `CURRENT SHORT DESCRIPTION ANALYSIS:
Title: "${asset.title}"
Category: ${asset.category}
Current Short Description (${currentDesc.length} chars): "${currentDesc}"
Price: $${asset.price}

CATEGORY DESCRIPTION PATTERNS:
High-Value Words: ${descWords}
Optimal Length: ${vocab.short_desc_length?.median || 150} characters

${exemplarDescs ? `HIGH-PERFORMING EXEMPLAR DESCRIPTIONS:
${exemplarDescs}` : ''}

OPTIMIZATION FOCUS:
Rewrite the short description to:
1. Immediately communicate the core value/benefit
2. Use compelling, action-oriented language
3. Include 1-2 primary keywords naturally
4. Create urgency or emotional appeal
5. Stay within optimal character limits (100-200 chars)
6. End with a strong value statement
7. Match successful patterns from exemplars

Provide a rewritten short description with explanation of the optimization strategy used.`;
}