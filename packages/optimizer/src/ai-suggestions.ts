/**
 * AI Suggestions Module
 * Handles OpenAI integration and AI-powered content suggestions
 */

import OpenAI from 'openai';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation';
import HeuristicSuggestions from './heuristic-suggestions.mjs';
import { 
  buildSystemPrompt, 
  buildDetailedUserPrompt, 
  buildFocusedSystemPrompt, 
  buildFocusedUserPrompt, 
  buildBaseAssetContext 
} from './prompts/index';
import type { Asset } from './types';

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
 * Exemplars data structure
 */
interface ExemplarsData {
  exemplars?: {
    [category: string]: ExemplarAsset[];
  };
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
 * Exemplar vocabulary data structure
 */
interface ExemplarVocabData {
  [category: string]: VocabularyPatterns;
}

/**
 * Playbook recommendations interface
 */
interface PlaybookRecommendations {
  recommendations?: Record<string, any>;
  topExemplars?: ExemplarAsset[];
}

/**
 * Playbooks data structure
 */
interface PlaybooksData {
  playbooks?: {
    [category: string]: PlaybookRecommendations;
  };
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
 * Focused AI suggestions response interfaces
 */
interface FocusedTagsSuggestion {
  suggested_tags: TagSuggestion[];
  rationale?: string;
}

interface FocusedTitleSuggestion {
  suggested_titles: TitleSuggestion[];
  rationale?: string;
}

interface FocusedDescriptionSuggestion {
  short_description: string;
  long_description: string;
  exemplar_structures_used?: string[];
  rationale?: string;
}

interface FocusedCategorySuggestion {
  suggested_category: CategorySuggestion;
  rationale?: string;
}

interface FocusedRecommendationsSuggestion {
  recommendations: Recommendation[];
  rationale?: string;
}

/**
 * Union type for all focused suggestion types
 */
type FocusedSuggestion = 
  | FocusedTagsSuggestion 
  | FocusedTitleSuggestion 
  | FocusedDescriptionSuggestion 
  | FocusedCategorySuggestion 
  | FocusedRecommendationsSuggestion;

/**
 * AI suggestion generation parameters
 */
interface SuggestionParams {
  asset: Asset;
  exemplars: ExemplarsData;
  exemplarVocab: ExemplarVocabData;
  playbooks: PlaybooksData;
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
   * Generate comprehensive AI-powered optimization suggestions
   * Uses OpenAI's structured output with exemplar-based prompts
   * 
   * @param params - Configuration object containing asset, exemplars, vocab, and playbooks
   * @returns AI-generated suggestions for tags, title, description, etc.
   */
  async generateSuggestions(params: SuggestionParams): Promise<AISuggestions> {
    const { asset, exemplars, exemplarVocab, playbooks } = params;
    
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    return this.logger.time('generateSuggestions', async () => {
      // Validate inputs
      AssetValidator.validateAsset(asset);

      const category = asset.category || 'Unknown';
      const categoryExemplars = exemplars?.exemplars?.[category] || [];
      const categoryVocab = exemplarVocab?.[category] || {};
      const categoryPlaybook = playbooks?.playbooks?.[category] || {};

      this.logger.debug('Generating AI suggestions', {
        title: asset.title,
        category,
        exemplarsCount: categoryExemplars.length,
        hasVocab: !!categoryVocab,
        hasPlaybook: !!categoryPlaybook
      });

      try {
        const suggestions = await this.callOpenAI(asset, categoryExemplars, categoryVocab, categoryPlaybook);
        
        // Validate and sanitize category suggestions
        if (suggestions.suggested_category) {
          try {
            // Basic validation - ensure category is valid
            if (!this.config.isValidCategory(suggestions.suggested_category.category)) {
              throw new Error(`Invalid category: ${suggestions.suggested_category.category}`);
            }
          } catch (validationError) {
            this.logger.warn('Invalid category suggestion from AI, sanitizing', {
              original: suggestions.suggested_category,
              error: (validationError as Error).message
            });
            
            // Try to sanitize the category using our mapping
            const sanitized = this.sanitizeCategory(suggestions.suggested_category.category);
            if (sanitized) {
              suggestions.suggested_category.category = sanitized;
              this.logger.info('Successfully sanitized category', { sanitized });
            } else {
              // Fallback to a safe default
              suggestions.suggested_category = {
                category: 'Templates/Systems',
                confidence: 0.5,
                reasoning: 'Fallback due to invalid AI suggestion'
              };
              this.logger.warn('Used fallback category due to validation failure');
            }
          }
        }
        
        this.logger.info('AI suggestions generated successfully', {
          title: asset.title,
          suggestedTags: suggestions.suggested_tags?.length || 0,
          suggestedTitles: suggestions.suggested_title?.length || 0,
          recommendations: suggestions.recommendations?.length || 0,
          category: suggestions.suggested_category?.category
        });

        return suggestions;

      } catch (error) {
        this.logger.error('AI suggestion generation failed', error as Error, {
          title: asset.title,
          category
        });

        if (this.config.ai.fallbackToHeuristic) {
          this.logger.info('Falling back to heuristic suggestions');
          return await this.generateHeuristicFallback(asset, categoryVocab);
        }

        throw error;
      }
    });
  }

