/**
 * AI Suggestions Module
 * Handles OpenAI integration and AI-powered content suggestions
 */

import OpenAI from 'openai';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation';
import HeuristicSuggestions from './heuristic-suggestions';
import { 
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
  buildTagsSystemPrompt,
  buildTagsUserPrompt,
  buildShortDescSystemPrompt,
  buildShortDescUserPrompt,
  buildLongDescSystemPrompt,
  buildLongDescUserPrompt
} from './prompts/index';
import type { Asset, Vocabulary } from './types';

const logger = new Logger('ai');

/**
 * Configuration interface for AI suggestions
 */
interface AIConfig {
  hasAI(): boolean;
  getOpenAIConfig(): OpenAIConfig;
  getValidCategories(): string[];
  isValidCategory(category: string): boolean;
  ai: {
    defaultModel: string;
    fallbackToHeuristic: boolean;
  };
  thresholds: {
    title: {
      minLength: number;
      maxLength: number;
    };
    tags: {
      minimum: number;
      maximum: number;
    };
    bullets: {
      minimum: number;
    };
    images: {
      minimum: number;
    };
    videos: {
      minimum: number;
    };
    longDesc: {
      minWords: number;
    };
    reviews: {
      minimum: number;
    };
    freshness: {
      maxDays: number;
    };
  };
}

/**
 * OpenAI configuration interface
 */
interface OpenAIConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

/**
 * Vocabulary word with frequency data
 */
interface VocabularyWord {
  word: string;
  frequency: number;
}

/**
 * Exemplar asset interface
 */
interface ExemplarAsset {
  title: string;
  qualityScore: number;
  tags?: string[];
  price?: number;
  rating?: number;
  reviews_count?: number;
}

/**
 * Vocabulary patterns interface
 */
interface VocabularyPatterns {
  title_words?: VocabularyWord[];
  title_bigrams?: VocabularyWord[];
  description_words?: VocabularyWord[];
  common_tags?: VocabularyWord[];
  title_length?: { median?: number };
  images_count?: { median?: number };
  price?: { q1?: number; q3?: number; median?: number };
  quality_score?: { mean?: number };
}

/**
 * Tag suggestion interface
 */
interface TagSuggestion {
  tag: string;
  reason: string;
  exemplar_reference?: string;
  discoverability_score?: number;
}

/**
 * Title suggestion interface
 */
interface TitleSuggestion {
  text: string;
  intent: string;
  vocabulary_coverage?: string[];
  exemplar_pattern?: string;
  character_count?: number;
}

/**
 * Description suggestion interface
 */
interface DescriptionSuggestion {
  short: string;
  long_markdown: string;
  exemplar_structures_used?: string[];
}

/**
 * Recommendation interface
 */
interface Recommendation {
  item: string;
  effort: string;
  impact: string;
  exemplar_benchmark?: string;
  current_vs_benchmark?: string;
  priority?: number;
}

/**
 * Category suggestion interface
 */
interface CategorySuggestion {
  category: string;
  confidence: number;
  exemplar_similarity?: string;
  vocabulary_matches?: string[];
  reasoning?: string;
}

/**
 * Similar exemplar interface
 */
interface SimilarExemplar {
  title: string;
  similarity_score: number;
  shared_vocabulary?: string[];
  quality_score?: number;
  inspiration_takeaway: string;
  key_differentiator?: string;
}

/**
 * Comprehensive AI suggestions response interface
 */
export interface AISuggestions {
  suggested_tags: TagSuggestion[];
  suggested_title: TitleSuggestion[];
  suggested_description: DescriptionSuggestion;
  recommendations: Recommendation[];
  suggested_category: CategorySuggestion;
  similar_exemplars?: SimilarExemplar[];
  rationale?: string;
}

/**
 * Simplified suggestion parameters for dedicated methods
 */
export interface DedicatedSuggestionParams {
  asset: Asset;
  exemplars?: ExemplarAsset[];
  vocab?: VocabularyPatterns;
}

/**
 * Title suggestion response
 */
export interface TitleSuggestionResponse {
  rationale?: string;
  suggested_titles: TitleSuggestion[];
}

/**
 * Tags suggestion response
 */
export interface TagsSuggestionResponse {
  rationale?: string;
  suggested_tags: TagSuggestion[];
}

/**
 * Short description suggestion response
 */
export interface ShortDescriptionResponse {
  rationale?: string;
  suggested_short_description: string;
}

/**
 * Long description suggestion response
 */
export interface LongDescriptionResponse {
  rationale?: string;
  suggested_long_description: string;
}

/**
 * Complete suggestion response for suggestAll method
 */
export interface AllSuggestionsResponse {
  title: TitleSuggestionResponse;
  tags: TagsSuggestionResponse;
  short_description: ShortDescriptionResponse;
  long_description: LongDescriptionResponse;
}

/**
 * Connection test result interface
 */
interface ConnectionTestResult {
  success: boolean;
  error?: string;
  model?: string;
  responseId?: string;
}

