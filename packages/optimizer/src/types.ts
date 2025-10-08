/**
 * @fileoverview TypeScript type definitions for Unity Asset Store assets
 */

/**
 * Rating data for an asset with count and star value
 */
export interface AssetRating {
  /** Number of ratings for this star value */
  count: string;
  /** Star rating value (1-5) */
  value: string;
}

/**
 * Main promotional images for an asset in various sizes
 */
export interface AssetMainImage {
  /** URL for large main image */
  big: string;
  /** URL for Facebook share image */
  facebook: string;
  /** URL for small main image */
  small: string;
  /** URL for icon image */
  icon: string;
  /** URL for 75px icon image */
  icon75: string;
}

/**
 * Screenshot image data for an asset
 */
export interface AssetImage {
  /** type of the image */
  type: string;
  /** URL for full-size image */
  imageUrl: string;
  /** URL for thumbnail image */
  thumbnailUrl: string;
}

/**
 * Video data for an asset
 */
export interface AssetVideo
{
  /** type of the video */
  type: string;
  /** URL for full-size video */
  imageUrl: string;
  /** URL for thumbnail image */
  thumbnailUrl: string;
}

/**
 * Complete Unity Asset Store asset data structure
 */
export interface Asset {
  /** Unique asset ID */
  id: string;
  /** Asset Store URL for this asset */
  url: string;
  /** Asset title/name */
  title: string;
  /** Brief description of the asset */
  short_description: string;
  /** Detailed HTML description of the asset */
  long_description: string;
  /** Array of tag strings describing the asset */
  tags: string[];
  /** Asset category (e.g., "Tools", "Templates", etc.) */
  category: string;
  /** Asset price in USD */
  price: number;
  /** Number of screenshot images */
  images_count: number;
  /** Number of video previews */
  videos_count: number;
  /** Array of rating objects with counts for each star value */
  rating: AssetRating[];
  /** Total number of reviews */
  reviews_count: number;
  /** Last update date string */
  last_update: string;
  /** Publisher/developer name */
  publisher: string;
  /** Asset package size (e.g., "2.3 MB") */
  size: string;
  /** Asset version string */
  version: string;
  /** Asset version information HTML string */
  publishNotes: string;
  /** Number of users who favorited this asset */
  favorites: number;
  /** Main promotional images in various sizes */
  mainImage: AssetMainImage | undefined;
  /** Array of screenshot images */
  images: AssetImage[];
  /** Array of video previews */
  videos: AssetVideo[];
}

/**
 * Configuration interface for the asset grader
 */
export interface GraderConfig {
  weights: WeightConfig;
  thresholds: ThresholdConfig;
  textProcessing?: {
    ignoreStopWords?: boolean;
  };
}

/**
 * Weight configuration for different scoring dimensions
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
    publishNotes: number;
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
 * Threshold configuration for various metrics
 */
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
  bullets: {
    minimum: number;
  };
  images: {
    minimum: number;
  };
  videos: {
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
  similarity: {
    topUnigrams: number;
    topBigrams: number;
    topTags: number;
  };
}

/**
 * Vocabulary data structure for a category
 */
export interface CategoryVocabulary {
  top_unigrams: Array<{ t: string; c: number }>;
  top_bigrams: Array<{ t: string; c: number }>;
  top_tags: Array<{ t: string; c: number }>;
  med_images: number | null;
  med_videos: number | null;
  med_price: number | null;
  price_mean: number | null;
  price_std: number | null;
  title_length: {
    median: number | null;
    mean: number | null;
    std: number | null;
  };
  short_desc_length: {
    median: number | null;
    mean: number | null;
    std: number | null;
  };
  long_desc_length: {
    median: number | null;
    mean: number | null;
    std: number | null;
  };
  word_count_short: {
    median: number | null;
    mean: number | null;
    std: number | null;
  };
  word_count_long: {
    median: number | null;
    mean: number | null;
    std: number | null;
  };
  tag_count: {
    median: number | null;
    mean: number | null;
    std: number | null;
  };
  bullet_count: {
    median: number | null;
    mean: number | null;
  };
  sample_size: number;
}

/**
 * Complete vocabulary structure with categories
 */
export interface Vocabulary {
  [category: string]: CategoryVocabulary;
}

/**
 * Prepared content for analysis
 */
export interface PreparedContent {
  title: string;
  shortDesc: string;
  longDesc: string;
  description: string;
  short: string;
  bullets: number;
  hasCTA: boolean;
  hasUVP: boolean;
  wordCount: number;
}

