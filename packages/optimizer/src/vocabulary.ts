/**
 * Vocabulary Builder Module
 * Handles vocabulary generation and category analysis for Unity Asset Store listings
 */

import { tokenize, median, meanStd, countBullets } from './utils/utils';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation';
import { GraderConfig, CategoryVocabulary, Vocabulary, ThresholdConfig, Asset } from './types';

const logger = new Logger('vocab');

/**
 * Category data structure for building vocabulary
 */
interface CategoryData {
  uni: string[];
  bi: string[];
  tags: string[];
  prices: number[];
  images: number[];
  videos: number[];
  ratings: number[];
  reviews: number[];
  title_lengths: number[];
  short_desc_lengths: number[];
  long_desc_lengths: number[];
  tag_counts: number[];
  word_counts_short: number[];
  word_counts_long: number[];
  bullet_counts: number[];
}

/**
 * Frequency map item
 */
interface FrequencyItem {
  t: string;
  c: number;
}

/**
 * Statistics object for content metrics
 */
interface StatisticsObject {
  median: number | null;
  mean: number | null;
  std: number | null;
  min?: number | null;
  max?: number | null;
  q1?: number | null;
  q3?: number | null;
}

/**
 * Exemplar vocabulary term
 */
interface ExemplarVocabTerm {
  word: string;
  frequency: number;
  score: number;
}

/**
 * Exemplar patterns structure from extracted data
 */
interface ExemplarPatterns {
  vocabulary: {
    titleWords: Array<{ item: string; frequency: number }>;
    titleBigrams: Array<{ item: string; frequency: number }>;
    descriptionWords: Array<{ item: string; frequency: number }>;
  };
  tags: {
    commonTags: Array<{ item: string; frequency: number }>;
    tagCooccurrence: Array<{ item: string; frequency: number }>;
    averageTagCount: number;
  };
  media: {
    images: {
      avg: number;
      median: number;
      min: number;
      max: number;
    };
    videos: {
      avg: number;
      median: number;
      min: number;
      max: number;
    };
    hasVideo: number;
  };
  structure: {
    titleLength: {
      avg: number;
      median: number;
      min: number;
      max: number;
    };
    longDescriptionLength: {
      avg: number;
      median: number;
      min: number;
      max: number;
    };
    bulletPoints: {
      avg: number;
      median: number;
    };
    commonStructures: string[];
  };
  price: {
    avg?: number;
    median?: number;
    min?: number;
    max?: number;
    iqr: {
      q1: number;
      q3: number;
    };
  };
  metadata: {
    averageQualityScore: number;
    topExemplarScore: number;
    extractedAt: string;
  };
}

/**
 * Exemplar data structure
 */
interface ExemplarsData {
  exemplars: {
    [category: string]: Array<{
      title?: string;
      long_description?: string;
      short_description?: string;
      tags?: string[];
      images_count?: number;
      videos_count?: number;
      price?: number;
      qualityScore: number;
    }>;
  };
  patterns: {
    [category: string]: ExemplarPatterns;
  };
  metadata: {
    stats: {
      totalExemplars: number;
    };
  };
}

/**
 * Extended category vocabulary with additional exemplar-specific fields
 */
interface ExtendedCategoryVocabulary extends CategoryVocabulary {
  title_words?: ExemplarVocabTerm[];
  title_bigrams?: ExemplarVocabTerm[];
  description_words?: ExemplarVocabTerm[];
  common_tags?: ExemplarVocabTerm[];
  tag_cooccurrence?: ExemplarVocabTerm[];
  images_count?: StatisticsObject;
  videos_count?: StatisticsObject;
  price?: StatisticsObject;
  quality_score?: StatisticsObject;
  extracted_from?: string;
  top_exemplar_score?: number;
  has_video_percentage?: number;
  common_structures?: string[];
}

/**
 * Vocabulary and statistics builder
 */
export class VocabularyBuilder {
  private config: GraderConfig;
  private logger: Logger;

  constructor(config: GraderConfig) {
    this.config = config;
    this.logger = logger.child('builder');
  }

