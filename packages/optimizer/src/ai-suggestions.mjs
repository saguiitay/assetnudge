/**
 * AI Suggestions Module
 * Handles OpenAI integration and AI-powered content suggestions
 */

import OpenAI from 'openai';
import { Logger } from './utils/logger.mjs';
import { AssetValidator } from './validation.mjs';

const logger = new Logger('ai');

/**
 * AI-powered suggestion engine using OpenAI
 */
export class AISuggestionEngine {
  constructor(config) {
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
  initializeOpenAI() {
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
      this.logger.error('Failed to initialize OpenAI client', error);
      this.client = null;
    }
  }

  /**
   * Check if AI features are available
   */
  isAvailable() {
    return this.client !== null;
  }

  /**
   * Generate comprehensive AI-powered optimization suggestions
   * Uses OpenAI's structured output with exemplar-based prompts
   * 
   * @param {Object} params - Configuration object
   * @param {Object} params.asset - Current asset data
   * @param {Object} params.exemplars - Category exemplars data
   * @param {Object} params.exemplarVocab - Exemplar vocabulary and patterns
   * @param {Object} params.playbooks - Category playbook recommendations
   * @returns {Object} AI-generated suggestions for tags, title, description, etc.
   */
  async generateSuggestions({ asset, exemplars, exemplarVocab, playbooks }) {
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
              error: validationError.message
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
        this.logger.error('AI suggestion generation failed', error, {
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
  async callOpenAI(asset, exemplars, vocab, playbook) {
    const system = this.buildSystemPrompt();
    const userPrompt = this.buildDetailedUserPrompt(asset, exemplars, vocab, playbook);
    const schema = this.buildResponseSchema();

    const openaiConfig = this.config.getOpenAIConfig();
    
    // Using the newer Chat Completions API with structured outputs
    const response = await this.client.chat.completions.create({
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
      this.logger.error('Failed to parse OpenAI response as JSON', parseError, {
        responseText: responseText.slice(0, 200)
      });
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Build comprehensive system prompt for exemplar-based optimization
   */
  buildSystemPrompt() {
    const validCategories = this.config.getValidCategories();
    
    return `You are an expert Unity Asset Store optimization consultant with deep knowledge of successful listing patterns. You analyze exemplars (high-performing assets) to provide targeted improvement suggestions.

Key Principles:
- Ground ALL suggestions in provided exemplar vocabulary and patterns
- Reference specific successful exemplar patterns without copying text
- Use playbook recommendations for strategic guidance
- Provide concrete, actionable recommendations with exemplar benchmarks
- Maintain professional, conversion-focused tone
- Return structured JSON as specified

CRITICAL CATEGORY CONSTRAINTS:
Each asset MUST belong to exactly ONE category from this official Unity Asset Store structure:
${validCategories.map(cat => `- ${cat}`).join('\n')}

NEVER suggest multiple categories or categories outside this list. Always suggest ONE specific category in the format "MainCategory/SubCategory".

Your expertise covers:
1. Title optimization using exemplar vocabulary patterns
2. Tag suggestions based on successful exemplar tag strategies  
3. Description enhancement following exemplar structures
4. Strategic recommendations using exemplar benchmarks
5. Category classification using ONLY the official categories listed above

Always explain WHY each suggestion works by referencing exemplar patterns and performance data.`;
  }

  /**
   * Build detailed user prompt with exemplar-based sections
   */
  buildDetailedUserPrompt(asset, exemplars, vocab, playbook) {
    const topExemplars = exemplars.slice(0, 5);
    const categoryRecommendations = playbook?.recommendations || {};
    
    return `ASSET TO OPTIMIZE:
Title: "${asset.title}"
Short Description: "${asset.short_description || 'None provided'}"
Long Description: "${(asset.long_description || '').substring(0, 500)}${asset.long_description?.length > 500 ? '...' : ''}"
Current Tags: [${(asset.tags || []).join(', ')}]
Category: ${asset.category}
Price: $${asset.price || 'Not set'}
Images: ${asset.images_count || 0}, Videos: ${asset.videos_count || 0}
Rating: ${asset.rating || 'None'} (${asset.reviews_count || 0} reviews)

EXEMPLAR VOCABULARY (from successful assets in ${asset.category}):
Title Words: ${(vocab.title_words || []).slice(0, 15).map(w => w.word).join(', ')}
Title Phrases: ${(vocab.title_bigrams || []).slice(0, 10).map(w => w.word).join(', ')}
Description Terms: ${(vocab.description_words || []).slice(0, 20).map(w => w.word).join(', ')}
Common Tags: ${(vocab.common_tags || []).slice(0, 15).map(w => w.word).join(', ')}

TOP EXEMPLARS IN CATEGORY:
${topExemplars.map((ex, i) => `${i + 1}. "${ex.title}" (Quality Score: ${ex.qualityScore?.toFixed(1)}, ${ex.reviews_count} reviews, Rating: ${ex.rating})`).join('\n')}

CATEGORY BENCHMARKS:
- Optimal title length: ${vocab.title_length?.median || 30} characters
- Average images: ${vocab.images_count?.median || 5}
- Price range: $${vocab.price?.q1 || 10} - $${vocab.price?.q3 || 50}
- Average quality score: ${vocab.quality_score?.mean?.toFixed(1) || 100}

PLAYBOOK RECOMMENDATIONS:
${JSON.stringify(categoryRecommendations, null, 2)}

TASKS:
Provide comprehensive optimization suggestions for:

1. TITLE SUGGESTIONS (3 alternatives):
   - Use exemplar vocabulary patterns
   - Keep 60-75 characters if possible
   - Reference which exemplar patterns you're following
   - Explain vocabulary coverage for each suggestion

2. TAG SUGGESTIONS (10-15 tags):
   - Balance high-signal category terms with specific use-cases
   - Use exemplar tag patterns
   - Rank by expected discoverability
   - Reference successful exemplar tag strategies

3. DESCRIPTION SUGGESTIONS:
   - Short description (140-160 characters)
   - Long description with exemplar structures
   - Use exemplar vocabulary naturally
   - Include features, benefits, compatibility
   - Reference exemplar formatting patterns

4. GENERAL RECOMMENDATIONS:
   - Compare against exemplar benchmarks
   - Provide effort/impact ratings
   - Reference specific exemplar achievements
   - Include current vs benchmark comparisons

5. CATEGORY CLASSIFICATION:
   - Classify into ONE category from the official Unity Asset Store structure
   - Choose from: ${this.config.getValidCategories().join(', ')}
   - Provide confidence score and vocabulary similarity reasoning
   - NEVER suggest multiple categories or unofficial categories

6. SIMILAR EXEMPLARS:
   - Find 3-5 similar exemplars for inspiration
   - Explain specific takeaways
   - Show shared vocabulary patterns
   - Highlight key differentiators

Return structured JSON matching the required schema.`;
  }

  /**
   * Build exemplar-based payload for OpenAI request
   */
  buildExemplarPayload(asset, exemplars, vocab, playbook) {
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
  buildResponseSchema() {
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
   * @param {string} type - Suggestion type: 'tags', 'title', 'description', 'category', 'recommendations'
   * @param {Object} params - Configuration object
   * @param {Object} params.asset - Current asset data
   * @param {Object} params.exemplars - Category exemplars data
   * @param {Object} params.exemplarVocab - Exemplar vocabulary and patterns
   * @param {Object} params.playbooks - Category playbook recommendations
   * @returns {Object} AI-generated focused suggestion for the specified property
   */
  async generateFocusedSuggestions(type, { asset, exemplars, exemplarVocab, playbooks }) {
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
        if (type === 'category' && suggestion.suggested_category) {
          try {
            if (!this.config.isValidCategory(suggestion.suggested_category.category)) {
              throw new Error(`Invalid category: ${suggestion.suggested_category.category}`);
            }
          } catch (validationError) {
            this.logger.warn('Invalid focused category suggestion from AI, sanitizing', {
              original: suggestion.suggested_category,
              error: validationError.message
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
          suggestedCategory: type === 'category' ? suggestion.suggested_category?.category : undefined
        });

        return suggestion;

      } catch (error) {
        this.logger.error(`Focused ${type} suggestion generation failed`, error, {
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
  async callFocusedOpenAI(type, asset, exemplars, vocab, playbook) {
    const systemPrompt = this.buildFocusedSystemPrompt(type);
    const userPrompt = this.buildFocusedUserPrompt(type, asset, exemplars, vocab, playbook);
    const schema = this.buildFocusedResponseSchema(type);

    const openaiConfig = this.config.getOpenAIConfig();
    
    const response = await this.client.chat.completions.create({
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
      this.logger.error(`Failed to parse focused ${type} response`, parseError, {
        responseText: responseText.slice(0, 200)
      });
      throw new Error(`Invalid JSON response for ${type} suggestion`);
    }
  }

  /**
   * Build focused system prompts for specific suggestion types
   */
  buildFocusedSystemPrompt(type) {
    const basePrompt = `You are an expert Unity Asset Store optimization consultant specializing in ${type} optimization. You analyze exemplars (high-performing assets) to provide targeted ${type} improvements.`;
    
    const validCategories = this.config.getValidCategories();
    
    const typeSpecific = {
      tags: `Focus on tag discovery and ranking. Balance high-signal category terms with specific use-cases. Reference successful exemplar tag patterns.`,
      title: `Focus on title optimization for clarity and conversion. Use exemplar vocabulary patterns while maintaining uniqueness. Keep 60-75 characters when possible.`,
      description: `Focus on conversion-focused descriptions. Use exemplar structures: short description (140-160 chars) + detailed long description with benefits, features, and compatibility.`,
      category: `Focus on accurate category classification using ONLY the official Unity Asset Store categories: ${validCategories.join(', ')}. NEVER suggest multiple categories or categories outside this list. Always suggest exactly ONE category in MainCategory/SubCategory format.`,
      recommendations: `Focus on actionable improvement recommendations using exemplar benchmarks and performance data.`
    };

    return `${basePrompt}\n\n${typeSpecific[type]}\n\nAlways ground suggestions in exemplar patterns and explain your reasoning with specific exemplar references.`;
  }

  /**
   * Build focused user prompts for specific suggestion types  
   */
  buildFocusedUserPrompt(type, asset, exemplars, vocab, playbook) {
    const baseContext = this.buildBaseAssetContext(asset, exemplars, vocab, playbook);
    
    const typeSpecific = {
      tags: `TASK: Suggest 10-15 optimized tags ranked by discoverability. Use exemplar tag patterns and explain why each tag works in this category.`,
      title: `TASK: Suggest 3 alternative titles using exemplar vocabulary patterns. Explain intent and vocabulary coverage for each.`,
      description: `TASK: Create short description (140-160 chars) and long description using exemplar structures. Include benefits, features, compatibility.`,
      category: `TASK: Classify into exactly ONE category from the official Unity Asset Store structure. Choose from: ${this.config.getValidCategories().join(', ')}. Provide confidence score and reasoning based on exemplar vocabulary similarity.`,
      recommendations: `TASK: Provide 5-7 prioritized improvement recommendations using exemplar benchmarks. Include effort/impact ratings.`
    };

    return `${baseContext}\n\n${typeSpecific[type]}`;
  }

  /**
   * Build base asset context for focused prompts
   */
  buildBaseAssetContext(asset, exemplars, vocab, playbook) {
    const topExemplars = exemplars.slice(0, 3);
    
    return `ASSET: "${asset.title}"
Category: ${asset.category}
Current Tags: [${(asset.tags || []).join(', ')}]
Price: $${asset.price || 'Not set'}

EXEMPLAR VOCABULARY:
- Title Words: ${(vocab.title_words || []).slice(0, 10).map(w => w.word).join(', ')}
- Common Tags: ${(vocab.common_tags || []).slice(0, 10).map(w => w.word).join(', ')}

TOP EXEMPLARS:
${topExemplars.map((ex, i) => `${i + 1}. "${ex.title}" (Score: ${ex.qualityScore?.toFixed(1)})`).join('\n')}

BENCHMARKS:
- Avg Quality: ${vocab.quality_score?.mean?.toFixed(1) || 100}
- Optimal Price: $${vocab.price?.median || 25}`;
  }

  /**
   * Build focused response schemas for specific suggestion types
   */
  buildFocusedResponseSchema(type) {
    const schemas = {
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

    return schemas[type];
  }

  /**
   * Generate heuristic fallback suggestions when AI is unavailable
   */
  async generateHeuristicFallback(asset, vocab) {
    this.logger.debug('Generating heuristic fallback suggestions');

    // Use heuristic suggestions as fallback
    const { default: HeuristicSuggestions } = await import('./heuristic-suggestions.mjs');
    const heuristicEngine = new HeuristicSuggestions(this.config);
    
    return {
      suggested_tags: heuristicEngine.suggestTags(asset, vocab),
      suggested_title: heuristicEngine.suggestTitle(asset, vocab),
      suggested_description: heuristicEngine.suggestDescription(asset, vocab),
      recommendations: heuristicEngine.generateRecommendations(asset, vocab),
      suggested_category: heuristicEngine.suggestCategory(asset, vocab),
      rationale: 'Generated using heuristic methods (AI unavailable)'
    };
  }

  /**
   * Test OpenAI connection and model availability
   */
  async testConnection() {
    if (!this.isAvailable()) {
      return { success: false, error: 'OpenAI client not initialized' };
    }

    try {
      const response = await this.client.chat.completions.create({
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
        error: error.message,
        model: this.config.ai.defaultModel
      };
    }
  }

  /**
   * Get AI usage statistics
   */
  getUsageStats() {
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
  sanitizeCategory(category) {
    if (!category || typeof category !== 'string') {
      return null;
    }

    const trimmed = category.trim();
    
    // If already in correct format, validate and return
    if (trimmed.includes('/')) {
      return this.config.isValidCategory(trimmed) ? trimmed : null;
    }

    // Map legacy category names to official ones
    const legacyMapping = {
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