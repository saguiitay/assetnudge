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
  freshness: {
    maxDays: number;
  };
  rating: {
    minimum: number;
  };
  reviews: {
    minimum: number;
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
  trust: { freshness: 6, documentation: 3, completeness: 2, version: 1, rating: 4, reviews: 3 },
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
  freshness: { maxDays: 180 },
  rating: { minimum: 3.5 },
  reviews: { minimum: 10 },
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
  '2D': [
    'Characters',
    'Environments',
    'Fonts',
    'GUI',
    'GUI/Icons',
    'Textures & Materials',
    'Textures & Materials/Abstract',
    'Textures & Materials/Brick',
    'Textures & Materials/Building',
    'Textures & Materials/Concrete',
    'Textures & Materials/Fabric',
    'Textures & Materials/Floors',
    'Textures & Materials/Food',
    'Textures & Materials/Glass',
    'Textures & Materials/Metals',
    'Textures & Materials/Nature',
    'Textures & Materials/Roads',
    'Textures & Materials/Roofing',
    'Textures & Materials/Sky',
    'Textures & Materials/Stone',
    'Textures & Materials/Tiles',
    'Textures & Materials/Water',
    'Textures & Materials/Wood'
  ],
  '3D': [
    'Animations',
    'Characters',
    'Characters/Animals',
    'Characters/Animals/Birds',
    'Characters/Animals/Fish',
    'Characters/Animals/Insects',
    'Characters/Animals/Mammals',
    'Characters/Animals/Reptiles',
    'Characters/Creatures',
    'Characters/Humanoids',
    'Characters/Humanoids/Fantasy',
    'Characters/Humanoids/Humans',
    'Characters/Humanoids/Sci-Fi',
    'Characters/Humanoids/Robots',
    'Environments',
    'Environments/Dungeons',
    'Environments/Fantasy',
    'Environments/Historic',
    'Environments/Industrial',
    'Environments/Landscapes',
    'Environments/Roadways',
    'Environments/Sci-Fi',
    'Environments/Urban',
    'Environments/GUI',
    'Props',
    'Props/Clothing',
    'Props/Accessories',
    'Props/Armor',
    'Props/Electronics',
    'Props/Exterior',
    'Props/Food',
    'Props/Furniture',
    'Props/Guns',
    'Props/Industrial',
    'Props/Interior',
    'Props/Tools',
    'Props/Weapons',
    'Vegetation',
    'Vegetation/Flowers',
    'Vegetation/Plants',
    'Vegetation/Trees',
    'Vehicles',
    'Vehicles/Air',
    'Vehicles/Land',
    'Vehicles/Sea',
    'Vehicles/Space'
  ],
  'Add-Ons': [
    'Machine Learning',
    'Services',
    'Services/Billing'
  ],
  'Audio': [
    'Ambient',
    'Fantasy',
    'Nature',
    'Noise',
    'Sci-Fi',
    'Urban',
    'Music',
    'Music/Electronic',
    'Music/Orchestral',
    'Music/Pop',
    'Music/Rock',
    'Music/World',
    'Sound FX',
    'Sound FX/Animals',
    'Sound FX/Creatures',
    'Sound FX/Foley',
    'Sound FX/Transportation',
    'Sound FX/Voices',
    'Sound FX/Weapons'
  ],
  'Decentralization': [
    'Infrastructure'
  ],
  'Essentials': [
    'Asset Packs',
    'Certification',
    'Tutorial Projects'
  ],
  'Templates': [
    'Packs',
    'Systems',
    'Tutorials'
  ],
  'Tools': [
    'AI-ML Integration',
    'Animation',
    'Audio',
    'Behavior AI',
    'Camera',
    'GUI',
    'Game Toolkits',
    'Generative AI',
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
    'Utilities',
    'Version Control',
    'Video',
    'Visual Scripting'
  ],
  'VFX': [
    'Particles',
    'Environment',
    'Fire & Explosions',
    'Spells',
    'Shaders',
    'Shaders/DirectX 11',
    'Shaders/Fullscreen & Camera Effects',
    'Shaders/Substances'
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
      // Include main category itself
      categories.push(mainCategory);
      // Include all subcategories in full path format
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
    const validCategories = this.getValidCategories();
    return validCategories.includes(category);
  }

  /**
   * Get main category from full category path or return as-is if already main category
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
   * Get all subcategories for a main category
   */
  getSubCategories(mainCategory: string): string[] {
    return this.categories[mainCategory] || [];
  }

  /**
   * Get all subcategories for a main category in full path format
   */
  getFullSubCategories(mainCategory: string): string[] {
    const subCategories = this.getSubCategories(mainCategory);
    return subCategories.map(sub => `${mainCategory}/${sub}`);
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