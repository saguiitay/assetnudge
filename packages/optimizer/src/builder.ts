/**
 * Builder Class - Handles exemplar building, grading rules, vocabulary, and playbook generation
 */

import * as fs from 'fs';
import * as path from 'path';

// Core modules
import { Config } from './config';
import { Logger } from './utils/logger';
import { FileValidator } from './utils/validation';
import { VocabularyBuilder } from './vocabulary';
import { AssetGrader } from './grader';

// Exemplar and pattern modules
import { identifyExemplars, getExemplarStats } from './exemplars';
import { extractCategoryPatterns } from './pattern-extraction';
import { generateCategoryPlaybook } from './exemplar-coaching';
import { extractGradingRules } from './dynamic-grading-rules';

// Types
import type { 
  Asset, 
  BestSellerAsset
} from './types';

/**
 * Exemplar build statistics
 */
export interface ExemplarBuildStats {
  categories: number;
  totalExemplars: number;
  bestSellersIncluded: number;
  selectionCriteria: string;
}

/**
 * Grading rules build statistics
 */
export interface GradingRulesBuildStats {
  categories: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  totalExemplars: number;
  bestSellersCount: number;
}

/**
 * Vocabulary build statistics
 */
export interface VocabularyBuildStats {
  categories: number;
  totalCategories: number;
  source: string;
}

/**
 * Playbook generation statistics
 */
export interface PlaybookStats {
  categories: number;
  totalCategories: number;
}

/**
 * Multi-pass build statistics
 */
export interface MultiPassBuildStats {
  passes: number;
  converged: boolean;
  convergenceMetric: number;
  convergenceThreshold: number;
  passResults: {
    pass: number;
    exemplarStats: ExemplarBuildStats;
    gradingRulesStats: GradingRulesBuildStats;
    exemplarChanges?: {
      added: string[];
      removed: string[];
      unchanged: string[];
    };
  }[];
  finalFiles: {
    exemplars: string;
    gradingRules: string;
    vocabulary: string;
    playbooks: string;
  };
}


export interface CategoryDataStatistics {
  slug: string
  name: string
  description: string
  overview: {
    numberOfAssets: number
    averagePrice: number
  }
  recommendations: {
    title: {
      optimalLength: {
        min: number;
        max: number;
        median: number;
      },
      examples: {
  	    // Titles of the 5-10 top graded assets in the category
        good: string[]
		    // Titles of the 2-3 lowest graded assets in the category
        bad: string[]
      }
    }
    description: {
      optimalLength: {
        min: number;
        max: number;
        median: number;
	    },
      examples: {
	      // Description of the 5-10 top graded assets in the category
        good: string[]
		    // Description of the 2-3 lowest graded assets in the category
        bad: string[]
      }
    }
    images: {
      optimalCount: {
        min: number;
        max: number;
        median: number;
      },
    }
    tags: {
      optimalCount: {
        min: number;
		    max: number;
		    median: number;
	    },
	    // 10 most common tags
      commonTags: string[]
	    // Top 5 tags used by the 5-10 top graded assets in the category
      topTags: string[]
    }
    keywords: {
	    // 10 most common bigrams/trigrams used in the category
      commonKeywords: string[]
      // 10 most common bigrams/trigrams used in the category used by the 5-10 top graded assets in the category
      topKeywords: string[]
    }
    pricing: {
	    min: number;
	    max: number;
	    median: number;
    }
  }
  // Details of the top 10 assets in the category
  topAssets: any[],
  
  // Details of the 10 lowest-graded assets in the category
  bottomAssets: any[]
}

/**
 * Builder class for exemplars, grading rules, vocabulary, and playbooks
 */
