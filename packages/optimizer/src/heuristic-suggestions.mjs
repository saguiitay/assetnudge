/**
 * Heuristic Suggestions Module
 * Provides fallback suggestion algorithms when AI is unavailable
 */

import { tokenize, jaccard, zscore, tfVector, cosine } from './utils/utils';
import { Logger } from './utils/logger';
import { VocabularyBuilder } from './vocabulary';

const logger = new Logger('heuristic');

/**
 * Heuristic-based suggestion generator
 */
export class HeuristicSuggestions {
  constructor(config) {
    this.config = config;
    this.logger = logger.child('suggestions');
  }

  /**
   * Generate tag suggestions using category vocabulary
   */
  suggestTags(asset, vocab, k = null) {
    const maxTags = k || this.config.thresholds.tags.maximum;
    const categoryVocab = VocabularyBuilder.getVocabularyForCategory(vocab, asset.category);
    const currentTags = new Set((asset.tags || []).map(x => String(x).toLowerCase()));

    this.logger.debug('Generating heuristic tag suggestions', {
      currentTagCount: currentTags.size,
      targetCount: maxTags
    });

    // If no vocabulary available, use generic Unity tags
    if (!categoryVocab.top_tags || categoryVocab.top_tags.length === 0) {
      const genericTags = [
        'unity', 'game', 'development', 'asset', 'template', 'tool', 
        'script', 'prefab', 'mobile', 'performance', '3d', '2d',
        'ui', 'animation', 'shader', 'multiplayer', 'framework'
      ];
      
      return genericTags
        .filter(t => !currentTags.has(t))
        .slice(0, maxTags)
        .map(t => ({ tag: t, reason: 'Generic Unity development tag' }));
    }

    // Use category-specific tags
    return categoryVocab.top_tags
      .map(x => x.t)
      .filter(t => !currentTags.has(t))
      .slice(0, maxTags)
      .map(t => ({ tag: t, reason: 'Common tag in this category' }));
  }

  /**
   * Generate title suggestions using category keywords
   */
  suggestTitle(asset, vocab) {
    const category = asset.category || 'Templates';
    const categoryVocab = VocabularyBuilder.getVocabularyForCategory(vocab, asset.category);
    
    this.logger.debug('Generating heuristic title suggestions', {
      category,
      currentTitle: asset.title
    });

    // Get relevant keywords
    const keywords = [
      ...categoryVocab.top_unigrams.slice(0, 10).map(x => x.t),
      ...categoryVocab.top_bigrams.slice(0, 5).map(x => x.t)
    ];

    const existingTokens = new Set(tokenize(asset.title || '').uni);
    const availableKeywords = keywords
      .filter(t => !t.includes(' ') ? !existingTokens.has(t) : true)
      .slice(0, 3);

    const baseTitle = asset.title || 'Unity Asset Template';

    // If no keywords available, use generic ones
    if (availableKeywords.length === 0) {
      const genericKeywords = ['Professional', 'Complete', 'Advanced'];
      return [
        `${baseTitle.split(' — ')[0]} — Professional ${category}`,
        `Complete ${category} Solution — Build Faster in Unity`,
        `${baseTitle.split(' — ')[0]} | Ready-to-Use ${category}`
      ].map(t => ({ text: t, rationale: 'Includes category with professional keywords' }));
    }

    // Generate title variants
    const titleBase = baseTitle.split(' — ')[0];
    return [
      `${titleBase} — ${category}${availableKeywords[0] ? ' · ' + availableKeywords[0] : ''}`.trim(),
      `${category} ${availableKeywords.slice(0, 2).join(' ')} — Build Faster in Unity`,
      `${titleBase} | Ready-to-Use ${category}`
    ].map(t => ({ text: t, rationale: 'Includes category and common keywords' }));
  }

  /**
   * Generate description suggestions with marketing structure
   */
  suggestDescription(asset, vocab) {
    const category = asset.category || 'Templates';
    const categoryVocab = VocabularyBuilder.getVocabularyForCategory(vocab, asset.category);
    
    this.logger.debug('Generating heuristic description suggestions', {
      category,
      hasVocab: categoryVocab.top_unigrams.length > 0
    });

    // Get relevant keywords
    const topKeywords = [
      ...categoryVocab.top_unigrams.slice(0, 8).map(x => x.t),
      ...categoryVocab.top_bigrams.slice(0, 4).map(x => x.t),
      ...categoryVocab.top_tags.slice(0, 4).map(x => x.t)
    ];

    let uniqueKeywords = Array.from(new Set(topKeywords)).slice(0, 10);

    // Fallback to generic keywords if none available
    if (uniqueKeywords.length === 0) {
      uniqueKeywords = [
        'unity', 'game development', 'asset store', 'template', 'professional',
        'clean code', 'documentation', 'mobile ready', 'performance', 'customizable'
      ];
    }

    const shortDescription = `Build and ship faster with a ready-to-customize ${category.toLowerCase()} for Unity. Clean structure, docs, and extensibility.`;

    const longDescription = this.buildLongDescription(category, uniqueKeywords);

    return {
      short: shortDescription,
      long_markdown: longDescription
    };
  }

