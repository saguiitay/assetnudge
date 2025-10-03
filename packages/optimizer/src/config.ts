/**
 * Configuration Management
 * Centralized configuration for the Unity Asset Optimizer
 */

// Type definitions
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
    rating: number;
    reviews: number;
    freshness: number;
  };
  find: {
    tagcov: number;
    titlekw: number;
    pricez: number;
  };
  perf: {
    cvr: number;
    hv_lc_penalty: number;
  };
}

export interface ThresholdConfig {
  title: {
    minLength: number;
    maxLength: number;
  };
  shortDesc: {
    minLength: number;
    maxLength: number;
  };
  longDesc: {
    minWords: number;
  };
  images: {
    minimum: number;
  };
  videos: {
    minimum: number;
  };
  bullets: {
    minimum: number;
  };
  rating: {
    minimum: number;
  };
  reviews: {
    minimum: number;
  };
  freshness: {
    maxDays: number;
  };
  tags: {
    minimum: number;
    maximum: number;
  };
  similarity: {
    neighbors: number;
    topUnigrams: number;
    topBigrams: number;
    topTags: number;
  };
}

export interface AIConfig {
  defaultModel: string;
  maxRetries: number;
  timeout: number;
  fallbackToHeuristic: boolean;
}

export interface PathConfig {
  defaultVocab: string;
  defaultAsset: string;
  dataDir: string;
}

export interface TextProcessingConfig {
  ignoreStopWords: boolean;
}

export interface CategoryMap {
  [key: string]: string[];
}

export interface OpenAIClientConfig {
  apiKey: string | null;
  model: string;
  maxRetries: number;
  timeout: number;
}

// Default scoring weights
export const DEFAULT_WEIGHTS: WeightConfig = {
  content: { title: 6, short: 6, long: 8, bullets: 7, cta: 3, uvp: 5 },
  media: { images: 8, video: 8, gif: 4 },
  trust: { rating: 5, reviews: 5, freshness: 5 },
  find: { tagcov: 7, titlekw: 5, pricez: 3 },
  perf: { cvr: 10, hv_lc_penalty: 5 }
};

// Default content thresholds and limits
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  title: { minLength: 50, maxLength: 80 },
  shortDesc: { minLength: 120, maxLength: 180 },
  longDesc: { minWords: 300 },
  images: { minimum: 5 },
  videos: { minimum: 1 },
  bullets: { minimum: 6 },
  rating: { minimum: 4.5 },
  reviews: { minimum: 10 },
  freshness: { maxDays: 180 },
  tags: { minimum: 10, maximum: 15 },
  similarity: { neighbors: 5, topUnigrams: 200, topBigrams: 200, topTags: 100 }
};

// AI model configuration
export const AI_CONFIG: AIConfig = {
  defaultModel: 'gpt-4o-mini',
  maxRetries: 3,
  timeout: 30000,
  fallbackToHeuristic: true
};

// Official Unity Asset Store categories and subcategories
export const OFFICIAL_CATEGORIES: CategoryMap = {
  '3D': [
    'Animations',
    'Characters', 
    'Environments',
    'GUI',
    'Props',
    'Vegetation',
    'Vehicles'
  ],
  '2D': [
    'Characters',
    'Environments', 
    'Fonts',
    'GUI',
    'Textures & Materials'
  ],
  'Audio': [
    'Ambient',
    'Music',
    'Sound FX'
  ],
  'Tools': [
    'AI-ML Integration',
    'Animation',
    'Audio',
    'Behavior AI',
    'Camera',
    'Game Toolkits',
    'Generative AI',
    'GUI',
    'Input Management',
    'Integration',
    'Level Design',
    'Localization',
    'Modeling',
    'Network',
    'Painting',
    'Particles & Effects',
    'Physics',
    'Sprite Management',
    'Terrain',
    'Utilities'
  ],
  'VFX': [
    'Particles',
    'Shaders'
  ],
  'Templates': [
    'Packs',
    'Systems',
    'Tutorials'
  ],
  'AI': [
    'Generative AI',
    'AI-ML Integration',
    'Behavior AI'
  ]
};

// File paths and naming conventions
export const PATHS: PathConfig = {
  defaultVocab: 'vocab.json',
  defaultAsset: 'scraped_asset.json',
  dataDir: 'data'
};

// Text processing configuration
export const TEXT_PROCESSING: TextProcessingConfig = {
  ignoreStopWords: true // Filter common stop words during tokenization
};

/**
 * Configuration manager class
 */