  /**
   * Build vocabulary and statistical medians from a corpus of Unity Asset Store listings
   * This creates category-specific dictionaries of common words, bigrams, and tags
   * along with median values for pricing, images, videos, ratings, and reviews
   * 
   * @param corpus - Array of asset objects from scraped Unity Asset Store data
   * @returns Category-based vocabulary and comprehensive statistics
   */
  async buildVocabAndMedians(corpus: Asset[]): Promise<Vocabulary> {
    return this.logger.time('buildVocabAndMedians', async () => {
      // Validate input corpus
      const validCount = AssetValidator.validateCorpus(corpus);
      this.logger.info('Corpus validation completed', { 
        total: corpus.length, 
        valid: validCount,
        invalid: corpus.length - validCount 
      });

      // Group assets by category to build category-specific vocabularies
      const perCat: Record<string, CategoryData> = {};
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
            error: (error as Error).message 
          });
          continue;
        }
      }

      this.logger.info('Asset processing completed', { 
        processed: processedCount,
        categories: Object.keys(perCat).length 
      });

      // Process each category to extract top terms and calculate medians
      const result: Vocabulary = {};
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
  private initializeCategoryData(): CategoryData {
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
  private processAssetForCategory(asset: Asset, categoryData: CategoryData): void {
    // Extract and tokenize text content (title + description)
    const longDesc = (asset as any).long_description || (asset as any).description || '';
    const shortDesc = (asset as any).short_description || '';
    const assetDesc = longDesc || shortDesc;
    
    const ignoreStopWords = this.config.textProcessing?.ignoreStopWords ?? true;
    const tokens = tokenize(`${asset.title || ''} ${assetDesc}`, ignoreStopWords);
    categoryData.uni.push(...tokens.uni);
    categoryData.bi.push(...tokens.bi);
    
    // Collect tags and numerical stats for this category
    if (Array.isArray((asset as any).tags)) {
      categoryData.tags.push(...(asset as any).tags.map((x: any) => String(x).toLowerCase()));
    }
    
    // Numerical statistics
    this.addIfValid(categoryData.prices, (asset as any).price);
    this.addIfValid(categoryData.images, (asset as any).images_count);
    this.addIfValid(categoryData.videos, (asset as any).videos_count);
    this.addIfValid(categoryData.ratings, (asset as any).rating);
    this.addIfValid(categoryData.reviews, (asset as any).reviews_count);
    
    // Content metadata statistics
    if (asset.title) {
      categoryData.title_lengths.push(String(asset.title).length);
    }
    if (shortDesc) {
      categoryData.short_desc_lengths.push(shortDesc.length);
      const cleanShort = shortDesc.replace(/<[^>]*>/g, ' ');
      categoryData.word_counts_short.push(
        cleanShort.split(/\s+/).filter((w: string) => w.length > 0).length
      );
    }
    if (longDesc) {
      categoryData.long_desc_lengths.push(longDesc.length);
      const cleanLong = longDesc.replace(/<[^>]*>/g, ' ');
      categoryData.word_counts_long.push(
        cleanLong.split(/\s+/).filter((w: string) => w.length > 0).length
      );
      // Count bullet points in long description using improved detection
      const bullets = countBullets(longDesc);
      categoryData.bullet_counts.push(bullets);
    }
    if (Array.isArray((asset as any).tags)) {
      categoryData.tag_counts.push((asset as any).tags.length);
    }
  }

  /**
   * Helper to add valid numeric values to arrays
   */
  private addIfValid(array: number[], value: any): void {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      array.push(value);
    }
  }

  /**
   * Process category data to extract vocabulary and statistics
   */
  private async processCategoryData(category: string, data: CategoryData): Promise<CategoryVocabulary> {
    this.logger.debug(`Processing category: ${category}`, {
      unigrams: data.uni.length,
      bigrams: data.bi.length,
      tags: data.tags.length,
      assets: data.prices.length
    });

    // Helper function to count word frequencies
    const freqMap = (arr: string[]): Map<string, number> => {
      const map = new Map<string, number>();
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

    const result: CategoryVocabulary = {
      // Core vocabulary
      top_unigrams: uniFreq,
      top_bigrams: biFreq,
      top_tags: tagFreq,
      
      // Media and engagement medians
      med_images: median(data.images),
      med_videos: median(data.videos),
      med_price: median(data.prices),
      
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
  static getVocabularyForCategory(vocab: Vocabulary | null | undefined, category?: string): CategoryVocabulary {
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
      const firstKey = vocabKeys[0];
      if (firstKey && vocab[firstKey]) {
        return vocab[firstKey];
      }
    }
    
    // Ultimate fallback
    return this.getDefaultVocabulary();
  }

  /**
   * Get default vocabulary when none is available
   */
  static getDefaultVocabulary(): CategoryVocabulary {
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
   * @param exemplarsData - Exemplars data with patterns
   * @returns Exemplar-based vocabulary and statistics
   */
  async buildExemplarVocabulary(exemplarsData: ExemplarsData): Promise<Record<string, ExtendedCategoryVocabulary>> {
    return this.logger.time('buildExemplarVocabulary', async () => {
      // Defensive programming: check the data structure
      if (!exemplarsData) {
        throw new Error('ExemplarsData is null or undefined');
      }
      
      if (!exemplarsData.exemplars) {
        throw new Error('ExemplarsData.exemplars is null or undefined. Expected structure: { exemplars: {...}, patterns: {...}, metadata: {...} }');
      }
      
      if (!exemplarsData.patterns) {
        throw new Error('ExemplarsData.patterns is null or undefined. Expected structure: { exemplars: {...}, patterns: {...}, metadata: {...} }');
      }
      
      this.logger.info('Building exemplar-based vocabulary', { 
        categories: Object.keys(exemplarsData.exemplars).length,
        totalExemplars: exemplarsData.metadata?.stats?.totalExemplars || 'unknown'
      });

      const vocabByCategory: Record<string, ExtendedCategoryVocabulary> = {};
      
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
            std: this.calculateStd(exemplars.map(e => (e.title || '').length))
          },
          
          // Word count compatibility (map description_length to word_count_long)
          word_count_long: {
            mean: Math.round(patterns.structure.longDescriptionLength.avg / 5), // Approx words
            median: Math.round(patterns.structure.longDescriptionLength.median / 5),
            std: Math.round(this.calculateStd(exemplars.map(e => {
              const desc = (e.long_description || e.short_description || '').replace(/<[^>]*>/g, '');
              return desc.split(/\s+/).length;
            })))
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
            median: patterns.structure.bulletPoints.median
          },
          
          // Price patterns (compatible format)
          price: patterns.price.avg ? {
            mean: patterns.price.avg,
            median: patterns.price.median || null,
            std: this.calculateStd(exemplars.map(e => e.price || 0).filter(p => p > 0)),
            min: patterns.price.min || null,
            max: patterns.price.max || null,
            q1: patterns.price.iqr.q1,
            q3: patterns.price.iqr.q3
          } : {
            mean: 0, median: null, std: 0, min: null, max: null, q1: null, q3: null
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
          top_exemplar_score: patterns.metadata.topExemplarScore,
          has_video_percentage: patterns.media.hasVideo,
          common_structures: patterns.structure.commonStructures,

          // Legacy compatibility fields
          top_unigrams: [],
          top_bigrams: [],
          top_tags: [],
          med_images: patterns.media.images.median,
          med_videos: patterns.media.videos.median,
          med_price: patterns.price.median || null,
          price_mean: patterns.price.avg || null,
          price_std: this.calculateStd(exemplars.map(e => e.price || 0).filter(p => p > 0)),
          long_desc_length: { median: null, mean: null, std: null },
          word_count_short: { median: null, mean: null, std: null },
          short_desc_length: { median: null, mean: null, std: null }
        };
        
        const categoryVocab = vocabByCategory[category];
        this.logger.info(`Built exemplar vocabulary for ${category}`, {
          titleWords: categoryVocab?.title_words?.length || 0,
          commonTags: categoryVocab?.common_tags?.length || 0,
          qualityScore: categoryVocab?.quality_score?.mean?.toFixed(1) || 'N/A'
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
  private convertToVocabFormat(patternData: Array<{ item: string; frequency: number }>): ExemplarVocabTerm[] {
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
  private calculateStd(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate median
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      const val1 = sorted[mid - 1];
      const val2 = sorted[mid];
      return val1 !== undefined && val2 !== undefined ? (val1 + val2) / 2 : 0;
    } else {
      const val = sorted[mid];
      return val !== undefined ? val : 0;
    }
  }
}

export default VocabularyBuilder;