/**
 * Scoring result with score and reasons
 */
export interface ScoreResult {
  score: number;
  reasons: string[];
}

/**
 * Grade breakdown by dimension
 */
export interface GradeBreakdown {
  content: number;
  media: number;
  trust: number;
  findability: number;
}

/**
 * Complete grade result
 */
export interface GradeResult {
  score: number;
  letter: 'A' | 'B' | 'C' | 'D' | 'F';
  reasons: string[];
  breakdown: GradeBreakdown;
}

/**
 * Best seller asset data for identification
 */
export interface BestSellerAsset {
  /** Asset ID for matching */
  id?: string;
  /** Asset Store URL for matching */
  url?: string;
  /** Asset title for matching */
  title?: string;
  /** Asset category */
  category?: string;
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Dynamic grading rules system interfaces
 */

/**
 * Rule confidence metadata
 */
export interface RuleConfidence {
  /** Confidence level based on sample size and data quality */
  level: 'high' | 'medium' | 'low';
  /** Number of exemplars used to generate this rule */
  sampleSize: number;
  /** Data quality score (0-100) */
  dataQuality: number;
  /** Standard deviation of the metric across exemplars */
  standardDeviation?: number;
  /** Explanation of confidence level */
  explanation: string;
}

/**
 * Category-specific benchmarks derived from exemplars
 */
export interface CategoryBenchmarks {
  /** Rating benchmarks */
  rating: {
    minimum: number;
    target: number;
    excellent: number;
  };
  /** Review count benchmarks */
  reviews: {
    minimum: number;
    target: number;
    excellent: number;
  };
  /** Media presence benchmarks */
  media: {
    minImages: number;
    targetImages: number;
    minVideos: number;
    targetVideos: number;
  };
  /** Content length benchmarks */
  content: {
    titleLength: { min: number; max: number; target: number };
    shortDescLength: { min: number; max: number; target: number };
    longDescLength: { min: number; max: number; target: number };
    minTags: number;
    targetTags: number;
  };
  /** Pricing benchmarks */
  pricing: {
    median: number;
    p25: number;
    p75: number;
    premium: number;
  };
  /** Freshness benchmarks */
  freshness: {
    maxDaysOld: number;
    targetDaysOld: number;
  };
}

/**
 * Weight importance derived from exemplar analysis
 */
export interface WeightImportance {
  /** Overall importance percentages (should sum to 100) */
  content: number;
  media: number;
  trust: number;
  findability: number;
  /** Detailed content sub-weights */
  contentBreakdown: {
    title: number;
    shortDesc: number;
    longDesc: number;
    tags: number;
    structure: number;
  };
  /** Detailed media sub-weights */
  mediaBreakdown: {
    images: number;
    videos: number;
    quality: number;
  };
}

/**
 * Category-specific dynamic grading rules
 */
export interface CategoryRules {
  /** Category name */
  category: string;
  /** Dynamic weights based on exemplar analysis */
  weights: WeightConfig;
  /** Dynamic thresholds based on exemplar benchmarks */
  thresholds: ThresholdConfig;
  /** Category-specific benchmarks */
  benchmarks: CategoryBenchmarks;
  /** Weight importance analysis */
  weightImportance: WeightImportance;
  /** Rule confidence metadata */
  confidence: RuleConfidence;
  /** Common failure patterns in this category */
  commonFailures: string[];
  /** Success patterns in this category */
  successPatterns: string[];
  /** Generation metadata */
  metadata: {
    generatedAt: string;
    exemplarCount: number;
    avgQualityScore: number;
    avgRatingQuality: number;
    bestSellerCount: number;
  };
}

/**
 * Complete dynamic grading rules system
 */
export interface DynamicGradingRules {
  /** Rules by category */
  [category: string]: CategoryRules;
}

/**
 * Dynamic grading rules file format
 */
export interface DynamicGradingRulesFile {
  /** The dynamic rules by category */
  rules: DynamicGradingRules;
  /** Global metadata */
  metadata: {
    generatedAt: string;
    sourceExemplars: string;
    totalCategories: number;
    totalExemplars: number;
    bestSellersCount: number;
    confidenceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  /** Static fallback rules for categories with insufficient data */
  fallbackRules: {
    weights: WeightConfig;
    thresholds: ThresholdConfig;
  };
}