export class Config {
  public weights: WeightConfig;
  public thresholds: ThresholdConfig;
  public ai: AIConfig;
  public paths: PathConfig;
  public categories: CategoryMap;
  public textProcessing: TextProcessingConfig;
  public apiKey: string | null;
  public debug: boolean;

  constructor() {
    this.weights = { ...DEFAULT_WEIGHTS };
    this.thresholds = { ...DEFAULT_THRESHOLDS };
    this.ai = { ...AI_CONFIG };
    this.paths = { ...PATHS };
    this.categories = { ...OFFICIAL_CATEGORIES };
    this.textProcessing = { ...TEXT_PROCESSING };
    this.apiKey = null;
    this.debug = false;
  }

  /**
   * Initialize configuration from environment variables and command line args
   */
  static fromEnvironment(args: string[] = []): Config {
    const config = new Config();
    
    // Parse command line arguments
    const getFlag = (name: string, def?: string): string | undefined => {
      const i = args.indexOf('--' + name);
      return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
    };
    
    const getBool = (name: string, def: boolean = false): boolean => {
      const v = getFlag(name, def ? 'true' : 'false');
      return String(v).toLowerCase() === 'true';
    };

    // Set API key from environment or command line
    config.apiKey = getFlag('apiKey', process.env.OPENAI_API_KEY) || null;
    
    // Set AI model
    const modelFlag = getFlag('model', config.ai.defaultModel);
    if (modelFlag) {
      config.ai.defaultModel = modelFlag;
    }
    
    // Set debug mode
    config.debug = getBool('debug', false);
    
    // Set stop words filtering
    config.textProcessing.ignoreStopWords = getBool('ignore-stop-words', config.textProcessing.ignoreStopWords);
    
    // Override thresholds if specified
    const customWeights = getFlag('weights');
    if (customWeights) {
      try {
        const parsed = JSON.parse(customWeights) as Partial<WeightConfig>;
        config.weights = { ...config.weights, ...parsed };
      } catch (error) {
        console.warn('Invalid weights JSON, using defaults');
      }
    }

    return config;
  }

  /**
   * Validate configuration and check dependencies
   */
  validate(): string[] {
    const issues: string[] = [];

    // Check if AI features are properly configured
    if (!this.apiKey) {
      issues.push('No OpenAI API key found - AI features will be disabled');
    }

    // Validate weights sum to reasonable totals
    const contentTotal = Object.values(this.weights.content).reduce((a, b) => a + b, 0);
    const mediaTotal = Object.values(this.weights.media).reduce((a, b) => a + b, 0);
    const trustTotal = Object.values(this.weights.trust).reduce((a, b) => a + b, 0);
    const findTotal = Object.values(this.weights.find).reduce((a, b) => a + b, 0);
    const perfTotal = Object.values(this.weights.perf).reduce((a, b) => a + b, 0);

    const total = contentTotal + mediaTotal + trustTotal + findTotal + perfTotal;
    if (total < 80 || total > 120) {
      issues.push(`Scoring weights total ${total} is outside expected range 80-120`);
    }

    return issues;
  }

  /**
   * Get OpenAI client configuration
   */
  getOpenAIConfig(): OpenAIClientConfig {
    return {
      apiKey: this.apiKey,
      model: this.ai.defaultModel,
      maxRetries: this.ai.maxRetries,
      timeout: this.ai.timeout
    };
  }

  /**
   * Check if AI features are available
   */
  hasAI(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Get valid categories as flat list for validation
   */
  getValidCategories(): string[] {
    const categories: string[] = [];
    for (const [mainCategory, subCategories] of Object.entries(this.categories)) {
      for (const subCategory of subCategories) {
        categories.push(`${mainCategory}/${subCategory}`);
      }
    }
    return categories;
  }

  /**
   * Validate if a category is in the official list
   */
  isValidCategory(category: string): boolean {
    return this.getValidCategories().includes(category);
  }

  /**
   * Get main category from full category path
   */
  getMainCategory(fullCategory: string): string {
    return fullCategory.split('/')[0] || '';
  }

  /**
   * Get subcategory from full category path  
   */
  getSubCategory(fullCategory: string): string | undefined {
    return fullCategory.split('/')[1];
  }

  /**
   * Convert config back to command line args format
   */
  toArgs(): string[] {
    const args: string[] = [];
    
    if (this.debug) {
      args.push('--debug', 'true');
    }
    
    if (this.apiKey) {
      args.push('--apiKey', this.apiKey);
    }
    
    if (this.ai.defaultModel !== AI_CONFIG.defaultModel) {
      args.push('--model', this.ai.defaultModel);
    }
    
    return args;
  }
}

export default Config;