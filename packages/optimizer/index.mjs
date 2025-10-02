/**
 * Unity Asset Optimizer - Reusable Module for NextJS and Other Applications
 * 
 * This module exports the core grading and optimization functionality
 * in a clean, reusable format that can be easily imported into NextJS
 * applications or other Node.js projects.
 * 
 * Usage:
 *   import { gradeAsset, optimizeAsset, scrapeAsset, OptimizerConfig } from 'unity-asset-optimizer';
 *   
 *   // Grade an asset
 *   const result = await gradeAsset(assetData, vocabularyData);
 *   
 *   // Optimize an asset
 *   const optimization = await optimizeAsset({
 *     asset: assetData,
 *     vocabulary: vocabularyData,
 *     exemplars: exemplarsData,
 *     useAI: true,
 *     apiKey: 'your-openai-key'
 *   });
 *   
 *   // Scrape asset from URL
 *   const assetData = await scrapeAsset('https://assetstore.unity.com/packages/...');
 */

import { UnityAssetOptimizer } from './src/optimizer.mjs';
import Config from './src/config.mjs';
import { scrapeAssetWithPuppeteer } from './puppeteer-scraper.mjs';

/**
 * Configuration class for the optimizer
 */
export class OptimizerConfig {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.model = options.model || 'gpt-4o-mini';
    this.weights = options.weights || {};
    this.ignoreStopWords = options.ignoreStopWords !== false; // default true
  }
  
  /**
   * Convert to internal config format
   */
  toInternalConfig() {
    const args = [];
    
    if (this.debug) args.push('--debug', 'true');
    if (this.apiKey) args.push('--apiKey', this.apiKey);
    if (this.model) args.push('--model', this.model);
    if (this.weights && Object.keys(this.weights).length > 0) {
      args.push('--weights', JSON.stringify(this.weights));
    }
    if (!this.ignoreStopWords) args.push('--ignore-stop-words', 'false');
    
    return Config.fromEnvironment(args);
  }
}

/**
 * Grade an asset using the heuristic scoring system
 * 
 * @param {Object} asset - Asset data object with title, description, tags, etc.
 * @param {Object} vocabulary - Optional vocabulary data for category-specific scoring
 * @param {OptimizerConfig} config - Optional configuration
 * @returns {Promise<Object>} Grading result with score, letter grade, and breakdown
 */