/**
 * Usage statistics interface
 */
export interface UsageStats {
  available: boolean;
  model: string;
  fallbackEnabled: boolean;
}

/**
 * AI-powered suggestion engine using OpenAI
 */
export class AISuggestionEngine {
  private config: AIConfig;
  private client: OpenAI | null;
  private logger: Logger;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = null;
    this.logger = logger.child('suggestions');
    
    if (config.hasAI()) {
      this.initializeOpenAI();
    }
  }

  /**
   * Initialize OpenAI client
   */
  private initializeOpenAI(): void {
    try {
      const openaiConfig = this.config.getOpenAIConfig();
      this.client = new OpenAI({ 
        apiKey: openaiConfig.apiKey,
        timeout: openaiConfig.timeout
      });
      
      this.logger.info('OpenAI client initialized', {
        model: openaiConfig.model,
        timeout: openaiConfig.timeout
      });
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client', error as Error);
      this.client = null;
    }
  }

  /**
   * Check if AI features are available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Generate title suggestions using dedicated title prompts
   * @param params - Asset and optional exemplar data
   * @returns AI-generated title suggestions
   */
  async suggestTitle(params: DedicatedSuggestionParams): Promise<TitleSuggestionResponse> {
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    return this.logger.time('suggestTitle', async () => {
      AssetValidator.validateAsset(params.asset);

      const systemPrompt = buildTitleSystemPrompt();
      const userPrompt = buildTitleUserPrompt(
        params.asset,
        params.exemplars || [],
        params.vocab || {},
      );

      const schema = {
        type: 'object',
        properties: {
          suggested_titles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                intent: { type: 'string' },
                vocabulary_coverage: { type: 'array', items: { type: 'string' } },
                exemplar_pattern: { type: 'string' },
                character_count: { type: 'number' }
              },
              required: ['text', 'intent']
            }
          },
          rationale: { type: 'string' }
        },
        required: ['suggested_titles']
      };

      return await this.callOpenAIWithSchema(systemPrompt, userPrompt, schema, 'TitleSuggestion');
    });
  }

  /**
   * Generate tag suggestions using dedicated tag prompts
   * @param params - Asset and optional exemplar data
   * @returns AI-generated tag suggestions
   */
  async suggestTags(params: DedicatedSuggestionParams): Promise<TagsSuggestionResponse> {
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    return this.logger.time('suggestTags', async () => {
      AssetValidator.validateAsset(params.asset);

      const systemPrompt = buildTagsSystemPrompt();
      const userPrompt = buildTagsUserPrompt(
        params.asset,
        params.exemplars || [],
        params.vocab || {},
      );

      const schema = {
        type: 'object',
        properties: {
          suggested_tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tag: { type: 'string' },
                reason: { type: 'string' },
                exemplar_reference: { type: 'string' },
                discoverability_score: { type: 'number' }
              },
              required: ['tag', 'reason']
            }
          },
          rationale: { type: 'string' }
        },
        required: ['suggested_tags']
      };

      return await this.callOpenAIWithSchema(systemPrompt, userPrompt, schema, 'TagsSuggestion');
    });
  }

  /**
   * Generate short description suggestions using dedicated prompts
   * @param params - Asset and optional exemplar data
   * @returns AI-generated short description
   */
  async suggestShortDescription(params: DedicatedSuggestionParams): Promise<ShortDescriptionResponse> {
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    return this.logger.time('suggestShortDescription', async () => {
      AssetValidator.validateAsset(params.asset);

      const systemPrompt = buildShortDescSystemPrompt();
      const userPrompt = buildShortDescUserPrompt(
        params.asset,
        params.exemplars || [],
        params.vocab || {},
      );

      const schema = {
        type: 'object',
        properties: {
          suggested_short_description: { type: 'string' },
          rationale: { type: 'string' }
        },
        required: ['suggested_short_description']
      };

      return await this.callOpenAIWithSchema(systemPrompt, userPrompt, schema, 'ShortDescSuggestion');
    });
  }

  /**
   * Generate long description suggestions using dedicated prompts
   * @param params - Asset and optional exemplar data
   * @returns AI-generated long description in markdown
   */
  async suggestLongDescription(params: DedicatedSuggestionParams): Promise<LongDescriptionResponse> {
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    return this.logger.time('suggestLongDescription', async () => {
      AssetValidator.validateAsset(params.asset);

      const systemPrompt = buildLongDescSystemPrompt();
      const userPrompt = buildLongDescUserPrompt(
        params.asset,
        params.exemplars || [],
        params.vocab || {},
      );

      const schema = {
        type: 'object',
        properties: {
          suggested_long_description: { type: 'string' },
          rationale: { type: 'string' }
        },
        required: ['suggested_long_description']
      };

      return await this.callOpenAIWithSchema(systemPrompt, userPrompt, schema, 'LongDescSuggestion', 2000);
    });
  }

  /**
   * Generate all suggestions (title, tags, short & long descriptions) in one call
   * @param params - Asset and optional exemplar data
   * @returns Complete set of AI-generated suggestions
   */
  async suggestAll(params: DedicatedSuggestionParams): Promise<AllSuggestionsResponse> {
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    return this.logger.time('suggestAll', async () => {
      // Run all suggestions in parallel for efficiency
      const [title, tags, shortDesc, longDesc] = await Promise.all([
        this.suggestTitle(params),
        this.suggestTags(params),
        this.suggestShortDescription(params),
        this.suggestLongDescription(params)
      ]);

      return {
        title,
        tags,
        short_description: shortDesc,
        long_description: longDesc
      };
    });
  }



  /**
   * Generic OpenAI API call with schema validation
   */
  private async callOpenAIWithSchema(
    systemPrompt: string,
    userPrompt: string,
    schema: Record<string, any>,
    schemaName: string,
    maxTokens: number = 1000
  ): Promise<any> {
    const openaiConfig = this.config.getOpenAIConfig();
    
    const response = await this.client!.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { 
        type: 'json_schema', 
        json_schema: { 
          name: schemaName, 
          schema: schema 
        } 
      },
      max_tokens: maxTokens,
      temperature: 0.7
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      this.logger.error(`Failed to parse ${schemaName} response`, parseError as Error, {
        responseText: responseText.slice(0, 200)
      });
      throw new Error(`Invalid JSON response for ${schemaName}`);
    }
  }









  /**
   * Generate heuristic fallback suggestions when AI is unavailable
   */
  private async generateHeuristicFallback(asset: Asset, vocab: Vocabulary | null): Promise<AISuggestions> {
    this.logger.debug('Generating heuristic fallback suggestions');

    // Use heuristic suggestions as fallback
    const heuristicEngine = new HeuristicSuggestions(this.config);
    
    const heuristicTags = heuristicEngine.suggestTags(asset, vocab);
    const heuristicTitles = heuristicEngine.suggestTitle(asset, vocab);
    const heuristicDescription = heuristicEngine.suggestDescription(asset, vocab);
    const heuristicRecommendations = heuristicEngine.generateRecommendations(asset, vocab);
    const heuristicCategory = heuristicEngine.suggestCategory(asset, vocab);
    
    return {
      suggested_tags: Array.isArray(heuristicTags) ? heuristicTags.map(tag => ({
        tag: typeof tag === 'string' ? tag : (tag as any).tag || '',
        reason: typeof tag === 'object' && tag && 'reason' in tag ? String((tag as any).reason) : 'Heuristic suggestion'
      })) : [],
      suggested_title: Array.isArray(heuristicTitles) ? heuristicTitles.map(title => ({
        text: typeof title === 'string' ? title : (title as any).text || '',
        intent: typeof title === 'object' && title && 'intent' in title ? String((title as any).intent) : 'Improvement suggestion'
      })) : [],
      suggested_description: {
        short: typeof heuristicDescription === 'object' && heuristicDescription && 'short' in heuristicDescription ? 
               String((heuristicDescription as any).short) : '',
        long_markdown: typeof heuristicDescription === 'object' && heuristicDescription && 'long' in heuristicDescription ? 
                       String((heuristicDescription as any).long) : ''
      },
      recommendations: Array.isArray(heuristicRecommendations) ? heuristicRecommendations.map(rec => ({
        item: typeof rec === 'string' ? rec : (rec as any).item || '',
        effort: typeof rec === 'object' && rec && 'effort' in rec ? String((rec as any).effort) : 'Medium',
        impact: typeof rec === 'object' && rec && 'impact' in rec ? String((rec as any).impact) : 'Medium'
      })) : [],
      suggested_category: {
        category: Array.isArray(heuristicCategory) && heuristicCategory.length > 0 && heuristicCategory[0] ? 
                  (heuristicCategory[0] as any).category || 'Templates/Systems' : 'Templates/Systems',
        confidence: Array.isArray(heuristicCategory) && heuristicCategory.length > 0 && heuristicCategory[0] ? 
                    Number((heuristicCategory[0] as any).confidence) || 0.5 : 0.5
      },
      rationale: 'Generated using heuristic methods (AI unavailable)'
    };
  }

  /**
   * Test OpenAI connection and model availability
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isAvailable()) {
      return { success: false, error: 'OpenAI client not initialized' };
    }

    try {
      const response = await this.client!.chat.completions.create({
        model: this.config.ai.defaultModel,
        messages: [{ role: 'user', content: 'Hello, this is a connection test.' }],
        max_tokens: 10
      });

      return {
        success: true,
        model: this.config.ai.defaultModel,
        responseId: response.id
      };

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        model: this.config.ai.defaultModel
      };
    }
  }

  /**
   * Get AI usage statistics
   */
  getUsageStats(): UsageStats {
    // This would typically track API calls, tokens used, etc.
    // For now, return basic info
    return {
      available: this.isAvailable(),
      model: this.config.ai.defaultModel,
      fallbackEnabled: this.config.ai.fallbackToHeuristic
    };
  }
}

export default AISuggestionEngine;