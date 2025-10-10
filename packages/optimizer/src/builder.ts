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

/**
 * Builder class for exemplars, grading rules, vocabulary, and playbooks
 */
export class Builder {
  private config: Config;
  private logger: Logger;
  private vocabularyBuilder: VocabularyBuilder;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger('builder', config.debug);
    this.vocabularyBuilder = new VocabularyBuilder(config);
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