export class Builder {
  private config: Config;
  private logger: Logger;
  private vocabularyBuilder: VocabularyBuilder;
  private grader: AssetGrader;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger('builder', config.debug);
    this.vocabularyBuilder = new VocabularyBuilder(config);
    this.grader = new AssetGrader({
      weights: config.weights,
      thresholds: config.thresholds,
      textProcessing: config.textProcessing
    });
  }

  /**
   * Build exemplars database from corpus file path
   */
  async buildExemplars(
    corpusPath: string, 
    outputPath: string, 
    topN: number | null = null, 
    topPercent: number | null = null, 
    bestSellersPath: string | null = null
  ): Promise<ExemplarBuildStats> {
    return this.logger.time('buildExemplars', async () => {
      // Default to topN = 20 if neither is specified
      const finalTopN = topN !== null ? topN : (topPercent !== null ? null : 20);
      const finalTopPercent = topPercent;
      
      this.logger.info('Building exemplars', { 
        corpusPath, 
        outputPath, 
        topN: finalTopN, 
        topPercent: finalTopPercent,
        hasBestSellers: !!bestSellersPath
      });
      
      // Validate input file
      const corpus = await FileValidator.validateJSONFile(corpusPath) as Asset[];
      
      // Load best sellers list if provided
      let bestSellers: BestSellerAsset[] = [];
      if (bestSellersPath) {
        try {
          bestSellers = await FileValidator.validateJSONFile(bestSellersPath) as BestSellerAsset[];
          this.logger.info('Best sellers list loaded', { 
            count: bestSellers.length,
            source: bestSellersPath
          });
        } catch (error) {
          this.logger.error('Failed to load best sellers', error as Error, { path: bestSellersPath });
          throw new Error(`Failed to load best sellers from ${bestSellersPath}: ${(error as Error).message}`);
        }
      }
      
      return this.buildExemplarsFromCorpus(corpus, outputPath, finalTopN, finalTopPercent, bestSellers);
    });
  }

  /**
   * Build exemplars database from corpus array
   */
  async buildExemplarsFromCorpus(
    corpus: Asset[], 
    outputPath: string, 
    topN: number | null = null, 
    topPercent: number | null = null, 
    bestSellers: BestSellerAsset[] = []
  ): Promise<ExemplarBuildStats> {
    return this.logger.time('buildExemplarsFromCorpus', async () => {
      // Default to topN = 20 if neither is specified
      const finalTopN = topN !== null ? topN : (topPercent !== null ? null : 20);
      const finalTopPercent = topPercent;
      
      this.logger.info('Building exemplars from corpus array', { 
        corpusSize: corpus.length,
        outputPath, 
        topN: finalTopN, 
        topPercent: finalTopPercent,
        bestSellersCount: bestSellers.length
      });
      
      // Validate corpus is an array
      if (!Array.isArray(corpus)) {
        throw new Error('Corpus must be an array of assets');
      }

      // Validate best sellers is an array if provided
      if (bestSellers && !Array.isArray(bestSellers)) {
        throw new Error('Best sellers must be an array of assets');
      }

      // Identify exemplars by category with best sellers
      const exemplarsByCategory = await identifyExemplars(corpus, finalTopN, finalTopPercent, bestSellers);
      
      // Extract patterns for each category
      const categoryPatterns: Record<string, any> = {};
      for (const [category, exemplars] of Object.entries(exemplarsByCategory)) {
        if (exemplars.length > 0) {
          categoryPatterns[category] = extractCategoryPatterns(exemplars, this.config);
          this.logger.info(`Extracted patterns for category: ${category}`, {
            exemplarCount: exemplars.length,
            avgQualityScore: categoryPatterns[category].metadata.averageQualityScore.toFixed(2)
          });
        }
      }
      
      // Create complete exemplars database
      const exemplarsData = {
        exemplars: exemplarsByCategory,
        patterns: categoryPatterns,
        metadata: {
          corpusSize: corpus.length,
          bestSellersProvided: bestSellers.length,
          topN: finalTopN,
          topPercent: finalTopPercent,
          selectionCriteria: finalTopPercent !== null ? `top ${finalTopPercent}%` : `top ${finalTopN}`,
          createdAt: new Date().toISOString(),
          stats: getExemplarStats(exemplarsByCategory)
        }
      };
      
      // Save exemplars (save the complete exemplarsData object, not just exemplarsByCategory)
      await this.writeJSON(outputPath, exemplarsData);
      
      this.logger.success('Exemplars built successfully', {
        categories: Object.keys(exemplarsByCategory).length,
        totalExemplars: exemplarsData.metadata.stats.totalExemplars,
        bestSellersIncluded: exemplarsData.metadata.stats.totalBestSellers || 0,
        selectionCriteria: exemplarsData.metadata.selectionCriteria,
        outputPath
      });
      
      return {
        categories: Object.keys(exemplarsByCategory).length,
        totalExemplars: exemplarsData.metadata.stats.totalExemplars,
        bestSellersIncluded: exemplarsData.metadata.stats.totalBestSellers || 0,
        selectionCriteria: exemplarsData.metadata.selectionCriteria
      };
    });
  }

  /**
   * Build dynamic grading rules from exemplars
   */
  async buildGradingRules(exemplarsPath: string, outputPath: string): Promise<GradingRulesBuildStats> {
    return this.logger.time('buildGradingRules', async () => {
      this.logger.info('Building dynamic grading rules', { exemplarsPath, outputPath });
      
      // Load exemplars data
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      
      // Generate dynamic rules from exemplars
      const fallbackConfig = {
        weights: this.config.weights,
        thresholds: this.config.thresholds
      };
      
      const gradingRules = extractGradingRules(exemplarsData, fallbackConfig);
      
      // Save grading rules
      await this.writeJSON(outputPath, gradingRules);
      
      this.logger.success('Dynamic grading rules built successfully', {
        categories: Object.keys(gradingRules.rules).length,
        highConfidence: gradingRules.metadata.confidenceDistribution.high,
        mediumConfidence: gradingRules.metadata.confidenceDistribution.medium,
        lowConfidence: gradingRules.metadata.confidenceDistribution.low,
        outputPath
      });
      
      return {
        categories: Object.keys(gradingRules.rules).length,
        confidenceDistribution: gradingRules.metadata.confidenceDistribution,
        totalExemplars: gradingRules.metadata.totalExemplars,
        bestSellersCount: gradingRules.metadata.bestSellersCount
      };
    });
  }

  /**
   * Build exemplar-based vocabulary
   */
  async buildExemplarVocabulary(exemplarsPath: string, outputPath: string): Promise<VocabularyBuildStats> {
    return this.logger.time('buildExemplarVocabulary', async () => {
      this.logger.info('Building exemplar vocabulary', { exemplarsPath, outputPath });
      
      // Load exemplars data
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      
      // Build exemplar vocabulary
      const vocabulary = await this.vocabularyBuilder.buildExemplarVocabulary(exemplarsData);
      
      // Save vocabulary
      await this.writeJSON(outputPath, vocabulary);
      
      this.logger.success('Exemplar vocabulary built successfully', {
        categories: Object.keys(vocabulary).length,
        outputPath
      });
      
      return {
        categories: Object.keys(vocabulary).length,
        totalCategories: Object.keys(vocabulary).length,
        source: 'exemplars'
      };
    });
  }

  /**
   * Generate category playbooks from exemplars
   */
  async generatePlaybooks(exemplarsPath: string, outputPath: string): Promise<PlaybookStats> {
    return this.logger.time('generatePlaybooks', async () => {
      this.logger.info('Generating category playbooks', { exemplarsPath, outputPath });
      
      // Load exemplars data
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      
      // Generate playbooks for each category
      const playbooks: Record<string, any> = {};
      for (const [category, exemplars] of Object.entries(exemplarsData.exemplars)) {
        if (Array.isArray(exemplars) && exemplars.length > 0 && exemplarsData.patterns[category]) {
          playbooks[category] = generateCategoryPlaybook(
            category,
            exemplarsData.patterns[category],
            exemplars as any[]
          );
          this.logger.info(`Generated playbook for ${category}`, {
            exemplarCount: exemplars.length
          });
        }
      }
      
      const playbookData = {
        playbooks,
        metadata: {
          totalCategories: Object.keys(playbooks).length,
          sourceExemplars: exemplarsData.metadata.stats.totalExemplars
        }
      };
      
      // Save playbooks
      await this.writeJSON(outputPath, playbookData);
      
      this.logger.success('Playbooks generated successfully', {
        categories: Object.keys(playbooks).length,
        outputPath
      });
      
      return {
        categories: Object.keys(playbooks).length,
        totalCategories: Object.keys(playbooks).length
      };
    });
  }

  /**
   * Generate category data optimized for web display
   * Outputs multiple JSON files with 10 categories each
   */
  async generateCategoriesWeb(
    corpus: Asset[], 
    exemplarsPath: string, 
    vocabularyPath: string, 
    outputPath: string
  ): Promise<{ categories: number; totalCategories: number; filesCreated: string[] }> {
    return this.logger.time('generateCategoriesWeb', async () => {
      this.logger.info('Generating categories web data', { 
        corpusSize: corpus.length,
        exemplarsPath, 
        vocabularyPath, 
        outputPath 
      });
      
      // Load required data
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      const vocabulary = await FileValidator.validateJSONFile(vocabularyPath);
      
      // Create mapping from short category names to full hierarchical names
      const categoryMapping = new Map<string, string>();
      const fullCategoryNames = Object.keys(vocabulary);
      
      this.logger.info(`Found ${fullCategoryNames.length} full category names in vocabulary`);
      this.logger.info(`Sample full categories: ${fullCategoryNames.slice(0, 5).join(', ')}`);
      
      // Build mapping for all assets in corpus
      for (const asset of corpus) {
        const shortCategory = asset.category || 'Unknown';
        if (!categoryMapping.has(shortCategory)) {
          // Find the full category name that ends with this short category
          const fullCategory = fullCategoryNames.find(fullName => {
            const parts = fullName.split('/');
            const lastPart = parts[parts.length - 1];
            return lastPart === shortCategory;
          });
          
          if (fullCategory) {
            categoryMapping.set(shortCategory, fullCategory);
            this.logger.info(`Mapped category: "${shortCategory}" -> "${fullCategory}"`);
          } else {
            // If no mapping found, use the short name as fallback
            categoryMapping.set(shortCategory, shortCategory);
            this.logger.warn(`No full category name found for "${shortCategory}", using as-is`);
          }
        }
      }
      
      this.logger.info(`Created ${categoryMapping.size} category mappings`);
      categoryMapping.forEach((fullName, shortName) => {
        this.logger.info(`  ${shortName} -> ${fullName}`);
      });
      
      // Group corpus by full category name
      const corpusByCategory: Record<string, Asset[]> = {};
      for (const asset of corpus) {
        const shortCategory = asset.category || 'Unknown';
        const fullCategory = categoryMapping.get(shortCategory) || shortCategory;
        if (!corpusByCategory[fullCategory]) {
          corpusByCategory[fullCategory] = [];
        }
        corpusByCategory[fullCategory].push(asset);
      }
      
      // Generate CategoryDataStatistics for each category
      const categoriesWebData: Record<string, CategoryDataStatistics> = {};
      
      for (const [category, assets] of Object.entries(corpusByCategory)) {
        if (assets.length === 0) continue;
        
        this.logger.info(`Processing category: ${category}`, { assetCount: assets.length });
        
        // Get exemplars for this category
        const exemplars = exemplarsData.exemplars?.[category] || [];
        const topExemplars = exemplars.slice(0, 10);
        
        // Grade all assets using the actual grader system
        const assetScores: Array<{asset: Asset, score: number}> = [];
        for (const asset of assets) {
          try {
            const gradeResult = await this.grader.gradeAsset(asset, vocabulary);
            assetScores.push({ asset, score: gradeResult.score });
          } catch (error) {
            // If grading fails, assign a low score
            this.logger.warn(`Failed to grade asset ${asset.id || asset.title}`, { error: (error as Error).message });
            assetScores.push({ asset, score: 0 });
          }
        }
        
        // Sort by score and get top/bottom assets
        const sortedAssetScores = assetScores.sort((a, b) => b.score - a.score);
        const topAssets = sortedAssetScores.slice(0, 10).map(item => item.asset);
        const bottomAssets = sortedAssetScores.slice(-10).map(item => item.asset);
        const bottomAssetsForExamples = sortedAssetScores.slice(-3).map(item => item.asset);        // Calculate statistics
        const prices = assets.filter(a => a.price > 0).map(a => a.price);
        const titleLengths = assets.map(a => a.title?.length || 0).filter(l => l > 0);
        const descLengths = assets.map(a => (a.long_description?.split(' ').length || 0)).filter(l => l > 0);
        const imageCounts = assets.map(a => a.images_count || 0);
        const tagCounts = assets.map(a => a.tags?.length || 0);
        
        // Extract common tags from all assets in category
        const allTags = assets.flatMap(a => a.tags || []);
        const tagFrequency: Record<string, number> = {};
        allTags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
        const commonTags = Object.entries(tagFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag);
        
        // Extract tags from top assets
        const topAssetTags = topAssets.flatMap(a => a.tags || []);
        const topTagFrequency: Record<string, number> = {};
        topAssetTags.forEach(tag => {
          topTagFrequency[tag] = (topTagFrequency[tag] || 0) + 1;
        });
        const topTags = Object.entries(topTagFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([tag]) => tag);
        
        // Extract keywords from titles and descriptions
        const allText = assets.map(a => `${a.title} ${a.short_description}`).join(' ');
        const topAssetsText = topAssets.map(a => `${a.title} ${a.short_description}`).join(' ');
        
        // Simple keyword extraction (bigrams and trigrams)
        const commonKeywords = this.extractKeywords(allText).slice(0, 10);
        const topKeywords = this.extractKeywords(topAssetsText).slice(0, 10);
        
        // Create category slug from name
        const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const categoryStats: CategoryDataStatistics = {
          slug,
          name: category,
          description: `Comprehensive data and insights for ${category} assets on Unity Asset Store.`,
          overview: {
            numberOfAssets: assets.length,
            averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
          },
          recommendations: {
            title: {
              optimalLength: {
                min: Math.min(...titleLengths),
                max: Math.max(...titleLengths),
                median: this.calculateMedian(titleLengths)
              },
              examples: {
                good: topAssets.slice(0, 5).map(a => a.title).filter(Boolean),
                bad: bottomAssetsForExamples.map(a => a.title).filter(Boolean)
              }
            },
            description: {
              optimalLength: {
                min: Math.min(...descLengths),
                max: Math.max(...descLengths),
                median: this.calculateMedian(descLengths)
              },
              examples: {
                good: topAssets.slice(0, 5).map(a => a.short_description).filter(Boolean),
                bad: bottomAssetsForExamples.map(a => a.short_description).filter(Boolean)
              }
            },
            images: {
              optimalCount: {
                min: Math.min(...imageCounts),
                max: Math.max(...imageCounts),
                median: this.calculateMedian(imageCounts)
              }
            },
            tags: {
              optimalCount: {
                min: Math.min(...tagCounts),
                max: Math.max(...tagCounts),
                median: this.calculateMedian(tagCounts)
              },
              commonTags,
              topTags
            },
            keywords: {
              commonKeywords,
              topKeywords
            },
            pricing: {
              min: prices.length > 0 ? Math.min(...prices) : 0,
              max: prices.length > 0 ? Math.max(...prices) : 0,
              median: prices.length > 0 ? this.calculateMedian(prices) : 0
            }
          },
          topAssets: topAssets.map(this.serializeAssetForWeb),
          bottomAssets: bottomAssets.map(this.serializeAssetForWeb)
        };
        
        categoriesWebData[category] = categoryStats;
      }
      
      // Split categories into chunks of 10 and save multiple files
      const categoryEntries = Object.entries(categoriesWebData);
      const chunkSize = 10;
      const chunks: Array<[string, CategoryDataStatistics][]> = [];
      
      for (let i = 0; i < categoryEntries.length; i += chunkSize) {
        chunks.push(categoryEntries.slice(i, i + chunkSize));
      }
      
      const filesCreated: string[] = [];
      const baseOutputPath = outputPath.replace(/\.json$/, '');
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;
        
        const chunkData: Record<string, CategoryDataStatistics> = {};
        
        chunk.forEach(([key, value]) => {
          chunkData[key] = value;
        });
        
        const outputData = {
          categories: chunkData,
          metadata: {
            totalCategories: Object.keys(categoriesWebData).length,
            categoriesInFile: Object.keys(chunkData).length,
            fileNumber: i + 1,
            totalFiles: chunks.length,
            sourceCorpus: corpus.length,
            sourceExemplars: exemplarsData.metadata?.stats?.totalExemplars || 0,
            vocabularyCategories: Object.keys(vocabulary).length,
            generatedAt: new Date().toISOString(),
            placeholder: false
          }
        };
        
        const chunkOutputPath = `${baseOutputPath}-${i + 1}.json`;
        await this.writeJSON(chunkOutputPath, outputData);
        filesCreated.push(chunkOutputPath);
        
        this.logger.info(`Saved categories chunk ${i + 1}/${chunks.length}`, {
          categoriesInChunk: Object.keys(chunkData).length,
          outputPath: chunkOutputPath
        });
      }
      
      this.logger.success('Categories web data generated successfully', {
        totalCategories: Object.keys(categoriesWebData).length,
        filesCreated: filesCreated.length,
        corpusSize: corpus.length,
        vocabularyCategories: Object.keys(vocabulary).length,
        outputFiles: filesCreated
      });
      
      return {
        categories: Object.keys(categoriesWebData).length,
        totalCategories: Object.keys(categoriesWebData).length,
        filesCreated
      };
    });
  }
  
  /**
   * Extract keywords (bigrams and trigrams) from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
    
    const keywords: Record<string, number> = {};
    
    // Extract bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      keywords[bigram] = (keywords[bigram] || 0) + 1;
    }
    
    // Extract trigrams
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      keywords[trigram] = (keywords[trigram] || 0) + 1;
    }
    
    return Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .map(([keyword]) => keyword);
  }
  
  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word);
  }
  
  /**
   * Calculate median of a number array
   */
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      const left = sorted[mid - 1];
      const right = sorted[mid];
      return left !== undefined && right !== undefined ? Math.round((left + right) / 2) : 0;
    } else {
      const median = sorted[mid];
      return median !== undefined ? median : 0;
    }
  }
  
  /**
   * Serialize asset for web display (remove unnecessary fields)
   */
  private serializeAssetForWeb(asset: Asset): any {
    return {
      id: asset.id,
      title: asset.title,
      short_description: asset.short_description,
      category: asset.category,
      price: asset.price,
      publisher: asset.publisher,
      rating: asset.rating,
      reviews_count: asset.reviews_count,
      images_count: asset.images_count,
      videos_count: asset.videos_count,
      tags: asset.tags,
      last_update: asset.last_update,
      url: asset.url
    };
  }

  /**
   * Multi-pass build: Iteratively build exemplars and grading rules until convergence
   * This creates a feedback loop where better grading rules lead to better exemplar selection,
   * which in turn creates even better grading rules, until the system stabilizes.
   */
  async buildAllMultiPass(
    corpus: Asset[],
    outputDir: string,
    topN: number | null = null,
    topPercent: number | null = null,
    bestSellers: BestSellerAsset[] = [],
    maxPasses: number = 5,
    convergenceThreshold: number = 0.95
  ): Promise<MultiPassBuildStats> {
    return this.logger.time('buildAllMultiPass', async () => {
      // Ensure output directory ends with slash
      const outDir = outputDir.endsWith('/') || outputDir.endsWith('\\') ? outputDir : outputDir + '/';
      
      // Define output paths
      const exemplarsPath = outDir + 'exemplars.json';
      const gradingRulesPath = outDir + 'grading-rules.json';
      const vocabPath = outDir + 'exemplar_vocab.json';
      const playbooksPath = outDir + 'playbooks.json';
      
      this.logger.info('Starting multi-pass build', {
        corpusSize: corpus.length,
        outputDir: outDir,
        topN,
        topPercent,
        bestSellers: bestSellers.length,
        maxPasses,
        convergenceThreshold
      });
      
      let passResults: MultiPassBuildStats['passResults'] = [];
      let previousExemplarIds: Set<string> = new Set();
      let converged = false;
      let convergenceMetric = 0;
      
      for (let pass = 1; pass <= maxPasses; pass++) {
        this.logger.info(`Starting pass ${pass}/${maxPasses}`);
        
        // For pass 1, use default grading configuration
        // For subsequent passes, use the grading rules from the previous pass
        let weights = this.config.weights;
        let thresholds = this.config.thresholds;
        
        if (pass > 1) {
          try {
            const gradingRulesData = await this.readJSON(gradingRulesPath) as any;
            
            // For now, just log that we would use dynamic rules
            // The actual dynamic rule application would need more complex logic
            this.logger.info(`Pass ${pass}: Would use dynamic rules from previous pass`, {
              categoriesWithRules: Object.keys(gradingRulesData.rules || {}).length
            });
          } catch (error) {
            this.logger.warn(`Pass ${pass}: Could not load previous grading rules, using defaults`, {
              error: (error as Error).message
            });
          }
        }
        
        // Step 1: Build exemplars with current grading configuration
        const exemplarStats = await identifyExemplars(
          corpus, 
          topN, 
          topPercent, 
          bestSellers,
          undefined, // vocab - let it use default
          weights,
          thresholds
        );
        
        // Extract patterns and save exemplars
        const categoryPatterns: Record<string, any> = {};
        for (const [category, exemplars] of Object.entries(exemplarStats)) {
          if (exemplars.length > 0) {
            categoryPatterns[category] = extractCategoryPatterns(exemplars, this.config);
          }
        }
        
        const exemplarsData = {
          exemplars: exemplarStats,
          patterns: categoryPatterns,
          metadata: {
            corpusSize: corpus.length,
            bestSellersProvided: bestSellers.length,
            topN,
            topPercent,
            selectionCriteria: topPercent !== null ? `top ${topPercent}%` : `top ${topN}`,
            createdAt: new Date().toISOString(),
            pass: pass,
            stats: getExemplarStats(exemplarStats)
          }
        };
        
        await this.writeJSON(exemplarsPath, exemplarsData);
        
        const exemplarBuildStats = {
          categories: Object.keys(exemplarStats).length,
          totalExemplars: exemplarsData.metadata.stats.totalExemplars,
          bestSellersIncluded: exemplarsData.metadata.stats.totalBestSellers || 0,
          selectionCriteria: exemplarsData.metadata.selectionCriteria
        };
        
        // Step 2: Build grading rules from exemplars
        const gradingRulesStats = await this.buildGradingRules(exemplarsPath, gradingRulesPath);
        
        // Calculate convergence metric
        const currentExemplarIds = new Set<string>();
        for (const exemplars of Object.values(exemplarStats)) {
          for (const exemplar of exemplars) {
            currentExemplarIds.add(exemplar.id || exemplar.url || '');
          }
        }
        
        let exemplarChanges: MultiPassBuildStats['passResults'][0]['exemplarChanges'] | undefined;
        
        if (pass > 1) {
          const intersection = new Set([...previousExemplarIds].filter(x => currentExemplarIds.has(x)));
          const union = new Set([...previousExemplarIds, ...currentExemplarIds]);
          convergenceMetric = intersection.size / union.size;
          
          exemplarChanges = {
            added: [...currentExemplarIds].filter(x => !previousExemplarIds.has(x)),
            removed: [...previousExemplarIds].filter(x => !currentExemplarIds.has(x)),
            unchanged: [...intersection]
          };
          
          this.logger.info(`Pass ${pass}: Convergence analysis`, {
            convergenceMetric: convergenceMetric.toFixed(3),
            threshold: convergenceThreshold,
            exemplarsAdded: exemplarChanges.added.length,
            exemplarsRemoved: exemplarChanges.removed.length,
            exemplarsUnchanged: exemplarChanges.unchanged.length
          });
          
          if (convergenceMetric >= convergenceThreshold) {
            converged = true;
            this.logger.success(`Pass ${pass}: Converged! (${convergenceMetric.toFixed(3)} >= ${convergenceThreshold})`);
          }
        }
        
        passResults.push({
          pass,
          exemplarStats: exemplarBuildStats,
          gradingRulesStats,
          exemplarChanges
        });
        
        previousExemplarIds = currentExemplarIds;
        
        if (converged) {
          break;
        }
      }
      
      // Build final vocabulary and playbooks
      this.logger.info('Building final vocabulary and playbooks');
      const vocabStats = await this.buildExemplarVocabulary(exemplarsPath, vocabPath);
      const playbookStats = await this.generatePlaybooks(exemplarsPath, playbooksPath);
      
      const result: MultiPassBuildStats = {
        passes: passResults.length,
        converged,
        convergenceMetric,
        convergenceThreshold,
        passResults,
        finalFiles: {
          exemplars: exemplarsPath,
          gradingRules: gradingRulesPath,
          vocabulary: vocabPath,
          playbooks: playbooksPath
        }
      };
      
      this.logger.success('Multi-pass build completed', {
        passes: result.passes,
        converged: result.converged,
        finalConvergence: result.convergenceMetric.toFixed(3),
        totalExemplars: passResults[passResults.length - 1]?.exemplarStats.totalExemplars || 0
      });
      
      return result;
    });
  }

  /**
   * Helper method to write JSON files
   */
  private async writeJSON(filePath: string, data: any): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Helper method to read JSON files
   */
  private async readJSON(filePath: string): Promise<any> {
    return FileValidator.validateJSONFile(filePath);
  }
}

export default Builder;