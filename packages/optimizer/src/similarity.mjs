/**
 * Similarity Engine Module
 * Provides TF-IDF vector similarity calculations for competitive analysis
 */

import { tfVector, cosine } from './utils/utils.mjs';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation.mjs';

const logger = new Logger('similarity');

/**
 * Asset similarity calculator using TF-IDF vectors
 */
export class SimilarityEngine {
  constructor(config) {
    this.config = config;
    this.logger = logger.child('engine');
  }

  /**
   * Finds similar assets using TF-IDF vector similarity (cosine distance)
   * Combines title, description, and tags into a single text representation
   * then calculates similarity scores against a corpus of assets
   * 
   * @param {Object} asset - Target asset to find neighbors for
   * @param {Array} corpus - Array of assets to search within
   * @param {number} k - Number of similar assets to return
   * @returns {Array} Array of similar assets with overlap scores and shared tags
   */
  async findSimilarAssets(asset, corpus, k = null) {
    const neighborCount = k || this.config.thresholds.similarity.neighbors;
    
    return this.logger.time('findSimilarAssets', async () => {
      // Validate inputs
      AssetValidator.validateAsset(asset);
      AssetValidator.validateCorpus(corpus);

      this.logger.debug('Finding similar assets', {
        targetTitle: asset.title,
        corpusSize: corpus.length,
        neighborCount
      });

      // Create TF-IDF vector for the target asset
      const targetVector = this.createAssetVector(asset);
      
      // Calculate similarity with each asset in corpus
      const similarities = [];
      let processedCount = 0;

      for (const corpusAsset of corpus) {
        try {
          AssetValidator.validateAsset(corpusAsset);
          
          const corpusVector = this.createAssetVector(corpusAsset);
          const similarity = cosine(targetVector, corpusVector);
          
          // Skip self-matches (same URL or identical titles)
          if (this.isSameAsset(asset, corpusAsset)) {
            continue;
          }

          const sharedTags = this.findSharedTags(asset, corpusAsset);
          
          similarities.push({
            title: corpusAsset.title,
            url: corpusAsset.url,
            category: corpusAsset.category,
            price: corpusAsset.price,
            rating: corpusAsset.rating,
            overlap: similarity,
            shared_tags: sharedTags,
            similarity_score: Math.round(similarity * 100) / 100
          });

          processedCount++;

          // Log progress for large corpora
          if (processedCount % 1000 === 0) {
            this.logger.progress('Computing similarities', processedCount, corpus.length);
          }

        } catch (error) {
          this.logger.debug('Skipping invalid corpus asset', {
            title: corpusAsset.title,
            error: error.message
          });
          continue;
        }
      }

      // Sort by similarity and return top k
      const results = similarities
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, neighborCount);

      this.logger.info('Similarity search completed', {
        targetTitle: asset.title,
        processed: processedCount,
        found: results.length,
        topSimilarity: results.length > 0 ? results[0].similarity_score : 0
      });

      return results;
    });
  }

  /**
   * Create TF-IDF vector for an asset
   */
  createAssetVector(asset) {
    const description = asset.long_description || 
                       asset.short_description || 
                       asset.description || '';
    
    const tags = Array.isArray(asset.tags) ? asset.tags.join(' ') : '';
    const title = asset.title || '';
    
    // Combine all text content
    const combinedText = `${title} ${description} ${tags}`;
    
    const ignoreStopWords = this.config.textProcessing?.ignoreStopWords ?? true;
    return tfVector(combinedText, ignoreStopWords);
  }

  /**
   * Check if two assets are the same (avoid self-matches)
   */
  isSameAsset(asset1, asset2) {
    // Same URL
    if (asset1.url && asset2.url && asset1.url === asset2.url) {
      return true;
    }
    
    // Identical titles (very likely same asset)
    if (asset1.title && asset2.title && 
        asset1.title.trim().toLowerCase() === asset2.title.trim().toLowerCase()) {
      return true;
    }
    
    return false;
  }

  /**
   * Find tags shared between two assets
   */
  findSharedTags(asset1, asset2) {
    const tags1 = (asset1.tags || []).map(t => String(t).toLowerCase());
    const tags2 = (asset2.tags || []).map(t => String(t).toLowerCase());
    
    return tags1.filter(tag => tags2.includes(tag));
  }

  /**
   * Calculate category-based similarity
   * Useful for finding assets in the same category with high similarity
   */
  async findSimilarInCategory(asset, corpus, category = null, k = null) {
    const targetCategory = category || asset.category;
    const neighborCount = k || this.config.thresholds.similarity.neighbors;
    
    if (!targetCategory) {
      this.logger.warn('No category specified, using general similarity');
      return this.findSimilarAssets(asset, corpus, neighborCount);
    }

    // Filter corpus to same category
    const categoryCorpus = corpus.filter(a => 
      (a.category || '').toLowerCase() === targetCategory.toLowerCase()
    );

    this.logger.debug('Finding similar assets in category', {
      category: targetCategory,
      categoryCorpusSize: categoryCorpus.length,
      totalCorpusSize: corpus.length
    });

    if (categoryCorpus.length === 0) {
      this.logger.warn('No assets found in category, falling back to general search', {
        category: targetCategory
      });
      return this.findSimilarAssets(asset, corpus, neighborCount);
    }

    return this.findSimilarAssets(asset, categoryCorpus, neighborCount);
  }

  /**
   * Batch similarity calculation for multiple target assets
   * More efficient when analyzing many assets against the same corpus
   */
  async batchSimilarity(assets, corpus, k = null) {
    const neighborCount = k || this.config.thresholds.similarity.neighbors;
    
    return this.logger.time('batchSimilarity', async () => {
      this.logger.info('Starting batch similarity calculation', {
        targetCount: assets.length,
        corpusSize: corpus.length
      });

      const results = {};
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const assetId = asset.id || asset.url || `asset_${i}`;
        
        try {
          results[assetId] = await this.findSimilarAssets(asset, corpus, neighborCount);
          
          this.logger.progress('Batch similarity', i + 1, assets.length, {
            currentAsset: asset.title
          });
          
        } catch (error) {
          this.logger.error(`Failed to calculate similarity for asset ${i}`, error, {
            assetTitle: asset.title
          });
          results[assetId] = [];
        }
      }

      this.logger.success('Batch similarity calculation completed', {
        processed: Object.keys(results).length,
        failed: assets.length - Object.keys(results).length
      });

      return results;
    });
  }

  /**
   * Get similarity statistics for analysis
   */
  analyzeSimilarityDistribution(similarities) {
    if (!similarities || similarities.length === 0) {
      return {
        count: 0,
        mean: 0,
        max: 0,
        min: 0,
        quartiles: [0, 0, 0]
      };
    }

    const scores = similarities.map(s => s.overlap).sort((a, b) => a - b);
    const count = scores.length;
    
    return {
      count,
      mean: scores.reduce((a, b) => a + b, 0) / count,
      max: scores[count - 1],
      min: scores[0],
      quartiles: [
        scores[Math.floor(count * 0.25)],
        scores[Math.floor(count * 0.5)],
        scores[Math.floor(count * 0.75)]
      ]
    };
  }
}

export default SimilarityEngine;