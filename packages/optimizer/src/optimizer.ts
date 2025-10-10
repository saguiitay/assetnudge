/**
 * Unity Asset Optimizer - Main Orchestrator
 * Coordinates all modules and provides the main CLI interface
 */

import * as fs from 'fs';
import * as path from 'path';

// Core modules
import { Config } from './config';
import { Logger } from './utils/logger';
import { URLValidator, FileValidator } from './utils/validation';
import { AssetGrader } from './grader';
import { SimilarityEngine } from './similarity';
import { AISuggestionEngine } from './ai-suggestions';
import { HeuristicSuggestions as HeuristicSuggestionsEngine } from './heuristic-suggestions';
import { Builder } from './builder';

// External dependencies
import { scrapeAssetWithGraphQL } from './scrappers/graphql-scraper';

// Rating analysis and dynamic grading
import { DynamicAssetGrader } from './dynamic-asset-grader';

// Exemplar and pattern modules
import { generateExemplarRecommendations, generateExemplarFieldSuggestion } from './exemplar-coaching';

// Types
import type { 
  Asset, 
  Vocabulary, 
  GradeResult, 
  DynamicGradingRulesFile
} from './types';

/**
 * Configuration for optimization analysis
 */
export interface OptimizeOptions {
  /** Input file path for asset data */
  input?: string | undefined;
  /** URL to scrape asset data from */
  url?: string | undefined;
  /** Direct asset data object */
  assetData?: Asset | undefined;
  /** Path to vocabulary file */
  vocabPath?: string | undefined;
  /** Path to exemplars file */
  exemplarsPath?: string | undefined;
  /** Path to neighbors/corpus file */
  neighborsPath?: string | undefined;
  /** Whether to use AI suggestions */
  useAI?: boolean;
  /** Specific fields to generate/optimize (title, tags, short_description, long_description) */
  generateFields?: string[] | undefined;
  /** Whether to generate all fields at once */
  generateAll?: boolean;
}

/**
 * Grading result with metadata
 */
export interface GradeResultWithMetadata {
  grade: GradeResult;
  metadata: {
    gradingMethod: string;
    assetCategory: string;
    vocabProvided: boolean;
    rulesProvided: boolean;
    gradedAt: string;
  };
}

/**
 * Optimization analysis result
 */
export interface OptimizationResult {
  grade: GradeResult;
  suggested_tags: string[];
  suggested_title: string;
  suggested_description: string;
  recommendations: any[];
  suggested_category: string;
  similar_assets: any[];
  exemplar_coaching: any;
  ai_suggestions: any;
  /** Optimized asset content (when generating specific fields) */
  optimizedAsset?: Partial<Asset>;
  /** Generated content for specific fields */
  generated?: Record<string, any>;
  analysis_metadata: {
    coaching_method: string;
    ai_used: boolean;
    vocabulary_categories: number;
    similar_assets_found: number;
    exemplar_neighbors: number;
    category_alignment: number | null;
    timestamp: string;
    /** Fields that were generated/optimized */
    generated_fields?: string[];
  };
}

/**
 * Heuristic suggestions structure
 */
export interface HeuristicSuggestionsResult {
  suggested_tags: string[];
  suggested_title: string;
  suggested_description: string;
  suggested_category: string;
  recommendations: any[];
}

/**
 * Batch optimization result for a single asset
 */
export interface BatchOptimizationResult {
  asset_id: string;
  title: string;
  grade?: GradeResult;
  suggestions?: HeuristicSuggestionsResult;
  error?: string;
  processed_at: string;
}

/**
 * System status response
 */
export interface SystemStatus {
  status: string;
  version: string;
  timestamp: string;
  configuration: {
    debug: boolean;
    ai_available: boolean;
    model: string;
    ignore_stop_words: boolean;
    issues: string[];
  };
  ai: any;
  text_processing: {
    stop_words_filtering: string;
    description: string;
  };
  modules: {
    vocabulary_builder: string;
    grader: string;
    similarity_engine: string;
    ai_suggestions: string;
    heuristic_suggestions: string;
  };
}

/**
 * Main optimizer class that orchestrates all functionality
 */
