/**
 * Focused user prompts for specific suggestion types
 */
export const buildFocusedUserPrompt = (type, asset, exemplars, vocab, playbook, validCategories) => {
  const baseContext = buildBaseAssetContext(asset, exemplars, vocab, playbook);
  
  const typeSpecific = {
    tags: `TASK: Suggest 10-15 optimized tags ranked by discoverability. Use exemplar tag patterns and explain why each tag works in this category.`,
    title: `TASK: Suggest 3 alternative titles using exemplar vocabulary patterns. Explain intent and vocabulary coverage for each.`,
    description: `TASK: Create short description (140-160 chars) and long description using exemplar structures. Include benefits, features, compatibility.`,
    category: `TASK: Classify into exactly ONE category from the official Unity Asset Store structure. Choose from: ${validCategories.join(', ')}. Provide confidence score and reasoning based on exemplar vocabulary similarity.`,
    recommendations: `TASK: Provide 5-7 prioritized improvement recommendations using exemplar benchmarks. Include effort/impact ratings.`
  };

  return `${baseContext}\n\n${typeSpecific[type]}`;
};

/**
 * Build base asset context for focused prompts
 */
export const buildBaseAssetContext = (asset, exemplars, vocab, playbook) => {
  const topExemplars = exemplars.slice(0, 3);
  
  return `ASSET: "${asset.title}"
Category: ${asset.category}
Current Tags: [${(asset.tags || []).join(', ')}]
Price: $${asset.price || 'Not set'}

EXEMPLAR VOCABULARY:
- Title Words: ${(vocab.title_words || []).slice(0, 10).map(w => w.word).join(', ')}
- Common Tags: ${(vocab.common_tags || []).slice(0, 10).map(w => w.word).join(', ')}

TOP EXEMPLARS:
${topExemplars.map((ex, i) => `${i + 1}. "${ex.title}" (Score: ${ex.qualityScore?.toFixed(1)})`).join('\n')}

BENCHMARKS:
- Avg Quality: ${vocab.quality_score?.mean?.toFixed(1) || 100}
- Optimal Price: $${vocab.price?.median || 25}`;
};