export async function gradeAsset(asset, vocabulary = {}, config = new OptimizerConfig()) {
  try {
    // Validate input
    if (!asset || typeof asset !== 'object') {
      throw new Error('Asset data is required and must be an object');
    }
    
    if (!asset.title) {
      throw new Error('Asset must have a title');
    }
    
    // Create optimizer instance
    const internalConfig = config.toInternalConfig();
    const optimizer = new UnityAssetOptimizer([]);
    optimizer.config = internalConfig;
    
    // Initialize modules with new config
    const AssetGrader = (await import('./src/grader.mjs')).default;
    const grader = new AssetGrader(internalConfig);
    
    // Grade the asset
    const grade = await grader.gradeAsset(asset, vocabulary);
    
    return {
      success: true,
      grade,
      asset: {
        title: asset.title,
        category: asset.category
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: config.debug ? error.stack : undefined
    };
  }
}

/**
 * Perform comprehensive optimization analysis on an asset
 * 
 * @param {Object} options - Optimization options
 * @param {Object} options.asset - Asset data object (required if no URL)
 * @param {string} options.url - Asset Store URL to scrape (required if no asset)
 * @param {Object} options.vocabulary - Optional vocabulary data
 * @param {Object} options.exemplars - Optional exemplars data for coaching
 * @param {Array} options.neighbors - Optional similar assets corpus (legacy)
 * @param {boolean} options.useAI - Whether to use AI suggestions (default: false)
 * @param {OptimizerConfig} options.config - Configuration options
 * @returns {Promise<Object>} Optimization result with grade, suggestions, and analysis
 */
export async function optimizeAsset(options = {}) {
  try {
    const {
      asset,
      url,
      vocabulary = {},
      exemplars = null,
      neighbors = null,
      useAI = false,
      config = new OptimizerConfig()
    } = options;
    
    // Validate input
    if (!asset && !url) {
      throw new Error('Either asset data or URL must be provided');
    }
    
    if (asset && url) {
      throw new Error('Cannot provide both asset data and URL');
    }
    
    // Set up AI config if needed
    if (useAI && !config.apiKey) {
      throw new Error('OpenAI API key is required for AI suggestions. Set it in config.apiKey or OPENAI_API_KEY environment variable.');
    }
    
    // Create optimizer instance
    const internalConfig = config.toInternalConfig();
    const optimizer = new UnityAssetOptimizer([]);
    optimizer.config = internalConfig;
    
    // Get asset data
    let assetData;
    if (url) {
      assetData = await scrapeAssetWithPuppeteer(url);
    } else {
      assetData = asset;
    }
    
    // Run optimization
    const result = await optimizer.optimizeAsset({
      input: null, // We're passing the asset data directly
      url: null,
      vocabPath: null,
      exemplarsPath: null,
      neighborsPath: null,
      useAI
    });
    
    // Override internal data with our provided data
    const optimizationResult = await runOptimizationWithData(
      assetData,
      vocabulary,
      exemplars,
      neighbors,
      useAI,
      internalConfig
    );
    
    return {
      success: true,
      ...optimizationResult
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: options.config?.debug ? error.stack : undefined
    };
  }
}

/**
 * Internal function to run optimization with provided data objects
 */
async function runOptimizationWithData(asset, vocabulary, exemplars, neighbors, useAI, config) {
  // Import required modules
  const AssetGrader = (await import('./src/grader.mjs')).default;
  const HeuristicSuggestions = (await import('./src/heuristic-suggestions.mjs')).default;
  const SimilarityEngine = (await import('./src/similarity.mjs')).default;
  const AISuggestionEngine = (await import('./src/ai-suggestions.mjs')).default;
  
  // Initialize modules
  const grader = new AssetGrader(config);
  const heuristicEngine = new HeuristicSuggestions(config);
  const similarityEngine = new SimilarityEngine(config);
  const aiEngine = new AISuggestionEngine(config);
  
  // Perform grading
  const grade = await grader.gradeAsset(asset, vocabulary);
  
  // Choose coaching strategy
  let suggestions, similarAssets = [], exemplarRecommendations = null;
  
  if (exemplars && Object.keys(exemplars).length > 0) {
    // Use exemplar-based coaching
    const { generateExemplarRecommendations } = await import('./src/exemplar-coaching.mjs');
    exemplarRecommendations = generateExemplarRecommendations(asset, exemplars, 5);
    
    // Use heuristic suggestions as fallback
    suggestions = {
      suggested_tags: heuristicEngine.suggestTags(asset, vocabulary),
      suggested_title: heuristicEngine.suggestTitle(asset, vocabulary),
      suggested_description: heuristicEngine.suggestDescription(asset, vocabulary),
      suggested_category: heuristicEngine.suggestCategory(asset, vocabulary),
      recommendations: []
    };
    
  } else if (neighbors && Array.isArray(neighbors) && neighbors.length > 0) {
    // Legacy similarity-based coaching
    similarAssets = await similarityEngine.findSimilarAssets(asset, neighbors, 5);
    
    suggestions = {
      suggested_tags: heuristicEngine.suggestTags(asset, vocabulary),
      suggested_title: heuristicEngine.suggestTitle(asset, vocabulary),
      suggested_description: heuristicEngine.suggestDescription(asset, vocabulary),
      suggested_category: heuristicEngine.suggestCategory(asset, vocabulary),
      recommendations: []
    };
    
  } else {
    // Basic heuristic suggestions only
    suggestions = {
      suggested_tags: heuristicEngine.suggestTags(asset, vocabulary),
      suggested_title: heuristicEngine.suggestTitle(asset, vocabulary),
      suggested_description: heuristicEngine.suggestDescription(asset, vocabulary),
      suggested_category: heuristicEngine.suggestCategory(asset, vocabulary),
      recommendations: []
    };
  }
  
  // Add AI suggestions if requested
  let aiSuggestions = null;
  if (useAI && config.hasAI()) {
    try {
      aiSuggestions = await aiEngine.generateSuggestions(asset, grade, suggestions, vocabulary);
    } catch (error) {
      // AI suggestions are optional - continue without them
      console.warn('AI suggestions failed:', error.message);
    }
  }
  
  // Build result
  const result = {
    asset: {
      title: asset.title,
      category: asset.category || 'Unknown',
      url: asset.url
    },
    grade,
    analysis: {
      suggestions,
      similar_assets: similarAssets,
      exemplar_recommendations: exemplarRecommendations,
      ai_suggestions: aiSuggestions,
      coaching_strategy: exemplarRecommendations 
        ? 'exemplar-based' 
        : (similarAssets.length > 0 ? 'similarity-based' : 'heuristic-only')
    },
    meta: {
      analyzed_at: new Date().toISOString(),
      has_ai: !!aiSuggestions,
      has_exemplars: !!exemplarRecommendations,
      has_neighbors: similarAssets.length > 0,
      vocabulary_categories: Object.keys(vocabulary).length
    }
  };
  
  return result;
}

/**
 * Scrape asset data from Unity Asset Store URL
 * 
 * @param {string} url - Unity Asset Store URL
 * @param {OptimizerConfig} config - Optional configuration
 * @returns {Promise<Object>} Scraped asset data
 */
export async function scrapeAsset(url, config = new OptimizerConfig()) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }
    
    if (!url.includes('assetstore.unity.com/packages/')) {
      throw new Error('URL must be a valid Unity Asset Store URL');
    }
    
    // Scrape the asset
    const asset = await scrapeAssetWithPuppeteer(url);
    
    return {
      success: true,
      asset
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: config.debug ? error.stack : undefined
    };
  }
}