  /**
   * Build structured long description
   */
  buildLongDescription(category, keywords) {
    return `## Who it's for
- Indie devs and teams shipping ${category.toLowerCase()}
- Prototypers who need production-ready blocks
- Developers looking to accelerate their workflow

## Key benefits
- Save weeks of setup time
- Clean, extensible code architecture
- Mobile-ready performance optimization
- Comprehensive documentation and examples
- Rapid customization capabilities
- Professional support via email/issues

## Features
- Core mechanics implemented and tested
- Inspector-friendly configuration options
- Example scenes and prefabs included
- Compatible with recent Unity LTS versions
- Optimized for performance and memory usage

## Technical highlights
${keywords.map(k => `- ${k}`).join('\n')}

## Getting started
1. Import the package into your Unity project
2. Review the documentation and example scenes
3. Customize the templates to fit your needs
4. Build and deploy your enhanced project

## CTA
Add to cart and start integrating today. Join thousands of developers who've accelerated their Unity development with our proven ${category.toLowerCase()}.`;
  }

  /**
   * Generate general improvement recommendations
   */
  generateRecommendations(asset, vocab) {
    const categoryVocab = VocabularyBuilder.getVocabularyForCategory(vocab, asset.category);
    const recommendations = [];

    this.logger.debug('Generating heuristic recommendations', {
      title: asset.title
    });

    // Media recommendations
    if ((asset.images_count || 0) < this.config.thresholds.images.minimum) {
      recommendations.push({
        item: `Add ${this.config.thresholds.images.minimum + 1}–8 screenshots (overview, key features, editor view, mobile, before/after, code examples)`,
        effort: 'M',
        impact: '▲▲'
      });
    }

    if ((asset.videos_count || 0) < this.config.thresholds.videos.minimum) {
      recommendations.push({
        item: 'Record a 60-second demo video + 2–3 minute overview',
        effort: 'M',
        impact: '▲▲▲'
      });
    }

    // Content recommendations
    const descWordCount = this.getWordCount(asset.long_description || asset.description || '');
    if (descWordCount < this.config.thresholds.longDesc.minWords) {
      recommendations.push({
        item: `Expand description to ${this.config.thresholds.longDesc.minWords}+ words with features, benefits, and use cases`,
        effort: 'S',
        impact: '▲▲'
      });
    }

    // Trust signal recommendations
    if ((asset.reviews_count || 0) < this.config.thresholds.reviews.minimum) {
      recommendations.push({
        item: 'Add review-nudge (README CTA + post-purchase email)',
        effort: 'S',
        impact: '▲▲'
      });
    }

    // Freshness recommendations
    const daysSinceUpdate = this.daysBetween(asset.last_update);
    if (daysSinceUpdate == null || daysSinceUpdate > this.config.thresholds.freshness.maxDays) {
      recommendations.push({
        item: 'Ship a maintenance update + changelog',
        effort: 'S',
        impact: '▲'
      });
    }

    // Pricing recommendations
    if (categoryVocab.price_mean != null && categoryVocab.price_std != null && asset.price != null) {
      const priceZ = Math.abs(zscore(asset.price, categoryVocab.price_mean, categoryVocab.price_std));
      if (priceZ > 1.5) {
        recommendations.push({
          item: 'Test price near category median for 30 days',
          effort: 'S',
          impact: '▲▲'
        });
      }
    }

    // Tag coverage recommendations
    if (asset.tags && categoryVocab.top_tags && categoryVocab.top_tags.length > 0) {
      const coverage = jaccard(
        asset.tags.map(x => String(x).toLowerCase()),
        categoryVocab.top_tags.slice(0, 30).map(x => x.t)
      );
      if (coverage < 0.3) {
        recommendations.push({
          item: 'Expand tags to cover common category terms',
          effort: 'S',
          impact: '▲'
        });
      }
    }

    return recommendations.slice(0, 7);
  }

