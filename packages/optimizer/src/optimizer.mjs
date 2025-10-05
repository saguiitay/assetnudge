/**
 * Unity Asset Optimizer - Main Orchestrator
 * Coordinates all modules and provides the main CLI interface
 */

import fs from 'fs';
import path from 'path';

// Core modules
import Config from './config';
import { Logger } from './utils/logger';
import { URLValidator, FileValidator } from './utils/validation';
import VocabularyBuilder from './vocabulary';
import AssetGrader from './grader';
import SimilarityEngine from './similarity';
import AISuggestionEngine from './ai-suggestions';
import HeuristicSuggestions from './heuristic-suggestions';

// External dependencies
import { scrapeAssetWithGraphQL } from './scrappers/graphql-scraper';

// Rating analysis and dynamic grading
import { calculateDetailedRating } from './utils/rating-analysis';
import { extractGradingRules } from './dynamic-grading-rules';
import { DynamicAssetGrader } from './dynamic-asset-grader';

// Exemplar and pattern modules
import { identifyExemplars, saveExemplars, getExemplarStats } from './exemplars';
import { extractCategoryPatterns } from './pattern-extraction';
import { generateCategoryPlaybook, generateExemplarRecommendations } from './exemplar-coaching';

/**
 * Main optimizer class that orchestrates all functionality
 */
export class UnityAssetOptimizer {
  constructor(args = []) {
    this.config = Config.fromEnvironment(args);
    this.logger = new Logger('optimizer', this.config.debug);
    
    // Initialize modules
    this.vocabularyBuilder = new VocabularyBuilder(this.config);
    this.grader = new AssetGrader(this.config);
    this.similarityEngine = new SimilarityEngine(this.config);
    this.aiEngine = new AISuggestionEngine(this.config);
    this.heuristicEngine = new HeuristicSuggestions(this.config);
    
    this.logger.info('Unity Asset Optimizer initialized', {
      hasAI: this.config.hasAI(),
      debug: this.config.debug
    });
  }

  /**
   * Validate configuration and dependencies
   */
  async validateSetup() {
    this.logger.info('Validating setup...');
    
    const issues = this.config.validate();
    
    if (issues.length > 0) {
      issues.forEach(issue => this.logger.warn(issue));
    }

    // Test AI connection if available
    if (this.config.hasAI()) {
      const aiTest = await this.aiEngine.testConnection();
      if (aiTest.success) {
        this.logger.success('AI connection test passed', { model: aiTest.model });
      } else {
        this.logger.error('AI connection test failed', null, { error: aiTest.error });
      }
    }

    return issues;
  }

