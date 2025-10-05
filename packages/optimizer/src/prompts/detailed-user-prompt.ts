import type { Asset } from '../types';

/**
 * Vocabulary word with frequency data
 */
interface VocabularyWord {
  word: string;
  frequency: number;
}

/**
 * Exemplar asset interface for prompts
 */
interface ExemplarAsset {
  title: string;
  qualityScore: number;
  tags?: string[];
  price?: number;
  rating?: number;
  reviews_count?: number;
}

/**
 * Vocabulary patterns interface
 */
interface VocabularyPatterns {
  title_words?: VocabularyWord[];
  title_bigrams?: VocabularyWord[];
  description_words?: VocabularyWord[];
  common_tags?: VocabularyWord[];
  title_length?: { median?: number };
  images_count?: { median?: number };
  price?: { q1?: number; q3?: number; median?: number };
  quality_score?: { mean?: number };
}

/**
 * Playbook recommendations interface
 */
interface PlaybookRecommendations {
  recommendations?: Record<string, any>;
  topExemplars?: ExemplarAsset[];
}

/**
 * Detailed user prompt with exemplar-based sections for comprehensive optimization
 */
export const buildDetailedUserPrompt = (
  asset: Asset,
  exemplars: ExemplarAsset[],
  vocab: VocabularyPatterns,
  playbook: PlaybookRecommendations,
  validCategories: string[]
): string => {
  const topExemplars = exemplars.slice(0, 5);
  const categoryRecommendations = playbook?.recommendations || {};
  
  return `ASSET TO OPTIMIZE:
Title: "${asset.title}"
Short Description: "${asset.short_description || 'None provided'}"
Long Description: "${(asset.long_description || '').substring(0, 500)}${asset.long_description?.length > 500 ? '...' : ''}"
Current Tags: [${(asset.tags || []).join(', ')}]
Category: ${asset.category}
Price: $${asset.price || 'Not set'}
Images: ${asset.images_count || 0}, Videos: ${asset.videos_count || 0}
Rating: ${asset.rating || 'None'} (${asset.reviews_count || 0} reviews)

EXEMPLAR VOCABULARY (from successful assets in ${asset.category}):
Title Words: ${(vocab.title_words || []).slice(0, 15).map(w => w.word).join(', ')}
Title Phrases: ${(vocab.title_bigrams || []).slice(0, 10).map(w => w.word).join(', ')}
Description Terms: ${(vocab.description_words || []).slice(0, 20).map(w => w.word).join(', ')}
Common Tags: ${(vocab.common_tags || []).slice(0, 15).map(w => w.word).join(', ')}

TOP EXEMPLARS IN CATEGORY:
${topExemplars.map((ex, i) => `${i + 1}. "${ex.title}" (Quality Score: ${ex.qualityScore?.toFixed(1)}, ${ex.reviews_count} reviews, Rating: ${ex.rating})`).join('\n')}

CATEGORY BENCHMARKS:
- Optimal title length: ${vocab.title_length?.median || 30} characters
- Average images: ${vocab.images_count?.median || 5}
- Price range: $${vocab.price?.q1 || 10} - $${vocab.price?.q3 || 50}
- Average quality score: ${vocab.quality_score?.mean?.toFixed(1) || 100}

PLAYBOOK RECOMMENDATIONS:
${JSON.stringify(categoryRecommendations, null, 2)}

TASKS:
Provide comprehensive optimization suggestions for:

1. TITLE SUGGESTIONS (3 alternatives):
   - Use exemplar vocabulary patterns
   - Keep 60-75 characters if possible
   - Reference which exemplar patterns you're following
   - Explain vocabulary coverage for each suggestion

2. TAG SUGGESTIONS (10-15 tags):
   - Balance high-signal category terms with specific use-cases
   - Use exemplar tag patterns
   - Rank by expected discoverability
   - Reference successful exemplar tag strategies

3. DESCRIPTION SUGGESTIONS:
   - Short description (140-160 characters)
   - Long description with exemplar structures
   - Use exemplar vocabulary naturally
   - Include features, benefits, compatibility
   - Reference exemplar formatting patterns

4. GENERAL RECOMMENDATIONS:
   - Compare against exemplar benchmarks
   - Provide effort/impact ratings
   - Reference specific exemplar achievements
   - Include current vs benchmark comparisons

5. CATEGORY CLASSIFICATION:
   - Classify into ONE category from the official Unity Asset Store structure
   - Choose from: ${validCategories.join(', ')}
   - Provide confidence score and vocabulary similarity reasoning
   - NEVER suggest multiple categories or unofficial categories

6. SIMILAR EXEMPLARS:
   - Find 3-5 similar exemplars for inspiration
   - Explain specific takeaways
   - Show shared vocabulary patterns
   - Highlight key differentiators

Return structured JSON matching the required schema.`;
};