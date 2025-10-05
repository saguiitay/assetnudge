/**
 * Dynamic Asset Grader
 * Uses category-specific rules derived from exemplars with composition approach
 */

import { AssetGrader } from './grader.js';
import { Logger } from './utils/logger.js';
import { Asset as ValidatedAsset } from './utils/validation.js';
import { 
  Vocabulary, 
  GradeResult, 
  CategoryRules,
  DynamicGradingRulesFile,
  GraderConfig
} from './types.js';

const logger = new Logger('dynamic-grader');

/**
 * Dynamic Asset Grader that uses category-specific rules derived from exemplars
 */
export class DynamicAssetGrader {
  private dynamicRules: DynamicGradingRulesFile;
  private baseConfig: GraderConfig;
  private dynamicLogger: Logger;
  
  constructor(config: GraderConfig, dynamicRules: DynamicGradingRulesFile) {
    this.baseConfig = config;
    this.dynamicRules = dynamicRules;
    this.dynamicLogger = logger.child('dynamic-scorer');
    
    this.dynamicLogger.info('Dynamic Asset Grader initialized', {
      categories: Object.keys(dynamicRules.rules).length,
      fallbackAvailable: !!dynamicRules.fallbackRules
    });
  }
  
  /**
   * Grade asset using dynamic rules for the asset's category
   * @param asset - Asset to grade
   * @param vocab - Category vocabulary
   * @returns Grade result with dynamic rule explanations
   */
  async gradeAsset(asset: ValidatedAsset, vocab: Vocabulary): Promise<GradeResult> {
    return this.dynamicLogger.time('gradeAsset', async () => {
      // Get category-specific rules
      const categoryRules = this.getCategoryRules(asset.category);
      
      this.dynamicLogger.debug('Grading asset with dynamic rules', {
        title: asset.title,
        category: asset.category,
        rulesSource: categoryRules ? 'dynamic' : 'fallback',
        confidence: categoryRules?.confidence.level
      });
      
      // Create grader config with dynamic rules
      let graderConfig: GraderConfig;
      
      if (categoryRules) {
        graderConfig = {
          weights: categoryRules.weights,
          thresholds: categoryRules.thresholds
        };
      } else if (this.dynamicRules.fallbackRules) {
        graderConfig = {
          weights: this.dynamicRules.fallbackRules.weights,
          thresholds: this.dynamicRules.fallbackRules.thresholds
        };
      } else {
        // Use base config as final fallback
        graderConfig = this.baseConfig;
      }
      
      // Create grader with dynamic config
      const grader = new AssetGrader(graderConfig);
      
      // Grade using dynamic configuration
      const result = await grader.gradeAsset(asset, vocab);
      
      // Enhance result with dynamic rule information
      const enhancedResult = this.enhanceGradeResult(result, asset, categoryRules);
      
      this.dynamicLogger.info('Asset graded with dynamic rules', {
        title: asset.title,
        score: enhancedResult.score,
        letter: enhancedResult.letter,
        rulesConfidence: categoryRules?.confidence.level || 'fallback'
      });
      
      return enhancedResult;
    });
  }
  
  /**
   * Get category-specific rules
   * @param category - Asset category
   * @returns Category rules or null if not found
   */
  private getCategoryRules(category: string): CategoryRules | null {
    if (!category) return null;
    
    // Direct match
    if (this.dynamicRules.rules[category]) {
      return this.dynamicRules.rules[category];
    }
    
    // Try normalized category name
    const normalizedCategory = this.normalizeCategory(category);
    if (this.dynamicRules.rules[normalizedCategory]) {
      return this.dynamicRules.rules[normalizedCategory];
    }
    
    // Try partial matches
    const categories = Object.keys(this.dynamicRules.rules);
    const partialMatch = categories.find(cat => 
      cat.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(cat.toLowerCase())
    );
    
    if (partialMatch) {
      this.dynamicLogger.debug(`Using partial category match: "${partialMatch}" for "${category}"`);
      return this.dynamicRules.rules[partialMatch] || null;
    }
    
    this.dynamicLogger.debug(`No dynamic rules found for category: "${category}"`);
    return null;
  }
  
  /**
   * Normalize category name for matching
   * @param category - Raw category name
   * @returns Normalized category name
   */
  private normalizeCategory(category: string): string {
    return category
      .trim()
      .replace(/[^a-zA-Z0-9\s&-]/g, '') // Remove special chars except & and -
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase();
  }
  