  /**
   * Build exemplars database from corpus file path
   */
  async buildExemplars(corpusPath, outputPath, topN = null, topPercent = null, bestSellersPath = null) {
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
      const corpus = await FileValidator.validateJSONFile(corpusPath);
      
      // Load best sellers list if provided
      let bestSellers = [];
      if (bestSellersPath) {
        try {
          bestSellers = await FileValidator.validateJSONFile(bestSellersPath);
          this.logger.info('Best sellers list loaded', { 
            count: bestSellers.length,
            source: bestSellersPath
          });
        } catch (error) {
          this.logger.error('Failed to load best sellers', error, { path: bestSellersPath });
          throw new Error(`Failed to load best sellers from ${bestSellersPath}: ${error.message}`);
        }
      }
      
      return this.buildExemplarsFromCorpus(corpus, outputPath, finalTopN, finalTopPercent, bestSellers);
    });
  }

  /**
   * Build exemplars database from corpus array
   */
  async buildExemplarsFromCorpus(corpus, outputPath, topN = null, topPercent = null, bestSellers = []) {
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
      const exemplarsByCategory = identifyExemplars(corpus, finalTopN, finalTopPercent, bestSellers);
      
      // Extract patterns for each category
      const categoryPatterns = {};
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
      
      // Save exemplars
      saveExemplars(exemplarsData, outputPath);
      
      this.logger.success('Exemplars built successfully', {
        categories: Object.keys(exemplarsByCategory).length,
        totalExemplars: exemplarsData.metadata.stats.totalExemplars,
        bestSellersIncluded: exemplarsData.metadata.stats.totalBestSellers || 0,
        selectionCriteria: exemplarsData.metadata.selectionCriteria,
        outputPath
      });
      
      return exemplarsData.metadata.stats;
    });
  }

  /**
   * Build dynamic grading rules from exemplars
   */
  async buildGradingRules(exemplarsPath, outputPath) {
    return this.logger.time('buildGradingRules', async () => {
      this.logger.info('Building dynamic grading rules', { exemplarsPath, outputPath });
      
      // Load exemplars data
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      
      // Import dynamic rules module
      const { extractGradingRules } = await import('./dynamic-grading-rules');
      
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
  async buildExemplarVocabulary(exemplarsPath, outputPath) {
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
  async generatePlaybooks(exemplarsPath, outputPath) {
    return this.logger.time('generatePlaybooks', async () => {
      this.logger.info('Generating category playbooks', { exemplarsPath, outputPath });
      
      // Load exemplars data
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      
      // Generate playbooks for each category
      const playbooks = {};
      for (const [category, exemplars] of Object.entries(exemplarsData.exemplars)) {
        if (exemplars.length > 0 && exemplarsData.patterns[category]) {
          playbooks[category] = generateCategoryPlaybook(
            category,
            exemplarsData.patterns[category],
            exemplars
          );
          this.logger.info(`Generated playbook for ${category}`, {
            exemplarCount: exemplars.length
          });
        }
      }
      
      const playbookData = {
        playbooks,
        metadata: {
          generatedAt: new Date().toISOString(),
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
   * Grade an asset using static or dynamic rules
   */
  async gradeAsset(assetPath, vocabPath = null, rulesPath = null) {
    return this.logger.time('gradeAsset', async () => {
      this.logger.info('Grading asset', { 
        assetPath, 
        vocabPath, 
        rulesPath,
        usingDynamicRules: !!rulesPath 
      });
      
      // Load asset data
      const asset = await FileValidator.validateJSONFile(assetPath);
      
      // Load vocabulary if provided
      let vocabulary = {};
      if (vocabPath) {
        vocabulary = await FileValidator.validateJSONFile(vocabPath);
      }
      
      // Grade the asset using dynamic or static rules
      let grade;
      let gradingMethod = 'static';
      
      if (rulesPath) {
        try {
          // Load dynamic rules
          const gradingRules = await FileValidator.validateJSONFile(rulesPath);
          
          // Import DynamicAssetGrader
          const { DynamicAssetGrader } = await import('./dynamic-asset-grader');
          
          // Create dynamic grader
          const dynamicGrader = new DynamicAssetGrader(this.config, gradingRules);
          
          // Grade with dynamic rules
          grade = await dynamicGrader.gradeAsset(asset, vocabulary);
          gradingMethod = 'dynamic';
          
          this.logger.info('Used dynamic grading rules', {
            categories: Object.keys(gradingRules.rules).length,
            assetCategory: asset.category
          });
          
        } catch (error) {
          this.logger.warn('Failed to load dynamic rules, falling back to static grading', error);
          grade = await this.grader.gradeAsset(asset, vocabulary);
          gradingMethod = 'static-fallback';
        }
      } else {
        // Use static grading
        grade = await this.grader.gradeAsset(asset, vocabulary);
      }
      
      this.logger.success('Asset graded', {
        title: asset.title,
        score: grade.score,
        letter: grade.letter,
        method: gradingMethod
      });
      
      return { 
        grade,
        metadata: {
          gradingMethod,
          assetCategory: asset.category,
          vocabProvided: !!vocabPath,
          rulesProvided: !!rulesPath,
          gradedAt: new Date().toISOString()
        }
      };
    });
  }

  /**
   * Scrape asset data from URL using GraphQL API (most reliable)
   */
  async scrapeAssetWithGraphQL(url, outputPath) {
    return this.logger.time('scrapeAssetWithGraphQL', async () => {
      this.logger.info('Scraping asset with GraphQL API', { url });
      
      // Validate URL
      URLValidator.validateAssetStoreURL(url);
      
      // Scrape the asset using GraphQL API
      const asset = await scrapeAssetWithGraphQL(url);
      
      // Save scraped data if output path provided
      if (outputPath) {
        await this.writeJSON(outputPath, asset);
      }
      
      this.logger.success('Asset scraped successfully with GraphQL API', {
        title: asset.title,
        category: asset.category,
        outputPath
      });
      
      return asset;
    });
  }

  /**
   * Comprehensive optimization analysis
   */
  async optimizeAsset(options) {
    return this.logger.time('optimizeAsset', async () => {
      const { input, url, vocabPath, exemplarsPath, neighborsPath, useAI = false } = options;
      
      this.logger.info('Starting comprehensive optimization', {
        hasInput: !!input,
        hasUrl: !!url,
        hasVocab: !!vocabPath,
        hasExemplars: !!exemplarsPath,
        hasNeighbors: !!neighborsPath,
        useAI
      });

      // Get asset data
      let asset;
      if (url) {
        URLValidator.validateAssetStoreURL(url);
        asset = await this.scrapeAssetWithGraphQL(url);
        this.logger.info('Asset scraped from URL', { title: asset.title, method: asset.scraping_method });
      } else if (input) {
        asset = await FileValidator.validateJSONFile(input);
        this.logger.info('Asset loaded from file', { title: asset.title });
      } else {
        throw new Error('Either input file or URL must be provided');
      }

      // Load vocabulary
      let vocabulary = {};
      if (vocabPath) {
        vocabulary = await FileValidator.validateJSONFile(vocabPath);
        this.logger.info('Vocabulary loaded', { categories: Object.keys(vocabulary).length });
      }

      // Perform grading
      const grade = await this.grader.gradeAsset(asset, vocabulary);
      
      // Choose coaching strategy: exemplar-based (preferred) or legacy similarity
      let suggestions, similarAssets = [], exemplarRecommendations = null;
      
      if (exemplarsPath) {
        // Use exemplar-based coaching (recommended approach)
        const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
        
        exemplarRecommendations = generateExemplarRecommendations(asset, exemplarsData, 5);
        this.logger.info('Exemplar-based recommendations generated', {
          recommendationCount: exemplarRecommendations.recommendations.length,
          neighborsUsed: exemplarRecommendations.neighbors.length,
          categoryAlignment: exemplarRecommendations.categoryAlignment.score
        });
        
        // Use heuristic suggestions as fallback for areas not covered by exemplars
        try {
          const heuristicSuggestions = {
            suggested_tags: this.heuristicEngine.suggestTags(asset, vocabulary),
            suggested_title: this.heuristicEngine.suggestTitle(asset, vocabulary),
            suggested_description: this.heuristicEngine.suggestDescription(asset, vocabulary),
            suggested_category: this.heuristicEngine.suggestCategory(asset, vocabulary),
            recommendations: [] // Individual methods don't provide recommendations array
          };
          suggestions = heuristicSuggestions;
        } catch (error) {
          this.logger.warn('Heuristic suggestions failed, using empty fallback', { error: error.message });
          suggestions = {
            suggested_tags: [],
            suggested_title: '',
            suggested_description: '',
            suggested_category: asset.category || '',
            recommendations: []
          };
        }
        
      } else if (neighborsPath) {
        // Legacy approach: similarity-based coaching
        const corpus = await FileValidator.validateJSONFile(neighborsPath);
        this.logger.info('Corpus loaded for similarity analysis', { size: corpus.length });
        
        similarAssets = await this.similarityEngine.findSimilarAssets(asset, corpus, 5);
        try {
          const heuristicSuggestions = {
            suggested_tags: this.heuristicEngine.suggestTags(asset, vocabulary),
            suggested_title: this.heuristicEngine.suggestTitle(asset, vocabulary),
            suggested_description: this.heuristicEngine.suggestDescription(asset, vocabulary),
            suggested_category: this.heuristicEngine.suggestCategory(asset, vocabulary),
            recommendations: [] // Individual methods don't provide recommendations array
          };
          suggestions = heuristicSuggestions;
        } catch (error) {
          this.logger.warn('Heuristic suggestions failed, using empty fallback', { error: error.message });
          suggestions = {
            suggested_tags: [],
            suggested_title: '',
            suggested_description: '',
            suggested_category: asset.category || '',
            recommendations: []
          };
        }
        
      } else {
        // Basic heuristic suggestions only
        try {
          const heuristicSuggestions = {
            suggested_tags: this.heuristicEngine.suggestTags(asset, vocabulary),
            suggested_title: this.heuristicEngine.suggestTitle(asset, vocabulary),
            suggested_description: this.heuristicEngine.suggestDescription(asset, vocabulary),
            suggested_category: this.heuristicEngine.suggestCategory(asset, vocabulary),
            recommendations: [] // Individual methods don't provide recommendations array
          };
          suggestions = heuristicSuggestions;
        } catch (error) {
          this.logger.warn('Heuristic suggestions failed, using empty fallback', { error: error.message });
          suggestions = {
            suggested_tags: [],
            suggested_title: '',
            suggested_description: '',
            suggested_category: asset.category || '',
            recommendations: []
          };
        }
      }

      // Generate AI suggestions if requested and available
      let aiSuggestions = null;
      if (useAI && this.config.hasAI()) {
        try {
          // For exemplar-based coaching, provide exemplar context to AI
          const aiContext = exemplarRecommendations ? {
            asset,
            vocab: vocabulary,
            neighbors: exemplarRecommendations.neighbors.map(n => ({
              title: n.title,
              url: n.url,
              tags: n.tags,
              description: n.short_description || n.long_description
            })),
            categoryAlignment: exemplarRecommendations.categoryAlignment,
            exemplarInsights: exemplarRecommendations.recommendations
          } : {
            asset,
            vocab: vocabulary,
            neighbors: similarAssets
          };
          
          aiSuggestions = await this.aiEngine.generateSuggestions(aiContext);
          this.logger.info('AI suggestions generated');
        } catch (error) {
          this.logger.warn('AI suggestions failed', { error: error.message });
        }
      }

      const result = {
        grade,
        // Legacy suggestions format (for backward compatibility)
        suggested_tags: suggestions?.suggested_tags || [],
        suggested_title: suggestions?.suggested_title || '',
        suggested_description: suggestions?.suggested_description || '',
        recommendations: suggestions?.recommendations || [],
        suggested_category: suggestions?.suggested_category || '',
        similar_assets: similarAssets,
        
        // Enhanced exemplar-based recommendations (new format)
        exemplar_coaching: exemplarRecommendations || null,
        ai_suggestions: aiSuggestions || null,
        
        analysis_metadata: {
          coaching_method: exemplarsPath ? 'exemplar-based' : (neighborsPath ? 'similarity-based' : 'heuristic-only'),
          ai_used: useAI && this.config.hasAI() && aiSuggestions !== null,
          vocabulary_categories: Object.keys(vocabulary).length,
          similar_assets_found: similarAssets.length,
          exemplar_neighbors: exemplarRecommendations?.neighbors?.length || 0,
          category_alignment: exemplarRecommendations?.categoryAlignment?.score || null,
          timestamp: new Date().toISOString()
        }
      };

      this.logger.success('Optimization analysis completed', {
        title: asset.title,
        score: grade.score,
        coachingMethod: result.analysis_metadata.coaching_method,
        recommendationsCount: (exemplarRecommendations?.recommendations?.length || 0) + (suggestions?.recommendations?.length || 0)
      });

      return result;
    });
  }

  /**
   * Generate heuristic suggestions
   */
  generateHeuristicSuggestions(asset, vocabulary) {
    return {
      suggested_tags: this.heuristicEngine.suggestTags(asset, vocabulary),
      suggested_title: this.heuristicEngine.suggestTitle(asset, vocabulary),
      suggested_description: this.heuristicEngine.suggestDescription(asset, vocabulary),
      recommendations: this.heuristicEngine.generateRecommendations(asset, vocabulary),
      suggested_category: this.heuristicEngine.suggestCategory(asset, vocabulary)
    };
  }

  /**
   * Batch processing for multiple assets
   */
  async batchOptimize(assets, vocabulary = {}, corpus = []) {
    return this.logger.time('batchOptimize', async () => {
      this.logger.info('Starting batch optimization', {
        assetCount: assets.length,
        hasVocab: Object.keys(vocabulary).length > 0,
        hasCorpus: corpus.length > 0
      });

      const results = [];
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        try {
          this.logger.progress('Batch processing', i + 1, assets.length, {
            currentAsset: asset.title
          });

          const grade = await this.grader.gradeAsset(asset, vocabulary);
          const suggestions = this.generateHeuristicSuggestions(asset, vocabulary);
          
          results.push({
            asset_id: asset.id || asset.url || `asset_${i}`,
            title: asset.title,
            grade,
            suggestions,
            processed_at: new Date().toISOString()
          });

        } catch (error) {
          this.logger.error(`Failed to process asset ${i}`, error, {
            assetTitle: asset.title
          });
          
          results.push({
            asset_id: asset.id || asset.url || `asset_${i}`,
            title: asset.title,
            error: error.message,
            processed_at: new Date().toISOString()
          });
        }
      }

      const successful = results.filter(r => !r.error).length;
      this.logger.success('Batch optimization completed', {
        total: assets.length,
        successful,
        failed: assets.length - successful
      });

      return results;
    });
  }

  /**
   * Get system status and health check
   */
  async getStatus() {
    const aiStatus = this.aiEngine.getUsageStats();
    const configIssues = this.config.validate();
    
    return {
      status: 'operational',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      configuration: {
        debug: this.config.debug,
        ai_available: this.config.hasAI(),
        model: this.config.ai.defaultModel,
        ignore_stop_words: this.config.textProcessing.ignoreStopWords,
        issues: configIssues
      },
      ai: aiStatus,
      text_processing: {
        stop_words_filtering: this.config.textProcessing.ignoreStopWords ? 'enabled' : 'disabled',
        description: this.config.textProcessing.ignoreStopWords 
          ? 'Common words like "the", "a", "and" are filtered during text analysis'
          : 'All words including stop words are included in text analysis'
      },
      modules: {
        vocabulary_builder: 'ready',
        grader: 'ready',
        similarity_engine: 'ready',
        ai_suggestions: aiStatus.available ? 'ready' : 'disabled',
        heuristic_suggestions: 'ready'
      }
    };
  }

  /**
   * Helper method to write JSON files
   */
  async writeJSON(filePath, data) {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Helper method to read JSON files
   */
  async readJSON(filePath) {
    return FileValidator.validateJSONFile(filePath);
  }
}

export default UnityAssetOptimizer;