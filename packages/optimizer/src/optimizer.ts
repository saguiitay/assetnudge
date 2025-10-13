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
import { AISuggestionEngine } from './suggestions/ai-suggestions';
import { HeuristicSuggestions as HeuristicSuggestionsEngine } from './suggestions/heuristic-suggestions';
import { Builder } from './builder';

// External dependencies
import { scrapeAssetWithGraphQL } from './scrappers/graphql-scraper';

// Rating analysis and dynamic grading
import { DynamicAssetGrader } from './dynamic-asset-grader';

// Types
import type { 
  Asset, 
  Vocabulary, 
  GradeResult, 
  DynamicGradingRulesFile,
  CategoryVocabulary,
  CategoryRules,
  GradeResultWithMetadata
} from './types';
import { DescriptionSuggestion, TagSuggestion, TitleSuggestion } from './suggestions/types';
import { findDataDirectory } from './utils/utils';
import { ExemplarAsset } from './exemplars';

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
   * Private helper to load exemplars and grading rules for field suggestions
   */
  private async loadExemplarsAndRules(
    asset: Asset,
    exemplarsPath?: string | null,
    exemplarsVocabPath?: string | null,
    gradingRulesPath?: string | null,
    fieldType?: string
  ): Promise<{ 
      categoryExemplars: ExemplarAsset[]; 
      categoryVocabulary: CategoryVocabulary | undefined; 
      gradingRules: CategoryRules | undefined
    }> 
  {
    let categoryExemplars: ExemplarAsset[] = [];
    let categoryVocabulary: CategoryVocabulary | undefined = undefined;
    let gradingRules: CategoryRules | undefined = undefined;

    // Find the correct data directory
    if (!exemplarsPath) {
      const dataDir = await findDataDirectory('exemplars.json');
      exemplarsPath = path.join(dataDir, 'exemplars.json');
      this.logger.info(`Using default exemplars path: ${exemplarsPath}`);
    }
    if (!exemplarsVocabPath) {
      const dataDir = await findDataDirectory('exemplar_vocab.json');
      exemplarsVocabPath = path.join(dataDir, 'exemplar_vocab.json');
      this.logger.info(`Using default exemplars vocab path: ${exemplarsVocabPath}`);
    }
    if (!gradingRulesPath) {
      const dataDir = await findDataDirectory('grading-rules.json');
      gradingRulesPath = path.join(dataDir, 'grading-rules.json');
      this.logger.info(`Using default grading rules path: ${gradingRulesPath}`);
    }
    
    // Load exemplars
    if (exemplarsPath) {
      try {
        const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
        categoryExemplars = exemplarsData?.exemplars?.[asset.category];
      } catch (error) {
        this.logger.warn(`Failed to load exemplars for ${fieldType || 'field'} suggestion`, { error: (error as Error).message });
      }

      if (!categoryExemplars) {
        this.logger.warn(`No exemplars found for asset category '${asset.category}' in ${fieldType || 'field'} suggestion`);
        categoryExemplars = [];
      }
    }
    else {
      this.logger.warn(`No exemplars path provided for ${fieldType || 'field'} suggestion`);
    }

    // Load exemplars vocab
    if (exemplarsVocabPath) {
      try {
        const exemplarsVocabData = await FileValidator.validateJSONFile(exemplarsVocabPath) as Vocabulary;
        categoryVocabulary = exemplarsVocabData?.[asset.category];
      } catch (error) {
        this.logger.warn(`Failed to load exemplars vocab for ${fieldType || 'field'} suggestion`, { error: (error as Error).message });
      }

      if (!categoryVocabulary) {
        this.logger.warn(`No exemplars vocab found for asset category '${asset.category}' in ${fieldType || 'field'} suggestion`);
        categoryVocabulary = {} as CategoryVocabulary;
      }
    }
    else {
      this.logger.warn(`No exemplarsVocabPath provided for ${fieldType || 'field'} suggestion`);
    }

    // Load grading rules
    if (gradingRulesPath) {
      try {
        const gradingRulesData = await FileValidator.validateJSONFile(gradingRulesPath) as DynamicGradingRulesFile;
        gradingRules = gradingRulesData?.rules?.[asset.category];
      } catch (error) {
        this.logger.warn(`Failed to load grading rules for ${fieldType || 'field'} suggestion`, { error: (error as Error).message });
      }

      if (!gradingRules) {
        this.logger.warn(`No grading rules found for asset category '${asset.category}' in ${fieldType || 'field'} suggestion`);
        gradingRules = {} as CategoryRules;
      }
    } else {
      this.logger.warn(`No grading rules path provided for ${fieldType || 'field'} suggestion`);
    }

    return { categoryExemplars, categoryVocabulary, gradingRules };
  }

  /**
   * Private helper for AI-first, heuristic-fallback suggestion pattern
   */
  private async generateFieldSuggestion<AIResultType, HeuristicResultType, FinalResultType>(
    fieldType: string,
    asset: Asset,
    categoryExemplars: any[],
    categoryVocab: any,
    aiMethod: (params: { asset: Asset; exemplars: any[]; vocab: any }) => Promise<AIResultType>,
    heuristicMethod: () => HeuristicResultType,
    extractResult: (aiResult: AIResultType | null, heuristicResult: HeuristicResultType | null) => FinalResultType,
    defaultValue: FinalResultType
  ): Promise<FinalResultType> {
    // Try AI first
    if (this.config.hasAI() && this.aiEngine && this.aiEngine.isAvailable()) {
      try {
        this.logger.info(`Trying AI ${fieldType} suggestion`);
        const aiRes = await aiMethod.call(this.aiEngine, { asset, exemplars: categoryExemplars, vocab: categoryVocab });
        return extractResult(aiRes, null);
      } catch (error) {
        this.logger.warn(`AI ${fieldType} suggestion failed, falling back to heuristics`, { error: (error as Error).message });
      }
    }

    // Fallback to heuristics
    try {
      this.logger.warn(`Falling back to heuristic ${fieldType} suggestion`);
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
  ): Promise<TitleSuggestion[]> {
    this.logger.info('Suggesting titles for asset', { title: asset.title });

    const { categoryExemplars, categoryVocabulary, gradingRules } = await this.loadExemplarsAndRules(asset, null, null, null, 'title');

    return this.generateFieldSuggestion(
      'title',
      asset,
      categoryExemplars,
      categoryVocabulary,
      this.aiEngine.suggestTitle,
      () => this.heuristicEngine.suggestTitle({ asset, exemplars: categoryExemplars, categoryVocabulary, gradingRules }),
      (aiResult, heuristicResult) => 
        aiResult 
          ? (aiResult.suggestions || []) 
          : heuristicResult?.map((t: any) => ({ text: t.text, rationale: t.rationale } as TitleSuggestion)) || [],
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
  ): Promise<TagSuggestion[]> {
    this.logger.info('Suggesting tags for asset', { title: asset.title });

    const { categoryExemplars, categoryVocabulary, gradingRules } = await this.loadExemplarsAndRules(asset, null, null, null, 'tag');

    return this.generateFieldSuggestion(
      'tags',
      asset,
      categoryExemplars,
      categoryVocabulary,
      this.aiEngine.suggestTags,
      () => this.heuristicEngine.suggestTags({ asset, exemplars: categoryExemplars, categoryVocabulary, gradingRules}),
      (aiResult, heuristicResult) => 
        aiResult 
          ? (aiResult.suggestions || []) 
          : heuristicResult?.map((t: any) => ({ tag: t.text, rationale: t.rationale } as TagSuggestion)) || [],
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
  ): Promise<DescriptionSuggestion[]  > {
    this.logger.info('Suggesting short description for asset', { title: asset.title });

    const { categoryExemplars, categoryVocabulary, gradingRules } = await this.loadExemplarsAndRules(asset, null, null, null, 'short description');

    return this.generateFieldSuggestion(
      'short description',
      asset,
      categoryExemplars,
      categoryVocabulary,
      this.aiEngine.suggestShortDescription,
      () => this.heuristicEngine.suggestShortDescription({ asset, exemplars: categoryExemplars, categoryVocabulary, gradingRules}),
      (aiResult, heuristicResult) => 
        aiResult 
          ? (aiResult.suggestions || []) 
          : heuristicResult?.map((t: any) => ({ description: t.text, rationale: t.rationale } as DescriptionSuggestion)) || [],
      []
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
  ): Promise<DescriptionSuggestion[]> {
    this.logger.info('Suggesting long description for asset', { title: asset.title });

    const { categoryExemplars, categoryVocabulary, gradingRules } = await this.loadExemplarsAndRules(asset, null, null, null, 'long description');

    return this.generateFieldSuggestion(
      'long description',
      asset,
      categoryExemplars,
      categoryVocabulary,
      this.aiEngine.suggestLongDescription,
      () => this.heuristicEngine.suggestLongDescription({ asset, exemplars: categoryExemplars, categoryVocabulary, gradingRules}),
      (aiResult, heuristicResult) => 
        aiResult 
          ? (aiResult.suggestions || []) 
          : heuristicResult?.map((t: any) => ({ description: t.text, rationale: t.rationale } as DescriptionSuggestion)) || [],
      []
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