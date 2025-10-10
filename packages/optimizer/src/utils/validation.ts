/**
 * Input Validation Module
 * Provides robust validation for all inputs to the Unity Asset Optimizer
 */

import { Logger } from './logger';
import { OFFICIAL_CATEGORIES } from '../config';
import * as fs from 'fs';
import { Asset } from '../types';

const logger = new Logger('validator');

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public field: string | null;
  public value: any;

  constructor(message: string, field: string | null = null, value: any = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}
/**
 * Vocabulary interface
 */
export interface Vocabulary {
  [category: string]: CategoryVocabulary;
}

/**
 * Category vocabulary interface
 */
export interface CategoryVocabulary {
  top_unigrams: string[];
  top_bigrams: string[];
  top_tags: string[];
  med_images: number;
  med_videos: number;
  sample_size: number;
  [key: string]: any;
}

/**
 * Category suggestion interface
 */
export interface CategorySuggestion {
  category: string;
  confidence?: number;
  [key: string]: any;
}

/**
 * Weights configuration interface (using the one from config.ts)
 */
export interface WeightConfig {
  content: {
    title: number;
    short: number;
    long: number;
    bullets: number;
    cta: number;
    uvp: number;
  };
  media: {
    images: number;
    video: number;
    gif: number;
  };
  trust: {
    freshness: number;
    documentation: number;
    completeness: number;
    version: number;
    rating: number;
    reviews: number;
  };
  find: {
    tagcov: number;
    titlekw: number;
    pricez: number;
  };
}

/**
 * Asset data validator
 */
export class AssetValidator {
  /**
   * Validate basic asset structure
   */
  static validateAsset(asset: Asset): boolean {
    const errors: string[] = [];

    if (!asset || typeof asset !== 'object') {
      throw new ValidationError('Asset must be a valid object');
    }

    // Validate required fields
    if (!asset.title || typeof asset.title !== 'string' || asset.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }

    // Validate optional numeric fields
    const numericFields: (keyof Asset)[] = ['price', 'images_count', 'videos_count', 'reviews_count'];
    for (const field of numericFields) {
      if (asset[field] !== undefined && asset[field] !== null) {
        if (typeof asset[field] !== 'number' || isNaN(asset[field] as number) || (asset[field] as number) < 0) {
          errors.push(`${field} must be a non-negative number`);
        }
      }
    }

    // Validate tags array
    if (asset.tags !== undefined && asset.tags !== null) {
      if (!Array.isArray(asset.tags)) {
        errors.push('tags must be an array');
      } else {
        for (let i = 0; i < asset.tags.length; i++) {
          if (typeof asset.tags[i] !== 'string') {
            errors.push(`tags[${i}] must be a string`);
          }
        }
      }
    }

    // Validate date fields (warn but don't fail for invalid dates)
    const dateFields: (keyof Asset)[] = ['last_update'];
    for (const field of dateFields) {
      if (asset[field] !== undefined && asset[field] !== null && asset[field] !== '') {
        const date = new Date(asset[field] as string | Date);
        if (isNaN(date.getTime())) {
          // Log warning but don't add to errors - let the grader handle invalid dates gracefully
          console.warn(`Warning: Asset ${asset.id || asset.title || 'unknown'} has invalid ${field}: ${asset[field]}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(`Asset validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Validate corpus data (array of assets)
   */
  static validateCorpus(corpus: any): number {
    if (!Array.isArray(corpus)) {
      throw new ValidationError('Corpus must be an array');
    }

    if (corpus.length === 0) {
      throw new ValidationError('Corpus cannot be empty');
    }

    const errors: string[] = [];
    for (let i = 0; i < corpus.length; i++) {
      try {
        this.validateAsset(corpus[i]);
      } catch (error) {
        errors.push(`Asset ${i}: ${(error as Error).message}`);
      }
    }

    if (errors.length > 0) {
      logger.warn(`Corpus validation found ${errors.length} invalid assets`, { 
        total: corpus.length,
        valid: corpus.length - errors.length 
      });
      
      // Log first few errors for debugging
      errors.slice(0, 5).forEach(error => logger.debug(error));
      
      if (errors.length > 5) {
        logger.debug(`... and ${errors.length - 5} more errors`);
      }
    }

    return corpus.length - errors.length; // Return count of valid assets
  }

  /**
   * Validate vocabulary data structure
   */
  static validateVocabulary(vocab: any): boolean {
    if (!vocab || typeof vocab !== 'object') {
      throw new ValidationError('Vocabulary must be a valid object');
    }

    const categories = Object.keys(vocab);
    if (categories.length === 0) {
      throw new ValidationError('Vocabulary must contain at least one category');
    }

    for (const category of categories) {
      const catData = vocab[category];
      
      if (!catData || typeof catData !== 'object') {
        throw new ValidationError(`Category '${category}' data must be an object`);
      }

      // Validate required arrays
      const requiredArrays: (keyof CategoryVocabulary)[] = ['top_unigrams', 'top_bigrams', 'top_tags'];
      for (const field of requiredArrays) {
        if (!Array.isArray(catData[field])) {
          throw new ValidationError(`Category '${category}' ${field} must be an array`);
        }
      }

      // Validate required numeric fields
      const requiredNumbers: (keyof CategoryVocabulary)[] = ['med_images', 'med_videos', 'sample_size'];
      for (const field of requiredNumbers) {
        if (typeof catData[field] !== 'number' || isNaN(catData[field] as number)) {
          throw new ValidationError(`Category '${category}' ${field} must be a number`);
        }
      }
    }

    return true;
  }
}

/**
 * URL validator
 */
export class URLValidator {
  /**
   * Validate Unity Asset Store URL
   */
  static validateAssetStoreURL(url: any): boolean {
    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL must be a non-empty string');
    }

    try {
      const parsed = new URL(url);
      
      // Check if it's a Unity Asset Store URL
      const validHosts = ['assetstore.unity.com', 'assetstore.unity3d.com'];
      if (!validHosts.some(host => parsed.hostname.includes(host))) {
        logger.warn('URL does not appear to be from Unity Asset Store', { url });
      }

      return true;
    } catch (error) {
      throw new ValidationError('Invalid URL format', 'url', url);
    }
  }
}

/**
 * File validator
 */
export class FileValidator {
  /**
   * Validate file exists and is readable
   */
  static async validateFile(filePath: any): Promise<boolean> {
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path must be a non-empty string');
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      throw new ValidationError(`File not found or not readable: ${filePath}`, 'filePath', filePath);
    }
  }

  /**
   * Validate JSON file and parse it
   */
  static async validateJSONFile(filePath: any): Promise<any> {
    await this.validateFile(filePath);
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ValidationError(`Invalid JSON in file: ${filePath}`, 'filePath', filePath);
      }
      throw error;
    }
  }
}

/**
 * Configuration validator
 */
export class ConfigValidator {
  /**
   * Validate scoring weights configuration
   */
  static validateWeights(weights: any): boolean {
    if (!weights || typeof weights !== 'object') {
      throw new ValidationError('Weights must be a valid object');
    }

    const requiredSections: (keyof WeightConfig)[] = ['content', 'media', 'trust', 'find'];
    for (const section of requiredSections) {
      if (!weights[section] || typeof weights[section] !== 'object') {
        throw new ValidationError(`Weights must include '${section}' section`);
      }

      // Validate all weights are positive numbers
      for (const [key, value] of Object.entries(weights[section])) {
        if (typeof value !== 'number' || isNaN(value) || value < 0) {
          throw new ValidationError(`Weight ${section}.${key} must be a non-negative number`);
        }
      }
    }

    return true;
  }

