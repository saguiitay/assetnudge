/**
 * Vocabulary Builder Module
 * Handles vocabulary generation and category analysis for Unity Asset Store listings
 */

import { tokenize, median, meanStd } from './utils/utils.js';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation.mjs';

const logger = new Logger('vocab');

/**
 * Vocabulary and statistics builder
 */
export class VocabularyBuilder {
  constructor(config) {
    this.config = config;
    this.logger = logger.child('builder');
  }

  /**
   * Build vocabulary and statistical medians from a corpus of Unity Asset Store listings
   * This creates category-specific dictionaries of common words, bigrams, and tags
   * along with median values for pricing, images, videos, ratings, and reviews
   * 
   * @param {Array} corpus - Array of asset objects from scraped Unity Asset Store data
   * @returns {Object} Category-based vocabulary and comprehensive statistics
   */
  async buildVocabAndMedians(corpus) {
    return this.logger.time('buildVocabAndMedians', async () => {
      // Validate input corpus
      const validCount = AssetValidator.validateCorpus(corpus);
      this.logger.info('Corpus validation completed', { 
        total: corpus.length, 
        valid: validCount,
        invalid: corpus.length - validCount 
      });

      // Group assets by category to build category-specific vocabularies
      const perCat = {};
      let processedCount = 0;

      for (const asset of corpus) {
        try {
          // Validate individual asset (skip invalid ones)
          AssetValidator.validateAsset(asset);
          
          const cat = asset.category || 'Unknown';
          
          // Initialize category data structure if not exists
          if (!perCat[cat]) {
            perCat[cat] = this.initializeCategoryData();
          }

          this.processAssetForCategory(asset, perCat[cat]);
          processedCount++;

          // Log progress for large corpora
          if (processedCount % 1000 === 0) {
            this.logger.progress('Processing corpus', processedCount, corpus.length);
          }

        } catch (error) {
          this.logger.debug('Skipping invalid asset', { 
            title: asset.title,
            error: error.message 
          });
          continue;
        }
      }

      this.logger.info('Asset processing completed', { 
        processed: processedCount,
        categories: Object.keys(perCat).length 
      });

      // Process each category to extract top terms and calculate medians
      const result = {};
      for (const [cat, data] of Object.entries(perCat)) {
        result[cat] = await this.processCategoryData(cat, data);
      }

      this.logger.success('Vocabulary building completed', {
        categories: Object.keys(result).length,
        totalSamples: processedCount
      });

      return result;
    });
  }

  /**
   * Initialize empty category data structure
   */
  initializeCategoryData() {
    return {
      uni: [], bi: [], tags: [], 
      prices: [], images: [], videos: [], ratings: [], reviews: [],
      title_lengths: [], short_desc_lengths: [], long_desc_lengths: [], 
      tag_counts: [], word_counts_short: [], word_counts_long: [], bullet_counts: []
    };
  }

  /**
   * Process a single asset for category statistics
   */
  processAssetForCategory(asset, categoryData) {
    // Extract and tokenize text content (title + description)
    const longDesc = asset.long_description || asset.description || '';
    const shortDesc = asset.short_description || '';
    const assetDesc = longDesc || shortDesc;
    
    const ignoreStopWords = this.config.textProcessing?.ignoreStopWords ?? true;
    const tokens = tokenize(`${asset.title || ''} ${assetDesc}`, ignoreStopWords);
    categoryData.uni.push(...tokens.uni);
    categoryData.bi.push(...tokens.bi);
    
    // Collect tags and numerical stats for this category
    if (Array.isArray(asset.tags)) {
      categoryData.tags.push(...asset.tags.map(x => String(x).toLowerCase()));
    }
    
    // Numerical statistics
    this.addIfValid(categoryData.prices, asset.price);
    this.addIfValid(categoryData.images, asset.images_count);
    this.addIfValid(categoryData.videos, asset.videos_count);
    this.addIfValid(categoryData.ratings, asset.rating);
    this.addIfValid(categoryData.reviews, asset.reviews_count);
    
    // Content metadata statistics
    if (asset.title) {
      categoryData.title_lengths.push(String(asset.title).length);
    }
    if (shortDesc) {
      categoryData.short_desc_lengths.push(shortDesc.length);
      const cleanShort = shortDesc.replace(/<[^>]*>/g, ' ');
      categoryData.word_counts_short.push(
        cleanShort.split(/\s+/).filter(w => w.length > 0).length
      );
    }
    if (longDesc) {
      categoryData.long_desc_lengths.push(longDesc.length);
      const cleanLong = longDesc.replace(/<[^>]*>/g, ' ');
      categoryData.word_counts_long.push(
        cleanLong.split(/\s+/).filter(w => w.length > 0).length
      );
      // Count bullet points in long description
      const bullets = (longDesc.match(/\n[-•*]/g) || []).length;
      categoryData.bullet_counts.push(bullets);
    }
    if (Array.isArray(asset.tags)) {
      categoryData.tag_counts.push(asset.tags.length);
    }
  }

