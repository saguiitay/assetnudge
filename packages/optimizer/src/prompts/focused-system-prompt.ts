/**
 * Focused system prompts for specific suggestion types
 */
export const buildFocusedSystemPrompt = (type: string, validCategories: string[]): string => {
  const basePrompt = `You are an expert Unity Asset Store optimization consultant specializing in ${type} optimization. You analyze exemplars (high-performing assets) to provide targeted ${type} improvements.`;
  
  const typeSpecific: Record<string, string> = {
    tags: `Focus on tag discovery and ranking. Balance high-signal category terms with specific use-cases. Reference successful exemplar tag patterns.`,
    title: `Focus on title optimization for clarity and conversion. Use exemplar vocabulary patterns while maintaining uniqueness. Keep 60-75 characters when possible.`,
    description: `Focus on conversion-focused descriptions. Use exemplar structures: short description (140-160 chars) + detailed long description with benefits, features, and compatibility.`,
    category: `Focus on accurate category classification using ONLY the official Unity Asset Store categories: ${validCategories.join(', ')}. NEVER suggest multiple categories or categories outside this list. Always suggest exactly ONE category in MainCategory/SubCategory format.`,
    recommendations: `Focus on actionable improvement recommendations using exemplar benchmarks and performance data.`
  };

  return `${basePrompt}\n\n${typeSpecific[type]}\n\nAlways ground suggestions in exemplar patterns and explain your reasoning with specific exemplar references.`;
};