  /**
   * Suggest category classification using official Unity categories
   */
  suggestCategory(asset, vocab) {
    const validCategories = this.config.getValidCategories();
    const categories = Object.keys(vocab || {});

    this.logger.debug('Generating heuristic category suggestions', {
      availableCategories: categories.length,
      validOfficialCategories: validCategories.length
    });

    // If no vocabulary available, use keyword-based classification
    if (categories.length === 0) {
      return this.classifyWithKeywords(asset);
    }

    // Use TF-IDF similarity against category vocabularies
    const assetDesc = asset.long_description || asset.short_description || asset.description || '';
    const candidateVector = tfVector(`${asset.title || ''} ${assetDesc} ${(asset.tags || []).join(' ')}`);

    const scores = categories.map(cat => {
      const categoryVocab = vocab[cat];
      const centroid = {};

      // Build category centroid from vocabulary
      for (const term of (categoryVocab.top_unigrams || []).slice(0, 50)) {
        centroid[term.t] = (centroid[term.t] || 0) + term.c;
      }
      for (const term of (categoryVocab.top_bigrams || []).slice(0, 30)) {
        centroid[term.t] = (centroid[term.t] || 0) + term.c;
      }
      for (const term of (categoryVocab.top_tags || []).slice(0, 30)) {
        centroid[term.t] = (centroid[term.t] || 0) + term.c;
      }

      return {
        category: cat,
        sim: cosine(candidateVector, centroid)
      };
    }).sort((a, b) => b.sim - a.sim);

    // Filter to only include valid official categories and map legacy names
    const validScores = scores
      .map(s => ({
        category: this.mapToOfficialCategory(s.category),
        sim: s.sim
      }))
      .filter(s => s.category && this.config.isValidCategory(s.category));

    const totalSim = validScores.reduce((a, b) => a + b.sim, 0) || 1;
    const results = validScores.slice(0, 3).map(s => ({
      category: s.category,
      confidence: +(s.sim / totalSim).toFixed(2)
    }));

    // Validate results and ensure we have at least one valid suggestion
    try {
      if (results.length === 0) {
        // Fallback to default category
        return [{ category: 'Templates/Systems', confidence: 0.5 }];
      }
      
      // Validate each suggestion using config validation
      for (const result of results) {
        if (!this.config.isValidCategory(result.category)) {
          throw new Error(`Invalid category: ${result.category}`);
        }
      }
      
      return results;
    } catch (validationError) {
      this.logger.warn('Heuristic category validation failed, using fallback', {
        error: validationError.message,
        results
      });
      return [{ category: 'Templates/Systems', confidence: 0.5 }];
    }
  }

