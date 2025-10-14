/**
 * AI Suggestions Module
 * Handles OpenAI integration and AI-powered content suggestions
 */

import OpenAI from 'openai';
import { Logger } from '../utils/logger';
import { AssetValidator } from '../utils/validation';
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
import { TitleSuggestionResponse,  DescriptionSuggestion, TagSuggestion, TitleSuggestion, TagsSuggestionResponse, ShortDescriptionResponse, LongDescriptionResponse, AllSuggestionsResponse, DedicatedSuggestionParams } from './types';

const logger = new Logger('ai');

const suggestionSchema = {
  type: 'object',
  properties: {
    
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rationale: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['suggestion', 'rationale']
      }
    }
  },
  required: ['suggestions']
};

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
        params.exemplars,
        params.categoryVocabulary,
      );

      const response = await this.callOpenAIWithSchema(systemPrompt, userPrompt, suggestionSchema, 'TitleSuggestion', 1000);

      return {
        suggestions: response.suggestions.map((s: { rationale: string; suggestion: string; }) => ({ rationale: s.rationale, text: s.suggestion } as TitleSuggestion))
      } as TitleSuggestionResponse;
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
        params.exemplars,
        params.categoryVocabulary,
        params.gradingRules,
      );
      
      const response = await this.callOpenAIWithSchema(systemPrompt, userPrompt, suggestionSchema, 'TagsSuggestion', 1000);

      return {
        suggestions: response.suggestions.map((s: { rationale: any; suggestion: any; }) => ({ rationale: s.rationale, tag: s.suggestion } as TagSuggestion))
      } as TagsSuggestionResponse;
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
        params.exemplars,
        params.categoryVocabulary,
        params.gradingRules,
      );

      const response = await this.callOpenAIWithSchema(systemPrompt, userPrompt, suggestionSchema, 'ShortDescSuggestion', 5000);

      return {
        suggestions: response.suggestions.map((s: { rationale: string; suggestion: string; }) => ({ rationale: s.rationale, description: s.suggestion } as DescriptionSuggestion))
      } as ShortDescriptionResponse;
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
        params.exemplars,
        params.categoryVocabulary,
        params.gradingRules,
      );

      
      const response = await this.callOpenAIWithSchema(systemPrompt, userPrompt, suggestionSchema, 'LongDescSuggestion', 16000);

      return {
        suggestions: response.suggestions.map((s: { rationale: string; suggestion: string; }) => ({ rationale: s.rationale, description: s.suggestion } as DescriptionSuggestion))
      } as LongDescriptionResponse;
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

    // this.logger.info(`Calling OpenAI for ${schemaName}, model: ${openaiConfig.model}, max tokens: ${maxTokens}, timeout: ${openaiConfig.timeout}, schema: ${JSON.stringify(schema)}`);
    // this.logger.info(`Calling OpenAI systemPrompt: ${systemPrompt}`);
    // this.logger.info(`Calling OpenAI userPrompt: ${userPrompt}`);
    
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
      max_completion_tokens: maxTokens,
    });

    //this.logger.info(`OpenAI response: ${JSON.stringify(response)}`);
    
    const responseText = response.choices[0]?.message?.content || '';
    
    //this.logger.info(`OpenAI responseText: ${responseText}`);

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
        max_completion_tokens: 10
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