  /**
   * Call OpenAI API with exemplar-based structured prompts
   */
  private async callOpenAI(
    asset: Asset,
    exemplars: ExemplarAsset[],
    vocab: VocabularyPatterns,
    playbook: PlaybookRecommendations
  ): Promise<AISuggestions> {
    const system = this.buildSystemPrompt();
    const userPrompt = this.buildDetailedUserPrompt(asset, exemplars, vocab, playbook);
    const schema = this.buildResponseSchema();

    const openaiConfig = this.config.getOpenAIConfig();
    
    // Using the newer Chat Completions API with structured outputs
    const response = await this.client!.chat.completions.create({
      model: openaiConfig.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      response_format: { 
        type: 'json_schema', 
        json_schema: { 
          name: 'ListingSuggestions', 
          schema: schema 
        } 
      },
      max_tokens: 3000,
      temperature: 0.7
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      this.logger.error('Failed to parse OpenAI response as JSON', parseError as Error, {
        responseText: responseText.slice(0, 200)
      });
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Build comprehensive system prompt for exemplar-based optimization
   */
  private buildSystemPrompt(): string {
    const validCategories = this.config.getValidCategories();
    return buildSystemPrompt(validCategories);
  }

  /**
   * Build detailed user prompt with exemplar-based sections
   */
  private buildDetailedUserPrompt(
    asset: Asset,
    exemplars: ExemplarAsset[],
    vocab: VocabularyPatterns,
    playbook: PlaybookRecommendations
  ): string {
    const validCategories = this.config.getValidCategories();
    return buildDetailedUserPrompt(asset, exemplars, vocab, playbook, validCategories);
  }

  /**
   * Build exemplar-based payload for OpenAI request
   */
  buildExemplarPayload(
    asset: Asset,
    exemplars: ExemplarAsset[],
    vocab: VocabularyPatterns,
    playbook: PlaybookRecommendations
  ): Record<string, any> {
    const topExemplars = exemplars.slice(0, 5).map(ex => ({
      title: ex.title,
      qualityScore: ex.qualityScore,
      tags: ex.tags,
      price: ex.price,
      rating: ex.rating,
      reviews_count: ex.reviews_count
    }));

    return {
      current_asset: {
        title: asset.title,
        short_description: asset.short_description,
        long_description: asset.long_description,
        tags: asset.tags || [],
        price: asset.price,
        category: asset.category,
        images_count: asset.images_count,
        videos_count: asset.videos_count,
        rating: asset.rating,
        reviews_count: asset.reviews_count,
        last_update: asset.last_update
      },
      exemplar_context: {
        top_exemplars: topExemplars,
        vocabulary: {
          title_words: (vocab.title_words || []).slice(0, 15),
          title_bigrams: (vocab.title_bigrams || []).slice(0, 10),
          description_words: (vocab.description_words || []).slice(0, 20),
          common_tags: (vocab.common_tags || []).slice(0, 15)
        },
        benchmarks: {
          optimal_title_length: vocab.title_length?.median || 30,
          optimal_images: vocab.images_count?.median || 5,
          optimal_price_range: [vocab.price?.q1 || 10, vocab.price?.q3 || 50],
          average_quality_score: vocab.quality_score?.mean || 100
        }
      },
      playbook_guidance: {
        recommendations: playbook.recommendations || {},
        top_exemplar_patterns: (playbook.topExemplars || []).slice(0, 3)
      },
      request: {
        tasks: ["title", "tags", "description", "recommendations", "category"],
        constraints: {
          title_length: [this.config.thresholds.title.minLength, this.config.thresholds.title.maxLength],
          tags_count: [this.config.thresholds.tags.minimum, this.config.thresholds.tags.maximum],
          description_min_bullets: this.config.thresholds.bullets.minimum
        }
      }
    };
  }

  /**
   * Build JSON schema for exemplar-based structured response
   */
  private buildResponseSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        suggested_tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string' },
              reason: { type: 'string' },
              exemplar_reference: { type: 'string' }
            },
            required: ['tag', 'reason']
          }
        },
        suggested_title: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              intent: { type: 'string' },
              vocabulary_coverage: { type: 'array', items: { type: 'string' } },
              exemplar_pattern: { type: 'string' }
            },
            required: ['text', 'intent']
          }
        },
        suggested_description: {
          type: 'object',
          properties: {
            short: { type: 'string' },
            long_markdown: { type: 'string' },
            exemplar_structures_used: { type: 'array', items: { type: 'string' } }
          },
          required: ['short', 'long_markdown']
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' },
              exemplar_benchmark: { type: 'string' },
              current_vs_benchmark: { type: 'string' }
            },
            required: ['item', 'effort', 'impact']
          }
        },
        suggested_category: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            confidence: { type: 'number' },
            exemplar_similarity: { type: 'string' },
            vocabulary_matches: { type: 'array', items: { type: 'string' } }
          },
          required: ['category', 'confidence']
        },
        similar_exemplars: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              similarity_score: { type: 'number' },
              shared_vocabulary: { type: 'array', items: { type: 'string' } },
              quality_score: { type: 'number' },
              inspiration_takeaway: { type: 'string' },
              key_differentiator: { type: 'string' }
            },
            required: ['title', 'similarity_score', 'inspiration_takeaway']
          }
        },
        rationale: { type: 'string' }
      },
      required: ['suggested_tags', 'suggested_title', 'suggested_description', 'recommendations', 'suggested_category']
    };
  }

  /**
   * Generate focused suggestions for a specific property type
   * @param type - Suggestion type: 'tags', 'title', 'description', 'category', 'recommendations'
   * @param params - Configuration object containing asset, exemplars, vocab, and playbooks
   * @returns AI-generated focused suggestion for the specified property
   */
  async generateFocusedSuggestions(
    type: string,
    params: SuggestionParams
  ): Promise<FocusedSuggestion> {
    const { asset, exemplars, exemplarVocab, playbooks } = params;
    
    if (!this.isAvailable()) {
      throw new Error('AI suggestions not available - OpenAI client not initialized');
    }

    const validTypes = ['tags', 'title', 'description', 'category', 'recommendations'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid suggestion type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    return this.logger.time(`generateFocusedSuggestions-${type}`, async () => {
      // Validate inputs
      AssetValidator.validateAsset(asset);

      const category = asset.category || 'Unknown';
      const categoryExemplars = exemplars?.exemplars?.[category] || [];
      const categoryVocab = exemplarVocab?.[category] || {};
      const categoryPlaybook = playbooks?.playbooks?.[category] || {};

      this.logger.debug(`Generating focused ${type} suggestions`, {
        title: asset.title,
        category,
        exemplarsCount: categoryExemplars.length,
        hasVocab: !!categoryVocab,
        hasPlaybook: !!categoryPlaybook
      });

      try {
        const suggestion = await this.callFocusedOpenAI(type, asset, categoryExemplars, categoryVocab, categoryPlaybook);
        
        // Validate category suggestions if this is a category-focused call
        if (type === 'category' && 'suggested_category' in suggestion && suggestion.suggested_category) {
          try {
            if (!this.config.isValidCategory(suggestion.suggested_category.category)) {
              throw new Error(`Invalid category: ${suggestion.suggested_category.category}`);
            }
          } catch (validationError) {
            this.logger.warn('Invalid focused category suggestion from AI, sanitizing', {
              original: suggestion.suggested_category,
              error: (validationError as Error).message
            });
            
            const sanitized = this.sanitizeCategory(suggestion.suggested_category.category);
            if (sanitized) {
              suggestion.suggested_category.category = sanitized;
              this.logger.info('Successfully sanitized focused category', { sanitized });
            } else {
              suggestion.suggested_category = {
                category: 'Templates/Systems',
                confidence: 0.5,
                reasoning: 'Fallback due to invalid AI suggestion'
              };
              this.logger.warn('Used fallback category for focused suggestion');
            }
          }
        }
        
        this.logger.info(`Focused ${type} suggestion generated successfully`, {
          title: asset.title,
          category,
          type,
          suggestedCategory: type === 'category' && 'suggested_category' in suggestion ? suggestion.suggested_category?.category : undefined
        });

        return suggestion;

      } catch (error) {
        this.logger.error(`Focused ${type} suggestion generation failed`, error as Error, {
          title: asset.title,
          category,
          type
        });

        throw error;
      }
    });
  }

  /**
   * Call OpenAI API for focused, single-property suggestions
   */
  private async callFocusedOpenAI(
    type: string,
    asset: Asset,
    exemplars: ExemplarAsset[],
    vocab: VocabularyPatterns,
    playbook: PlaybookRecommendations
  ): Promise<FocusedSuggestion> {
    const systemPrompt = this.buildFocusedSystemPrompt(type);
    const userPrompt = this.buildFocusedUserPrompt(type, asset, exemplars, vocab, playbook);
    const schema = this.buildFocusedResponseSchema(type);

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
          name: `${type}Suggestion`, 
          schema: schema 
        } 
      },
      max_tokens: type === 'description' ? 2000 : 1000,
      temperature: 0.7
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      this.logger.error(`Failed to parse focused ${type} response`, parseError as Error, {
        responseText: responseText.slice(0, 200)
      });
      throw new Error(`Invalid JSON response for ${type} suggestion`);
    }
  }

  /**
   * Build focused system prompts for specific suggestion types
   */
  private buildFocusedSystemPrompt(type: string): string {
    const validCategories = this.config.getValidCategories();
    return buildFocusedSystemPrompt(type, validCategories);
  }

  /**
   * Build focused user prompts for specific suggestion types  
   */
  private buildFocusedUserPrompt(
    type: string,
    asset: Asset,
    exemplars: ExemplarAsset[],
    vocab: VocabularyPatterns,
    playbook: PlaybookRecommendations
  ): string {
    const validCategories = this.config.getValidCategories();
    return buildFocusedUserPrompt(type, asset, exemplars, vocab, playbook, validCategories);
  }

  /**
   * Build focused response schemas for specific suggestion types
   */
  private buildFocusedResponseSchema(type: string): Record<string, any> {
    const schemas: Record<string, Record<string, any>> = {
      tags: {
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
      },
      
      title: {
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
      },

      description: {
        type: 'object',
        properties: {
          short_description: { type: 'string' },
          long_description: { type: 'string' },
          exemplar_structures_used: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' }
        },
        required: ['short_description', 'long_description']
      },

      category: {
        type: 'object',
        properties: {
          suggested_category: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              confidence: { type: 'number' },
              vocabulary_matches: { type: 'array', items: { type: 'string' } },
              reasoning: { type: 'string' }
            },
            required: ['category', 'confidence', 'reasoning']
          },
          rationale: { type: 'string' }
        },
        required: ['suggested_category']
      },

      recommendations: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object', 
              properties: {
                item: { type: 'string' },
                effort: { type: 'string' },
                impact: { type: 'string' },
                exemplar_benchmark: { type: 'string' },
                current_vs_benchmark: { type: 'string' },
                priority: { type: 'number' }
              },
              required: ['item', 'effort', 'impact']
            }
          },
          rationale: { type: 'string' }
        },
        required: ['recommendations']
      }
    };

    const schema = schemas[type];
    if (!schema) {
      throw new Error(`No schema defined for suggestion type: ${type}`);
    }
    return schema;
  }

  /**
   * Generate heuristic fallback suggestions when AI is unavailable
   */
  private async generateHeuristicFallback(asset: Asset, vocab: VocabularyPatterns): Promise<AISuggestions> {
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

  /**
   * Sanitize and map legacy category names to official categories
   */
  private sanitizeCategory(category: string): string | null {
    if (!category || typeof category !== 'string') {
      return null;
    }

    const trimmed = category.trim();
    
    // If already in correct format, validate and return
    if (trimmed.includes('/')) {
      return this.config.isValidCategory(trimmed) ? trimmed : null;
    }

    // Map legacy category names to official ones
    const legacyMapping: Record<string, string> = {
      'Templates': 'Templates/Systems',
      'Scripts': 'Tools/Utilities', 
      'Tools': 'Tools/Utilities',
      'Models': '3D/Props',
      'Audio': 'Audio/Music',
      'Textures & Materials': '2D/Textures & Materials',
      'Characters': '3D/Characters',
      'Environments': '3D/Environments',
      'Animations': '3D/Animations',
      'GUI': '2D/GUI',
      'Fonts': '2D/Fonts',
      'Particles': 'VFX/Particles',
      'Shaders': 'VFX/Shaders'
    };

    const mapped = legacyMapping[trimmed];
    if (mapped && this.config.isValidCategory(mapped)) {
      return mapped;
    }

    return null;
  }
}

export default AISuggestionEngine;