  /**
   * Keyword-based category classification using official categories
   */
  classifyWithKeywords(asset) {
    const validCategories = this.config.getValidCategories();
    const assetDesc = asset.long_description || asset.short_description || asset.description || '';
    const assetText = `${asset.title || ''} ${assetDesc} ${(asset.tags || []).join(' ')}`.toLowerCase();

    // Map keywords to official categories  
    const categoryKeywords = {
      '3D/Characters': ['character', '3d character', 'humanoid', 'avatar', 'person', 'hero'],
      '3D/Environments': ['environment', '3d environment', 'scene', 'level', 'world', 'landscape'],
      '3D/Props': ['prop', '3d prop', 'object', 'furniture', 'item', 'asset'],
      '3D/Vehicles': ['vehicle', 'car', 'truck', 'aircraft', 'boat', 'transport'],
      '3D/Animations': ['animation', '3d animation', 'rigged', 'bones', 'motion'],
      '3D/GUI': ['3d gui', '3d ui', 'interface', 'menu'],
      '3D/Vegetation': ['vegetation', 'tree', 'plant', 'grass', 'nature'],
      
      '2D/Characters': ['2d character', 'sprite character', 'pixel art character'],
      '2D/Environments': ['2d environment', 'background', 'tileset', '2d level'],
      '2D/GUI': ['gui', 'ui', 'interface', 'menu', 'hud', 'button'],
      '2D/Fonts': ['font', 'typeface', 'text', 'typography'],
      '2D/Textures & Materials': ['texture', 'material', 'surface', '2d texture'],

      'Audio/Music': ['music', 'soundtrack', 'theme', 'loop', 'composition'],
      'Audio/Sound FX': ['sound', 'sfx', 'effect', 'audio effect'],
      'Audio/Ambient': ['ambient', 'atmosphere', 'environmental sound'],

      'Tools/AI-ML Integration': ['ai', 'machine learning', 'ml', 'neural', 'artificial intelligence'],
      'Tools/Animation': ['animation tool', 'rigging', 'timeline', 'animator'],
      'Tools/Audio': ['audio tool', 'sound tool', 'music tool'],
      'Tools/Behavior AI': ['behavior', 'ai behavior', 'npc', 'pathfinding'],
      'Tools/Camera': ['camera', 'cinemachine', 'follow camera'],
      'Tools/Game Toolkits': ['toolkit', 'framework', 'system', 'manager'],
      'Tools/Generative AI': ['generative', 'procedural', 'generator'],
      'Tools/GUI': ['ui tool', 'gui tool', 'interface tool'],
      'Tools/Input Management': ['input', 'controls', 'keyboard', 'mouse', 'touch'],
      'Tools/Integration': ['integration', 'api', 'plugin', 'connector'],
      'Tools/Level Design': ['level design', 'level editor', 'world building'],
      'Tools/Localization': ['localization', 'translation', 'language'],
      'Tools/Modeling': ['modeling', '3d modeling', 'mesh', 'geometry'],
      'Tools/Network': ['network', 'multiplayer', 'online', 'networking'],
      'Tools/Painting': ['painting', 'drawing', 'brush', 'texture painting'],
      'Tools/Particles & Effects': ['particle', 'effect', 'vfx', 'visual effect'],
      'Tools/Physics': ['physics', 'collision', 'rigidbody', 'dynamics'],
      'Tools/Sprite Management': ['sprite', 'atlas', '2d animation'],
      'Tools/Terrain': ['terrain', 'landscape', 'heightmap'],
      'Tools/Utilities': ['utility', 'helper', 'tool', 'extension'],

      'VFX/Particles': ['particle system', 'particle effect', 'particles', 'particle'],
      'VFX/Shaders': ['shader', 'material shader', 'visual shader', 'shaders', 'material', 'surface shader', 'rendering'],

      'Templates/Packs': ['pack', 'bundle', 'collection', 'template pack'],
      'Templates/Systems': ['system', 'game system', 'complete system'],
      'Templates/Tutorials': ['tutorial', 'example', 'demo', 'learning'],

      'AI/Generative AI': ['generative ai', 'ai generation', 'procedural ai'],
      'AI/AI-ML Integration': ['ai integration', 'ml integration', 'ai framework'],
      'AI/Behavior AI': ['ai behavior', 'intelligent behavior', 'smart ai']
    };

    const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
      const matches = keywords.filter(kw => assetText.includes(kw)).length;
      return { category, sim: matches };
    }).sort((a, b) => b.sim - a.sim);

    const total = Math.max(scores.reduce((a, b) => a + b.sim, 0), 1);
    
    // Return only top matches that have actual keyword matches
    const validMatches = scores.filter(s => s.sim > 0).slice(0, 3);
    if (validMatches.length === 0) {
      // Fallback to most common category
      return [{ category: 'Templates/Systems', confidence: 0.5 }];
    }

    const results = validMatches.map(s => ({
      category: s.category,
      confidence: +(s.sim / total).toFixed(2)
    }));

    // Validate results
    try {
      for (const result of results) {
        if (!this.config.isValidCategory(result.category)) {
          throw new Error(`Invalid category: ${result.category}`);
        }
      }
      return results;
    } catch (validationError) {
      this.logger.warn('Heuristic keyword classification validation failed', {
        error: validationError.message,
        results
      });
      return [{ category: 'Templates/Systems', confidence: 0.5 }];
    }
  }

  /**
   * Map legacy category names to official categories
   */
  mapToOfficialCategory(legacyCategory) {
    const mapping = {
      'Templates': 'Templates/Systems',
      'Scripts': 'Tools/Utilities', 
      'Tools': 'Tools/Utilities',
      'Models': '3D/Props',
      'Audio': 'Audio/Music',
      'Textures & Materials': '2D/Textures & Materials',
      'Characters': '3D/Characters',
      'Environments': '3D/Environments'
    };

    // If it's already in the correct format, validate it
    if (legacyCategory.includes('/')) {
      return this.config.isValidCategory(legacyCategory) ? legacyCategory : null;
    }

    // Map legacy names
    return mapping[legacyCategory] || null;
  }

  /**
   * Helper method to count words in text
   */
  getWordCount(text) {
    return text.replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0).length;
  }

  /**
   * Helper method to calculate days between dates
   */
  daysBetween(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    return Math.floor((Date.now() - date) / 86400000);
  }
}

export default HeuristicSuggestions;