/**
 * Similarity Engine Module
 * Provides TF-IDF vector similarity calculations for competitive analysis
 */

import { tfVector, cosine, TFVector } from './utils/utils';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation';
import { Config } from './config';
import { Asset, AssetRating } from './types';

const logger = new Logger('similarity');

/**
 * Similar asset result interface
 */
export interface SimilarAsset {
  title: string;
  url: string;
  category?: string;
  price?: number;
  rating?: AssetRating[];
  overlap: number;
  shared_tags: string[];
  similarity_score: number;
}

/**
 * Similarity distribution statistics interface
 */
export interface SimilarityDistribution {
  count: number;
  mean: number;
  max: number;
  min: number;
  quartiles: [number, number, number];
}

/**
 * Batch similarity results interface
 */
export interface BatchSimilarityResults {
  [assetId: string]: SimilarAsset[];
}

/**
 * Asset similarity calculator using TF-IDF vectors
 */
export class SimilarityEngine {
  private config: Config;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.logger = logger.child('engine');
  }

  /**
   * Finds similar assets using TF-IDF vector similarity (cosine distance)
   * Combines title, description, and tags into a single text representation
   * then calculates similarity scores against a corpus of assets
   * 
   * @param asset - Target asset to find neighbors for
   * @param corpus - Array of assets to search within
   * @param k - Number of similar assets to return
   * @returns Array of similar assets with overlap scores and shared tags
   */
  async findSimilarAssets(asset: Asset, corpus: Asset[], k: number | null = null): Promise<SimilarAsset[]> {
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
      const similarities: SimilarAsset[] = [];
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
          
          const similarAsset: SimilarAsset = {
            title: corpusAsset.title,
            url: corpusAsset.url || '',
            overlap: similarity,
            shared_tags: sharedTags,
            similarity_score: Math.round(similarity * 100) / 100
          };

          // Add optional properties only if they exist
          if (corpusAsset.category !== undefined) {
            similarAsset.category = corpusAsset.category;
          }
          if (corpusAsset.price !== undefined) {
            similarAsset.price = corpusAsset.price;
          }
          if (corpusAsset.rating !== undefined) {
            similarAsset.rating = corpusAsset.rating;
          }
          
          similarities.push(similarAsset);

          processedCount++;

          // Log progress for large corpora
          if (processedCount % 1000 === 0) {
            this.logger.progress('Computing similarities', processedCount, corpus.length);
          }

        } catch (error) {
          this.logger.debug('Skipping invalid corpus asset', {
            title: corpusAsset.title,
            error: (error as Error).message
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
        topSimilarity: results.length > 0 ? results[0]!.similarity_score : 0
      });

      return results;
    });
  }

  /**
   * Create TF-IDF vector for an asset
   */
  private createAssetVector(asset: Asset): TFVector {
    const description = (asset as any).long_description || 
                       (asset as any).short_description || 
                       (asset as any).description || '';
    
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
  private isSameAsset(asset1: Asset, asset2: Asset): boolean {
    // Same URL
    if ((asset1 as any).url && (asset2 as any).url && (asset1 as any).url === (asset2 as any).url) {
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
  private findSharedTags(asset1: Asset, asset2: Asset): string[] {
    const tags1 = (asset1.tags || []).map(t => String(t).toLowerCase());
    const tags2 = (asset2.tags || []).map(t => String(t).toLowerCase());
    
    return tags1.filter(tag => tags2.includes(tag));
  }

  /**
   * Calculate category-based similarity
   * Useful for finding assets in the same category with high similarity
   */
  async findSimilarInCategory(asset: Asset, corpus: Asset[], category: string | null = null, k: number | null = null): Promise<SimilarAsset[]> {
    const targetCategory = category || (asset as any).category;
    const neighborCount = k || this.config.thresholds.similarity.neighbors;
    
    if (!targetCategory) {
      this.logger.warn('No category specified, using general similarity');
      return this.findSimilarAssets(asset, corpus, neighborCount);
    }

    // Filter corpus to same category
    const categoryCorpus = corpus.filter(a => 
      ((a as any).category || '').toLowerCase() === targetCategory.toLowerCase()
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
  async batchSimilarity(assets: Asset[], corpus: Asset[], k: number | null = null): Promise<BatchSimilarityResults> {
    const neighborCount = k || this.config.thresholds.similarity.neighbors;
    
    return this.logger.time('batchSimilarity', async () => {
      this.logger.info('Starting batch similarity calculation', {
        targetCount: assets.length,
        corpusSize: corpus.length
      });

      const results: BatchSimilarityResults = {};
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i]!;
        const assetId = (asset as any).id || (asset as any).url || `asset_${i}`;
        
        try {
          results[assetId] = await this.findSimilarAssets(asset, corpus, neighborCount);
          
          this.logger.progress('Batch similarity', i + 1, assets.length, {
            currentAsset: asset.title
          });
          
        } catch (error) {
          this.logger.error(`Failed to calculate similarity for asset ${i}`, error as Error, {
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
  analyzeSimilarityDistribution(similarities: SimilarAsset[]): SimilarityDistribution {
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
      max: scores[count - 1]!,
      min: scores[0]!,
      quartiles: [
        scores[Math.floor(count * 0.25)]!,
        scores[Math.floor(count * 0.5)]!,
        scores[Math.floor(count * 0.75)]!
      ]
    };
  }
}

export default SimilarityEngine;