/**
 * Build vocabulary from a corpus of assets
 * 
 * @param {Array} corpus - Array of asset objects
 * @param {OptimizerConfig} config - Optional configuration
 * @returns {Promise<Object>} Built vocabulary data
 */
export async function buildVocabulary(corpus, config = new OptimizerConfig()) {
  try {
    if (!Array.isArray(corpus)) {
      throw new Error('Corpus must be an array of asset objects');
    }
    
    if (corpus.length === 0) {
      throw new Error('Corpus cannot be empty');
    }
    
    // Create optimizer instance
    const internalConfig = config.toInternalConfig();
    const VocabularyBuilder = (await import('./src/vocabulary.mjs')).default;
    const vocabularyBuilder = new VocabularyBuilder(internalConfig);
    
    // Build vocabulary
    const vocabulary = vocabularyBuilder.buildFromCorpus(corpus);
    
    return {
      success: true,
      vocabulary,
      stats: {
        categories: Object.keys(vocabulary).length,
        total_assets: corpus.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: config.debug ? error.stack : undefined
    };
  }
}

/**
 * Build exemplars from a corpus of assets
 * 
 * @param {Array} corpus - Array of asset objects
 * @param {number} topN - Number of top assets per category (optional)
 * @param {number} topPercent - Percentage of top assets per category (optional)
 * @param {OptimizerConfig} config - Optional configuration
 * @returns {Promise<Object>} Built exemplars data
 */
export async function buildExemplars(corpus, topN = 20, topPercent = null, config = new OptimizerConfig()) {
  try {
    if (!Array.isArray(corpus)) {
      throw new Error('Corpus must be an array of asset objects');
    }
    
    if (corpus.length === 0) {
      throw new Error('Corpus cannot be empty');
    }
    
    if (topN && topPercent) {
      throw new Error('Cannot specify both topN and topPercent');
    }
    
    // Create optimizer instance
    const internalConfig = config.toInternalConfig();
    const ExemplarExtraction = await import('./src/pattern-extraction.mjs');
    
    // Build exemplars
    const exemplars = ExemplarExtraction.extractExemplars(corpus, topN, topPercent);
    
    return {
      success: true,
      exemplars,
      stats: {
        total_exemplars: Object.values(exemplars).reduce((sum, cat) => sum + cat.assets.length, 0),
        categories: Object.keys(exemplars).length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: config.debug ? error.stack : undefined
    };
  }
}

// Export the main class for advanced users
export { UnityAssetOptimizer };

// Default export for easy importing
export default {
  gradeAsset,
  optimizeAsset,
  scrapeAsset,
  buildVocabulary,
  buildExemplars,
  OptimizerConfig,
  UnityAssetOptimizer
};