export class UnityAssetOptimizer {
  public config: Config;
  public logger: Logger;
  public grader: AssetGrader;
  public similarityEngine: SimilarityEngine;
  public aiEngine: AISuggestionEngine;
  public heuristicEngine: HeuristicSuggestionsEngine;
  public builder: Builder;

  constructor(args: string[] = []) {
    this.config = Config.fromEnvironment(args);
    this.logger = new Logger('optimizer', this.config.debug);
    
    // Initialize modules
    this.grader = new AssetGrader(this.config);
    this.similarityEngine = new SimilarityEngine(this.config);
    this.aiEngine = new AISuggestionEngine(this.config as any);
    this.heuristicEngine = new HeuristicSuggestionsEngine(this.config);
    this.builder = new Builder(this.config);
    
    this.logger.info('Unity Asset Optimizer initialized', {
      hasAI: this.config.hasAI(),
      debug: this.config.debug
    });
  }



  /**
   * Grade an asset using static or dynamic rules
   */
  async gradeAsset(
    assetPath: string, 
    vocabPath: string | null = null, 
    rulesPath: string | null = null
  ): Promise<GradeResultWithMetadata> {
    return this.logger.time('gradeAsset', async () => {
      this.logger.info('Grading asset', { 
        assetPath, 
        vocabPath, 
        rulesPath,
        usingDynamicRules: !!rulesPath 
      });
      
      // Load asset data
      const asset = await FileValidator.validateJSONFile(assetPath) as Asset;
      
      // Load vocabulary if provided
      let vocabulary: Vocabulary = {};
      if (vocabPath) {
        vocabulary = await FileValidator.validateJSONFile(vocabPath) as Vocabulary;
      }
      
      // Grade the asset using dynamic or static rules
      let grade: GradeResult;
      let gradingMethod = 'static';
      
      if (rulesPath) {
        try {
          // Load dynamic rules
          const gradingRules = await FileValidator.validateJSONFile(rulesPath) as DynamicGradingRulesFile;
          
          // Create dynamic grader
          const dynamicGrader = new DynamicAssetGrader(this.config, gradingRules);
          
          // Grade with dynamic rules
          grade = await dynamicGrader.gradeAsset(asset as unknown as Asset, vocabulary);
          gradingMethod = 'dynamic';
          
          this.logger.info('Used dynamic grading rules', {
            categories: Object.keys(gradingRules.rules).length,
            assetCategory: asset.category
          });
          
        } catch (error) {
          this.logger.warn('Failed to load dynamic rules, falling back to static grading', error as Error);
          grade = await this.grader.gradeAsset(asset as unknown as Asset, vocabulary);
          gradingMethod = 'static-fallback';
        }
      } else {
        // Use static grading
        grade = await this.grader.gradeAsset(asset as unknown as Asset, vocabulary);
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
  async scrapeAssetWithGraphQL(url: string, outputPath?: string): Promise<Asset> {
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
      
      return asset as Asset;
    });
  }

  /**
   * Comprehensive optimization analysis
   */
  async optimizeAsset(options: OptimizeOptions): Promise<OptimizationResult> {
    return this.logger.time('optimizeAsset', async () => {
      const { input, url, assetData, vocabPath, exemplarsPath, neighborsPath, useAI = false, generateFields, generateAll = false } = options;
      
      this.logger.info('Starting comprehensive optimization', {
        hasInput: !!input,
        hasUrl: !!url,
        hasAssetData: !!assetData,
        hasVocab: !!vocabPath,
        hasExemplars: !!exemplarsPath,
        hasNeighbors: !!neighborsPath,
        useAI,
        generateFields,
        generateAll
      });

      // Get asset data
      let asset: Asset;
      if (url) {
        URLValidator.validateAssetStoreURL(url);
        asset = await this.scrapeAssetWithGraphQL(url);
        this.logger.info('Asset scraped from URL', { title: asset.title, method: (asset as any).scraping_method });
      } else if (input) {
        asset = await FileValidator.validateJSONFile(input) as Asset;
        this.logger.info('Asset loaded from file', { title: asset.title });
      } else if (assetData) {
        asset = assetData;
        this.logger.info('Asset loaded from direct data', { title: asset.title });
      } else {
        throw new Error('Either input file, URL, or asset data must be provided');
      }

      // Load vocabulary
      let vocabulary: Vocabulary = {};
      if (vocabPath) {
        vocabulary = await FileValidator.validateJSONFile(vocabPath) as Vocabulary;
        this.logger.info('Vocabulary loaded', { categories: Object.keys(vocabulary).length });
      }

      // Perform grading
      const grade = await this.grader.gradeAsset(asset as unknown as Asset, vocabulary);
      
      // Choose coaching strategy: exemplar-based (preferred) or legacy similarity
      let suggestions: HeuristicSuggestionsResult;
      let similarAssets: any[] = [];
      let exemplarRecommendations: any = null;
      
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
          const tagSuggestions = this.heuristicEngine.suggestTags(asset, vocabulary);
          const titleSuggestions = this.heuristicEngine.suggestTitle(asset, vocabulary);
          const descSuggestions = this.heuristicEngine.suggestDescription(asset, vocabulary);
          const categorySuggestions = this.heuristicEngine.suggestCategory(asset, vocabulary);
          
          const heuristicSuggestions: HeuristicSuggestionsResult = {
            suggested_tags: tagSuggestions.map(t => t.tag),
            suggested_title: titleSuggestions.length > 0 ? titleSuggestions[0]!.text : asset.title,
            suggested_description: descSuggestions.short,
            suggested_category: categorySuggestions.length > 0 ? categorySuggestions[0]!.category : (asset.category || ''),
            recommendations: this.heuristicEngine.generateRecommendations(asset, vocabulary)
          };
          suggestions = heuristicSuggestions;
        } catch (error) {
          this.logger.warn('Heuristic suggestions failed, using empty fallback', { error: (error as Error).message });
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
        const corpus = await FileValidator.validateJSONFile(neighborsPath) as Asset[];
        this.logger.info('Corpus loaded for similarity analysis', { size: corpus.length });
        
        similarAssets = await this.similarityEngine.findSimilarAssets(asset as unknown as Asset, corpus as unknown as Asset[], 5);
        try {
          const tagSuggestions = this.heuristicEngine.suggestTags(asset, vocabulary);
          const titleSuggestions = this.heuristicEngine.suggestTitle(asset, vocabulary);
          const descSuggestions = this.heuristicEngine.suggestDescription(asset, vocabulary);
          const categorySuggestions = this.heuristicEngine.suggestCategory(asset, vocabulary);
          
          const heuristicSuggestions: HeuristicSuggestionsResult = {
            suggested_tags: tagSuggestions.map(t => t.tag),
            suggested_title: titleSuggestions.length > 0 ? titleSuggestions[0]!.text : asset.title,
            suggested_description: descSuggestions.short,
            suggested_category: categorySuggestions.length > 0 ? categorySuggestions[0]!.category : (asset.category || ''),
            recommendations: this.heuristicEngine.generateRecommendations(asset, vocabulary)
          };
          suggestions = heuristicSuggestions;
        } catch (error) {
          this.logger.warn('Heuristic suggestions failed, using empty fallback', { error: (error as Error).message });
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
          const tagSuggestions = this.heuristicEngine.suggestTags(asset, vocabulary);
          const titleSuggestions = this.heuristicEngine.suggestTitle(asset, vocabulary);
          const descSuggestions = this.heuristicEngine.suggestDescription(asset, vocabulary);
          const categorySuggestions = this.heuristicEngine.suggestCategory(asset, vocabulary);
          
          const heuristicSuggestions: HeuristicSuggestionsResult = {
            suggested_tags: tagSuggestions.map(t => t.tag),
            suggested_title: titleSuggestions.length > 0 ? titleSuggestions[0]!.text : asset.title,
            suggested_description: descSuggestions.short,
            suggested_category: categorySuggestions.length > 0 ? categorySuggestions[0]!.category : (asset.category || ''),
            recommendations: this.heuristicEngine.generateRecommendations(asset, vocabulary)
          };
          suggestions = heuristicSuggestions;
        } catch (error) {
          this.logger.warn('Heuristic suggestions failed, using empty fallback', { error: (error as Error).message });
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
      let aiSuggestions: any = null;
      if (useAI && this.config.hasAI()) {
        try {
          // Load exemplars data if path provided
          let categoryExemplars: any[] = [];
          let categoryVocab: any = {};
          
          if (exemplarsPath) {
            try {
              const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
              categoryExemplars = exemplarsData?.exemplars?.[asset.category] || [];
            } catch (error) {
              this.logger.warn('Failed to load exemplars for AI suggestions', { error: (error as Error).message });
            }
          }
          
          // Use category vocabulary if available
          if (vocabulary[asset.category]) {
            categoryVocab = vocabulary[asset.category];
          }
          
          // Use new dedicated AI methods for better results
          const aiParams = {
            asset,
            exemplars: categoryExemplars,
            vocab: categoryVocab
          };
          
          // Generate all suggestions using the new suggestAll method
          aiSuggestions = await this.aiEngine.suggestAll(aiParams);
          this.logger.info('AI suggestions generated using new dedicated methods');
        } catch (error) {
          this.logger.warn('AI suggestions failed', { error: (error as Error).message });
        }
      }

      // Handle focused field generation if requested
      let optimizedAsset: Partial<Asset> = {};
      let generatedContent: Record<string, any> = {};
      let generatedFields: string[] = [];

      if (generateFields?.length || generateAll) {
        const fieldsToGenerate = generateAll ? ['title', 'tags', 'short_description', 'long_description'] : (generateFields || []);
        generatedFields = fieldsToGenerate;
        
        this.logger.info('Generating focused fields', { fields: fieldsToGenerate });

        for (const field of fieldsToGenerate) {
          try {
            // Prefer AI-generated content if available and requested
            if (useAI && this.config.hasAI() && aiSuggestions) {
              if (field === 'title' && aiSuggestions.title?.suggested_titles?.length > 0) {
                optimizedAsset.title = aiSuggestions.title.suggested_titles[0].text;
                generatedContent[field] = aiSuggestions.title.suggested_titles[0].text;
              } else if (field === 'tags' && aiSuggestions.tags?.suggested_tags?.length > 0) {
                optimizedAsset.tags = aiSuggestions.tags.suggested_tags.map((t: any) => t.tag);
                generatedContent[field] = optimizedAsset.tags;
              } else if (field === 'short_description' && aiSuggestions.short_description?.suggested_short_description) {
                optimizedAsset.short_description = aiSuggestions.short_description.suggested_short_description;
                generatedContent[field] = optimizedAsset.short_description;
              } else if (field === 'long_description' && aiSuggestions.long_description?.suggested_long_description) {
                optimizedAsset.long_description = aiSuggestions.long_description.suggested_long_description;
                generatedContent[field] = optimizedAsset.long_description;
              }
            }
            
            // Fall back to exemplar-based generation if AI didn't provide content or isn't available
            if (!optimizedAsset[field as keyof Asset] && exemplarsPath) {
              try {
                const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
                const exemplarSuggestion = generateExemplarFieldSuggestion(field, asset, exemplarsData, 5);
                
                if (exemplarSuggestion) {
                  optimizedAsset[field as keyof Asset] = exemplarSuggestion as any;
                  generatedContent[field] = exemplarSuggestion;
                  this.logger.info(`Generated ${field} using exemplar patterns`);
                }
              } catch (error) {
                this.logger.warn(`Failed to generate ${field} using exemplars`, { error: (error as Error).message });
              }
            }
            
            // Final fallback to heuristic suggestions
            if (!optimizedAsset[field as keyof Asset]) {
              if (field === 'title' && suggestions.suggested_title) {
                optimizedAsset.title = suggestions.suggested_title;
                generatedContent[field] = suggestions.suggested_title;
              } else if (field === 'tags' && suggestions.suggested_tags?.length > 0) {
                optimizedAsset.tags = suggestions.suggested_tags;
                generatedContent[field] = suggestions.suggested_tags;
              } else if (field === 'short_description' && suggestions.suggested_description) {
                optimizedAsset.short_description = suggestions.suggested_description;
                generatedContent[field] = suggestions.suggested_description;
              } else if (field === 'long_description' && suggestions.suggested_description) {
                // Use description as fallback for long description
                optimizedAsset.long_description = suggestions.suggested_description;
                generatedContent[field] = suggestions.suggested_description;
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to generate field ${field}`, { error: (error as Error).message });
          }
        }
        
        this.logger.success('Focused field generation completed', {
          generatedFields: Object.keys(generatedContent),
          requestedFields: fieldsToGenerate
        });
      }

      const result: OptimizationResult = {
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
        
        // Add optimized content for focused field generation
        optimizedAsset: Object.keys(optimizedAsset).length > 0 ? optimizedAsset : undefined,
        generated: Object.keys(generatedContent).length > 0 ? generatedContent : undefined,
        
        analysis_metadata: {
          coaching_method: exemplarsPath ? 'exemplar-based' : (neighborsPath ? 'similarity-based' : 'heuristic-only'),
          ai_used: useAI && this.config.hasAI() && aiSuggestions !== null,
          vocabulary_categories: Object.keys(vocabulary).length,
          similar_assets_found: similarAssets.length,
          exemplar_neighbors: exemplarRecommendations?.neighbors?.length || 0,
          category_alignment: exemplarRecommendations?.categoryAlignment?.score || null,
          timestamp: new Date().toISOString(),
          generated_fields: generatedFields.length > 0 ? generatedFields : undefined
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
  generateHeuristicSuggestions(asset: Asset, vocabulary: Vocabulary): HeuristicSuggestionsResult {
    const tagSuggestions = this.heuristicEngine.suggestTags(asset, vocabulary);
    const titleSuggestions = this.heuristicEngine.suggestTitle(asset, vocabulary);
    const descSuggestions = this.heuristicEngine.suggestDescription(asset, vocabulary);
    const categorySuggestions = this.heuristicEngine.suggestCategory(asset, vocabulary);
    
    return {
      suggested_tags: tagSuggestions.map(t => t.tag),
      suggested_title: titleSuggestions.length > 0 ? titleSuggestions[0]!.text : asset.title,
      suggested_description: descSuggestions.short,
      recommendations: this.heuristicEngine.generateRecommendations(asset, vocabulary),
      suggested_category: categorySuggestions.length > 0 ? categorySuggestions[0]!.category : (asset.category || '')
    };
  }

  /**
   * Private helper to load exemplars and grading rules for field suggestions
   */
  private async loadExemplarsAndRules(
    asset: Asset,
    exemplarsPath?: string | null,
    gradingRulesPath?: string | null,
    fieldType?: string
  ): Promise<{ categoryExemplars: any[]; categoryVocab: any; gradingRules: any | null }> {
    let categoryExemplars: any[] = [];
    let categoryVocab: any = {};
    let gradingRules: any = null;

    // Load exemplars
    if (exemplarsPath) {
      try {
        const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
        categoryExemplars = exemplarsData?.exemplars?.[asset.category] || [];
        categoryVocab = exemplarsData?.patterns?.[asset.category] || {};
      } catch (error) {
        this.logger.warn(`Failed to load exemplars for ${fieldType || 'field'} suggestion`, { error: (error as Error).message });
      }
    }

    // Load grading rules
    if (gradingRulesPath) {
      try {
        gradingRules = await FileValidator.validateJSONFile(gradingRulesPath);
      } catch (error) {
        this.logger.warn(`Failed to load grading rules for ${fieldType || 'field'} suggestion`, { error: (error as Error).message });
      }
    }

    return { categoryExemplars, categoryVocab, gradingRules };
  }

  /**
   * Private helper for AI-first, heuristic-fallback suggestion pattern
   */
  private async generateFieldSuggestion<T>(
    fieldType: string,
    asset: Asset,
    categoryExemplars: any[],
    categoryVocab: any,
    vocab: Vocabulary | undefined,
    aiMethod: (params: { asset: Asset; exemplars: any[]; vocab: any }) => Promise<any>,
    heuristicMethod: () => any,
    extractResult: (aiResult: any, heuristicResult: any) => T,
    defaultValue: T
  ): Promise<T> {
    // Try AI first
    if (this.config.hasAI() && this.aiEngine && this.aiEngine.isAvailable()) {
      try {
        const aiRes = await aiMethod.call(this.aiEngine, { asset, exemplars: categoryExemplars, vocab: categoryVocab });
        return extractResult(aiRes, null);
      } catch (error) {
        this.logger.warn(`AI ${fieldType} suggestion failed, falling back to heuristics`, { error: (error as Error).message });
      }
    }

    // Fallback to heuristics
    try {
      const heuristicRes = heuristicMethod();
      return extractResult(null, heuristicRes);
    } catch (error) {
      this.logger.warn(`Heuristic ${fieldType} suggestion failed`, { error: (error as Error).message });
      return defaultValue;
    }
  }

  /**
   * Suggest titles for an asset using exemplars, grading rules, AI, and heuristics
   */
  async suggestTitleForAsset(
    asset: Asset,
    exemplarsPath?: string | null,
    gradingRulesPath?: string | null,
    vocab?: Vocabulary
  ): Promise<any[]> {
    this.logger.info('Suggesting titles for asset', { title: asset.title });

    const { categoryExemplars, categoryVocab } = await this.loadExemplarsAndRules(asset, exemplarsPath, gradingRulesPath, 'title');

    return this.generateFieldSuggestion(
      'title',
      asset,
      categoryExemplars,
      categoryVocab,
      vocab,
      this.aiEngine.suggestTitle,
      () => this.heuristicEngine.suggestTitle(asset, vocab || categoryVocab),
      (aiResult, heuristicResult) => aiResult ? (aiResult.suggested_titles || []) : heuristicResult.map((t: any) => ({ text: t.text, rationale: t.rationale })),
      []
    );
  }

  /**
   * Suggest tags for an asset using exemplars, grading rules, AI, and heuristics
   */
  async suggestTagsForAsset(
    asset: Asset,
    exemplarsPath?: string | null,
    gradingRulesPath?: string | null,
    vocab?: Vocabulary
  ): Promise<any[]> {
    this.logger.info('Suggesting tags for asset', { title: asset.title });

    const { categoryExemplars, categoryVocab } = await this.loadExemplarsAndRules(asset, exemplarsPath, gradingRulesPath, 'tag');

    return this.generateFieldSuggestion(
      'tag',
      asset,
      categoryExemplars,
      categoryVocab,
      vocab,
      this.aiEngine.suggestTags,
      () => this.heuristicEngine.suggestTags(asset, vocab || categoryVocab),
      (aiResult, heuristicResult) => aiResult ? (aiResult.suggested_tags || []) : heuristicResult,
      []
    );
  }

  /**
   * Suggest short description for an asset using exemplars, grading rules, AI, and heuristics
   */
  async suggestShortDescriptionForAsset(
    asset: Asset,
    exemplarsPath?: string | null,
    gradingRulesPath?: string | null,
    vocab?: Vocabulary
  ): Promise<any> {
    this.logger.info('Suggesting short description for asset', { title: asset.title });

    const { categoryExemplars, categoryVocab } = await this.loadExemplarsAndRules(asset, exemplarsPath, gradingRulesPath, 'short description');

    return this.generateFieldSuggestion(
      'short description',
      asset,
      categoryExemplars,
      categoryVocab,
      vocab,
      this.aiEngine.suggestShortDescription,
      () => this.heuristicEngine.suggestDescription(asset, vocab || categoryVocab),
      (aiResult, heuristicResult) => aiResult ? (aiResult.suggested_short_description || '') : heuristicResult.short,
      ''
    );
  }

  /**
   * Suggest long description for an asset using exemplars, grading rules, AI, and heuristics
   */
  async suggestLongDescriptionForAsset(
    asset: Asset,
    exemplarsPath?: string | null,
    gradingRulesPath?: string | null,
    vocab?: Vocabulary
  ): Promise<any> {
    this.logger.info('Suggesting long description for asset', { title: asset.title });

    const { categoryExemplars, categoryVocab } = await this.loadExemplarsAndRules(asset, exemplarsPath, gradingRulesPath, 'long description');

    return this.generateFieldSuggestion(
      'long description',
      asset,
      categoryExemplars,
      categoryVocab,
      vocab,
      this.aiEngine.suggestLongDescription,
      () => this.heuristicEngine.suggestDescription(asset, vocab || categoryVocab),
      (aiResult, heuristicResult) => aiResult ? (aiResult.suggested_long_description || '') : heuristicResult.long_markdown,
      ''
    );
  }

  /**
   * Get system status and health check
   */
  async getStatus(): Promise<SystemStatus> {
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
  async writeJSON(filePath: string, data: any): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Helper method to read JSON files
   */
  async readJSON(filePath: string): Promise<any> {
    return FileValidator.validateJSONFile(filePath);
  }
}

export default UnityAssetOptimizer;