  /**
   * Get all valid categories as flat list
   */
  static getValidCategories(): string[] {
    const categories: string[] = [];
    for (const [mainCategory, subCategories] of Object.entries(OFFICIAL_CATEGORIES)) {
      for (const subCategory of subCategories) {
        categories.push(`${mainCategory}/${subCategory}`);
      }
    }
    return categories;
  }

  /**
   * Validate if a category is in the official Unity Asset Store list
   */
  static validateCategory(category: any): boolean {
    if (!category || typeof category !== 'string') {
      throw new ValidationError('Category must be a non-empty string', 'category', category);
    }

    const validCategories = this.getValidCategories();
    if (!validCategories.includes(category)) {
      throw new ValidationError(
        `Invalid category "${category}". Must be one of: ${validCategories.join(', ')}`,
        'category',
        category
      );
    }

    return true;
  }

  /**
   * Validate suggested categories from AI/heuristic systems
   */
  static validateSuggestedCategories(suggestions: any): boolean {
    if (!suggestions) {
      throw new ValidationError('Category suggestions are required');
    }

    // Handle both single category suggestion (AI) and array of suggestions (heuristic)
    const categoriesToValidate: CategorySuggestion[] = Array.isArray(suggestions) ? suggestions : [suggestions];

    for (const suggestion of categoriesToValidate) {
      if (!suggestion || typeof suggestion !== 'object') {
        throw new ValidationError('Each category suggestion must be an object');
      }

      if (!suggestion.category || typeof suggestion.category !== 'string') {
        throw new ValidationError('Each category suggestion must have a category string');
      }

      // Validate the category is in the official list
      this.validateCategory(suggestion.category);

      if (suggestion.confidence !== undefined) {
        if (typeof suggestion.confidence !== 'number' || 
            isNaN(suggestion.confidence) || 
            suggestion.confidence < 0 || 
            suggestion.confidence > 1) {
          throw new ValidationError(
            'Category confidence must be a number between 0 and 1',
            'confidence',
            suggestion.confidence
          );
        }
      }
    }

    return true;
  }

  /**
   * Sanitize and validate a category string, mapping legacy names if needed
   */
  static sanitizeCategory(category: any): string | null {
    if (!category || typeof category !== 'string') {
      return null;
    }

    const trimmed = category.trim();
    
    // If already in correct format, validate and return
    if (trimmed.includes('/')) {
      try {
        this.validateCategory(trimmed);
        return trimmed;
      } catch {
        return null;
      }
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
    if (mapped) {
      try {
        this.validateCategory(mapped);
        return mapped;
      } catch {
        return null;
      }
    }

    return null;
  }
}

/**
 * Setup validator for the Unity Asset Optimizer
 */
export class SetupValidator {
  /**
   * Validate configuration and dependencies
   */
  static async validateSetup(config: any, aiEngine: any, logger: any): Promise<string[]> {
    logger.info('Validating setup...');
    
    const issues = config.validate();
    
    if (issues.length > 0) {
      issues.forEach((issue: string) => logger.warn(issue));
    }

    // Test AI connection if available
    if (config.hasAI()) {
      const aiTest = await aiEngine.testConnection();
      if (aiTest.success) {
        logger.success('AI connection test passed', { model: aiTest.model });
      } else {
        logger.error('AI connection test failed', null, { error: aiTest.error });
      }
    }

    return issues;
  }
}

export { logger as validatorLogger };