  /**
   * Enhance grade result with dynamic rule information
   * @param result - Base grade result
   * @param asset - Graded asset
   * @param categoryRules - Rules used for grading
   * @returns Enhanced grade result
   */
  private enhanceGradeResult(
    result: GradeResult, 
    asset: ValidatedAsset, 
    categoryRules: CategoryRules | null
  ): GradeResult {
    const enhancedReasons = [...result.reasons];
    
    if (categoryRules) {
      // Add rule source information
      enhancedReasons.unshift(
        `✨ Graded using ${categoryRules.confidence.level}-confidence dynamic rules (${categoryRules.confidence.sampleSize} exemplars)`
      );
      
      // Add category-specific insights
      if (categoryRules.successPatterns.length > 0) {
        enhancedReasons.push(
          `📈 Category success pattern: ${categoryRules.successPatterns[0]}`
        );
      }
      
      // Add benchmarking information
      const ratingBenchmark = categoryRules.benchmarks.rating.target;
      const currentRating = asset.rating || 0;
      if (currentRating > 0) {
        if (currentRating >= ratingBenchmark) {
          enhancedReasons.push(
            `⭐ Rating ${currentRating.toFixed(1)} meets category benchmark (${ratingBenchmark.toFixed(1)})`
          );
        } else {
          enhancedReasons.push(
            `⚠️ Rating ${currentRating.toFixed(1)} below category benchmark (${ratingBenchmark.toFixed(1)})`
          );
        }
      }
      
      // Add media benchmarking
      const imagesBenchmark = categoryRules.benchmarks.media.targetImages;
      const currentImages = asset.images_count || 0;
      if (currentImages >= imagesBenchmark) {
        enhancedReasons.push(
          `📸 ${currentImages} images meets category standard (${imagesBenchmark}+ expected)`
        );
      } else {
        enhancedReasons.push(
          `📸 ${currentImages} images below category standard (${imagesBenchmark}+ recommended)`
        );
      }
      
      // Add weight importance insights
      const topImportance = this.getTopWeightImportance(categoryRules.weightImportance);
      enhancedReasons.push(
        `🎯 Category focus: ${topImportance} (${categoryRules.weightImportance[topImportance as keyof typeof categoryRules.weightImportance]}% weight)`
      );
      
    } else {
      // Using fallback rules
      enhancedReasons.unshift(
        `🔄 Graded using fallback rules (no dynamic rules available for "${asset.category}")`
      );
    }
    
    return {
      ...result,
      reasons: enhancedReasons
    };
  }
  
  /**
   * Get the most important weight category
   * @param importance - Weight importance data
   * @returns Top importance category
   */
  private getTopWeightImportance(importance: any): string {
    const categories = ['content', 'media', 'trust', 'findability', 'performance'];
    let topCategory = 'content';
    let topValue = 0;
    
    for (const category of categories) {
      const value = importance[category] || 0;
      if (value > topValue) {
        topValue = value;
        topCategory = category;
      }
    }
    
    return topCategory;
  }
  
  /**
   * Get category benchmarks for external use
   * @param category - Category name
   * @returns Category benchmarks or null
   */
  public getCategoryBenchmarks(category: string) {
    const rules = this.getCategoryRules(category);
    return rules?.benchmarks || null;
  }
  
  /**
   * Get available categories with dynamic rules
   * @returns Array of category names
   */
  public getAvailableCategories(): string[] {
    return Object.keys(this.dynamicRules.rules);
  }
  
  /**
   * Get rule confidence for a category
   * @param category - Category name
   * @returns Rule confidence or null
   */
  public getRuleConfidence(category: string) {
    const rules = this.getCategoryRules(category);
    return rules?.confidence || null;
  }
  
  /**
   * Get success patterns for a category
   * @param category - Category name
   * @returns Success patterns array
   */
  public getSuccessPatterns(category: string): string[] {
    const rules = this.getCategoryRules(category);
    return rules?.successPatterns || [];
  }
  
  /**
   * Get common failures for a category
   * @param category - Category name
   * @returns Common failures array
   */
  public getCommonFailures(category: string): string[] {
    const rules = this.getCategoryRules(category);
    return rules?.commonFailures || [];
  }
}