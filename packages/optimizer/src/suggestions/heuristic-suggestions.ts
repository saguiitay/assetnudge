/**
 * Heuristic Suggestions Module
 * Provides fallback suggestion algorithms when AI is unavailable
 */

import { tokenize } from '../utils/utils';
import { Logger } from '../utils/logger';
import { DedicatedSuggestionParams, DescriptionSuggestion, TagSuggestion, TitleSuggestion } from './types';

/**
 * Configuration interface required by HeuristicSuggestions
 */
interface HeuristicConfig {
  debug: boolean;
  thresholds: {
    tags: {
      maximum: number;
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
  getValidCategories(): string[];
  isValidCategory(category: string): boolean;
}

/**
 * Recommendation item
 */
export interface Recommendation {
  item: string;
  effort: string;
  impact: string;
}

/**
 * Heuristic-based suggestion generator
 */
export class HeuristicSuggestions {
  private config: HeuristicConfig;
  private logger: Logger;

  constructor(config: HeuristicConfig) {
    this.config = config;
    this.logger = new Logger('heuristic-suggestions', true);
  }

  /**
   * Generate tag suggestions using category vocabulary
   */
  suggestTags(params: DedicatedSuggestionParams): TagSuggestion[] {
    const maxTags = this.config.thresholds.tags.maximum;
    const categoryVocab = params.categoryVocabulary!;
    const currentTags = new Set((params.asset.tags || []).map(x => String(x).toLowerCase()));

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
  suggestTitle(params: DedicatedSuggestionParams): TitleSuggestion[] {
    const category = params.asset.category || 'Templates';

    this.logger.debug('Generating heuristic title suggestions', {
      category,
      currentTitle: params.asset.title
    });

    // Get relevant keywords
    const keywords = [
      ...(params.categoryVocabulary!.top_unigrams?.slice(0, 10).map(x => x.t) || []),
      ...(params.categoryVocabulary!.top_bigrams?.slice(0, 5).map(x => x.t) || [])
    ];

    const existingTokens = new Set(tokenize(params.asset.title || '').uni);
    const availableKeywords = keywords
      .filter(t => !t.includes(' ') ? !existingTokens.has(t) : true)
      .slice(0, 3);

    const baseTitle = params.asset.title || 'Unity Asset Template';

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
  suggestShortDescription(params: DedicatedSuggestionParams): DescriptionSuggestion[] {
    const category = params.asset.category || 'Templates';
    const categoryVocab = params.categoryVocabulary!;

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

    return [{
      description: shortDescription
    }];
  }

  
  /**
   * Generate description suggestions with marketing structure
   */
  suggestLongDescription(params: DedicatedSuggestionParams): DescriptionSuggestion[] {
    const category = params.asset.category || 'Templates';
    const categoryVocab = params.categoryVocabulary!;

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

    const longDescription = this.buildLongDescription(category, uniqueKeywords);

    return [{
      description: longDescription
    }];
  }

  /**
   * Build structured long description
   */
  private buildLongDescription(category: string, keywords: string[]): string {
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
}

export default HeuristicSuggestions;