  /**
   * Helper to add valid numeric values to arrays
   */
  addIfValid(array, value) {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      array.push(value);
    }
  }

  /**
   * Process category data to extract vocabulary and statistics
   */
  async processCategoryData(category, data) {
    this.logger.debug(`Processing category: ${category}`, {
      unigrams: data.uni.length,
      bigrams: data.bi.length,
      tags: data.tags.length,
      assets: data.prices.length
    });

    // Helper function to count word frequencies
    const freqMap = (arr) => {
      const map = new Map();
      for (const item of arr) {
        map.set(item, (map.get(item) || 0) + 1);
      }
      return map;
    };

    // Get top terms by frequency (limited for performance)
    const maxTerms = this.config.thresholds.similarity;
    const uniFreq = [...freqMap(data.uni).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms.topUnigrams)
      .map(([t, c]) => ({ t, c }));
      
    const biFreq = [...freqMap(data.bi).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms.topBigrams)
      .map(([t, c]) => ({ t, c }));
      
    const tagFreq = [...freqMap(data.tags).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms.topTags)
      .map(([t, c]) => ({ t, c }));

    // Calculate statistics
    const priceStats = meanStd(data.prices);
    const titleStats = meanStd(data.title_lengths);
    const shortDescStats = meanStd(data.short_desc_lengths);
    const longDescStats = meanStd(data.long_desc_lengths);
    const tagCountStats = meanStd(data.tag_counts);
    const wordCountShortStats = meanStd(data.word_counts_short);
    const wordCountLongStats = meanStd(data.word_counts_long);
    const bulletStats = meanStd(data.bullet_counts);

    const result = {
      // Core vocabulary
      top_unigrams: uniFreq,
      top_bigrams: biFreq,
      top_tags: tagFreq,
      
      // Media and engagement medians
      med_images: median(data.images),
      med_videos: median(data.videos),
      med_price: median(data.prices),
      med_rating: median(data.ratings),
      med_reviews: median(data.reviews),
      
      // Price statistics for outlier detection
      price_mean: priceStats.mean,
      price_std: priceStats.std,
      
      // Content length benchmarks
      title_length: {
        median: median(data.title_lengths),
        mean: titleStats.mean,
        std: titleStats.std
      },
      short_desc_length: {
        median: median(data.short_desc_lengths),
        mean: shortDescStats.mean,
        std: shortDescStats.std
      },
      long_desc_length: {
        median: median(data.long_desc_lengths),
        mean: longDescStats.mean,
        std: longDescStats.std
      },
      
      // Content structure benchmarks
      tag_count: {
        median: median(data.tag_counts),
        mean: tagCountStats.mean,
        std: tagCountStats.std
      },
      word_count_short: {
        median: median(data.word_counts_short),
        mean: wordCountShortStats.mean,
        std: wordCountShortStats.std
      },
      word_count_long: {
        median: median(data.word_counts_long),
        mean: wordCountLongStats.mean,
        std: wordCountLongStats.std
      },
      bullet_count: {
        median: median(data.bullet_counts),
        mean: bulletStats.mean
      },
      
      // Sample size for statistical confidence
      sample_size: data.prices.length
    };

    this.logger.debug(`Category ${category} processed`, {
      sampleSize: result.sample_size,
      avgTitleLength: Math.round(result.title_length.mean || 0),
      avgDescWords: Math.round(result.word_count_long.mean || 0)
    });

    return result;
  }

  /**
   * Get vocabulary for a specific category with fallback
   */
  static getVocabularyForCategory(vocab, category) {
    if (!vocab || typeof vocab !== 'object') {
      return this.getDefaultVocabulary();
    }

    const vocabKeys = Object.keys(vocab);
    
    // Try exact category match first
    if (category && vocab[category]) {
      return vocab[category];
    }
    
    // Fallback to first available category
    if (vocabKeys.length > 0) {
      return vocab[vocabKeys[0]];
    }
    
    // Ultimate fallback
    return this.getDefaultVocabulary();
  }

  /**
   * Get default vocabulary when none is available
   */
  static getDefaultVocabulary() {
    return {
      top_unigrams: [],
      top_bigrams: [],
      top_tags: [],
      med_images: 5,
      med_videos: 1,
      med_price: null,
      price_mean: null,
      price_std: null,
      title_length: { median: 60, mean: 60, std: 15 },
      short_desc_length: { median: 150, mean: 150, std: 30 },
      long_desc_length: { median: 400, mean: 400, std: 100 },
      word_count_short: { median: 25, mean: 25, std: 10 },
      word_count_long: { median: 300, mean: 350, std: 100 },
      tag_count: { median: 8, mean: 8, std: 3 },
      bullet_count: { median: 6, mean: 6 },
      sample_size: 0
    };
  }

  /**
   * Build exemplar-based vocabulary from high-quality assets only
   * This creates more focused, quality-driven vocabularies
   * 
   * @param {Object} exemplarsData - Exemplars data with patterns
   * @returns {Object} Exemplar-based vocabulary and statistics
   */
  async buildExemplarVocabulary(exemplarsData) {
    return this.logger.time('buildExemplarVocabulary', async () => {
      this.logger.info('Building exemplar-based vocabulary', { 
        categories: Object.keys(exemplarsData.exemplars).length,
        totalExemplars: exemplarsData.metadata.stats.totalExemplars
      });

      const vocabByCategory = {};
      
      for (const [category, exemplars] of Object.entries(exemplarsData.exemplars)) {
        if (exemplars.length === 0) continue;
        
        this.logger.debug(`Processing category: ${category}`, { exemplarCount: exemplars.length });
        
        // Use the extracted patterns as the vocabulary
        const patterns = exemplarsData.patterns[category];
        if (!patterns) {
          this.logger.warn(`No patterns found for category: ${category}`);
          continue;
        }
        
        // Convert patterns to vocabulary format
        vocabByCategory[category] = {
          // Core vocabulary from exemplar patterns
          title_words: this.convertToVocabFormat(patterns.vocabulary.titleWords),
          title_bigrams: this.convertToVocabFormat(patterns.vocabulary.titleBigrams),
          description_words: this.convertToVocabFormat(patterns.vocabulary.descriptionWords),
          common_tags: this.convertToVocabFormat(patterns.tags.commonTags),
          tag_cooccurrence: this.convertToVocabFormat(patterns.tags.tagCooccurrence),
          
          // Statistical medians from exemplars only (legacy format for compatibility)
          sample_size: exemplars.length,
          
          // Media patterns (compatible format)
          images_count: {
            mean: patterns.media.images.avg,
            median: patterns.media.images.median,
            std: this.calculateStd(exemplars.map(e => e.images_count || 0)),
            min: patterns.media.images.min,
            max: patterns.media.images.max
          },
          videos_count: {
            mean: patterns.media.videos.avg,
            median: patterns.media.videos.median,
            std: this.calculateStd(exemplars.map(e => e.videos_count || 0)),
            min: patterns.media.videos.min,
            max: patterns.media.videos.max
          },
          
          // Structure patterns (compatible format)
          title_length: {
            mean: patterns.structure.titleLength.avg,
            median: patterns.structure.titleLength.median,
            std: this.calculateStd(exemplars.map(e => (e.title || '').length)),
            min: patterns.structure.titleLength.min,
            max: patterns.structure.titleLength.max
          },
          
          // Word count compatibility (map description_length to word_count_long)
          word_count_long: {
            mean: Math.round(patterns.structure.longDescriptionLength.avg / 5), // Approx words
            median: Math.round(patterns.structure.longDescriptionLength.median / 5),
            std: Math.round(this.calculateStd(exemplars.map(e => {
              const desc = (e.long_description || e.short_description || '').replace(/<[^>]*>/g, '');
              return desc.split(/\s+/).length;
            }))),
            min: Math.round(patterns.structure.longDescriptionLength.min / 5),
            max: Math.round(patterns.structure.longDescriptionLength.max / 5)
          },
          
          // Tag count compatibility
          tag_count: {
            mean: patterns.tags.averageTagCount,
            median: this.calculateMedian(exemplars.map(e => (e.tags || []).length)),
            std: this.calculateStd(exemplars.map(e => (e.tags || []).length))
          },
          
          // Bullet count compatibility
          bullet_count: {
            mean: patterns.structure.bulletPoints.avg,
            median: patterns.structure.bulletPoints.median,
            std: this.calculateStd(exemplars.map(e => {
              const desc = (e.long_description || e.short_description || '').toLowerCase();
              const bullets = (desc.match(/[⚡•▪▫◦‣⁃]|<li>/g) || []).length;
              return bullets;
            }))
          },
          
          // Price patterns (compatible format)
          price: patterns.price.avg ? {
            mean: patterns.price.avg,
            median: patterns.price.median,
            std: this.calculateStd(exemplars.map(e => e.price || 0).filter(p => p > 0)),
            min: patterns.price.min,
            max: patterns.price.max,
            q1: patterns.price.iqr.q1,
            q3: patterns.price.iqr.q3
          } : {
            mean: 0, median: 0, std: 0, min: 0, max: 0, q1: 0, q3: 0
          },
          
          // Additional exemplar-specific metrics
          quality_score: {
            mean: patterns.metadata.averageQualityScore,
            std: this.calculateStd(exemplars.map(e => e.qualityScore)),
            median: this.calculateMedian(exemplars.map(e => e.qualityScore)),
            min: Math.min(...exemplars.map(e => e.qualityScore)),
            max: Math.max(...exemplars.map(e => e.qualityScore))
          },
          
          // Metadata
          extracted_from: 'exemplars',
          extraction_date: patterns.metadata.extractedAt,
          top_exemplar_score: patterns.metadata.topExemplarScore,
          has_video_percentage: patterns.media.hasVideo,
          common_structures: patterns.structure.commonStructures
        };
        
        this.logger.info(`Built exemplar vocabulary for ${category}`, {
          titleWords: vocabByCategory[category].title_words.length,
          commonTags: vocabByCategory[category].common_tags.length,
          qualityScore: vocabByCategory[category].quality_score.mean.toFixed(1)
        });
      }
      
      this.logger.success('Exemplar vocabulary built successfully', {
        categories: Object.keys(vocabByCategory).length
      });
      
      return vocabByCategory;
    });
  }

  /**
   * Convert pattern format to vocabulary format
   */
  convertToVocabFormat(patternData) {
    if (!Array.isArray(patternData)) return [];
    
    return patternData.map(item => ({
      word: item.item,
      frequency: item.frequency,
      score: item.frequency // Use frequency as score
    }));
  }

  /**
   * Calculate standard deviation
   */
  calculateStd(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
}

export default VocabularyBuilder;