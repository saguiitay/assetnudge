/**
 * Dynamic Grading Rules Extraction
 * Generates category-specific grading rules from exemplar patterns
 */

import { Logger } from './utils/logger';
import { 
  DynamicGradingRules, 
  DynamicGradingRulesFile,
  CategoryRules, 
  CategoryBenchmarks, 
  WeightImportance, 
  RuleConfidence,
  WeightConfig,
  ThresholdConfig
} from './types';
import { calculateDetailedRating } from './utils/rating-analysis';

const logger = new Logger('dynamic-rules');

/**
 * Extract dynamic grading rules from exemplars data
 * @param exemplarsData - Complete exemplars data with patterns
 * @param fallbackConfig - Static configuration for fallback
 * @returns Dynamic grading rules
 */
export function extractGradingRules(
  exemplarsData: any, 
  fallbackConfig: { weights: WeightConfig; thresholds: ThresholdConfig }
): DynamicGradingRulesFile {
  logger.info('Extracting dynamic grading rules from exemplars');
  
  const rules: DynamicGradingRules = {};
  const confidenceStats = { high: 0, medium: 0, low: 0 };
  let totalExemplars = 0;
  let totalBestSellers = 0;
  
  // Process each category
  for (const [category, exemplars] of Object.entries(exemplarsData.exemplars)) {
    if (!Array.isArray(exemplars) || exemplars.length === 0) {
      logger.warn(`Skipping category "${category}" - no exemplars`);
      continue;
    }
    
    logger.info(`Processing category: ${category}`, { exemplarCount: exemplars.length });
    
    try {
      const categoryRules = generateCategoryRules(category, exemplars, fallbackConfig);
      rules[category] = categoryRules;
      
      // Update confidence stats
      confidenceStats[categoryRules.confidence.level]++;
      totalExemplars += exemplars.length;
      totalBestSellers += categoryRules.metadata.bestSellerCount;
      
      logger.info(`Generated rules for ${category}`, {
        confidence: categoryRules.confidence.level,
        sampleSize: categoryRules.confidence.sampleSize
      });
    } catch (error) {
      logger.error(`Failed to generate rules for category "${category}"`, error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  const rulesFile: DynamicGradingRulesFile = {
    rules,
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceExemplars: exemplarsData.metadata?.corpusSize?.toString() || 'unknown',
      totalCategories: Object.keys(rules).length,
      totalExemplars,
      bestSellersCount: totalBestSellers,
      confidenceDistribution: confidenceStats
    },
    fallbackRules: fallbackConfig
  };
  
  logger.success('Dynamic grading rules extraction completed', {
    categories: Object.keys(rules).length,
    highConfidence: confidenceStats.high,
    mediumConfidence: confidenceStats.medium,
    lowConfidence: confidenceStats.low
  });
  
  return rulesFile;
}

/**
 * Generate category-specific grading rules
 * @param category - Category name
 * @param exemplars - Category exemplars
 * @param fallbackConfig - Static configuration for fallback
 * @returns Category rules
 */
function generateCategoryRules(
  category: string, 
  exemplars: any[], 
  fallbackConfig: { weights: WeightConfig; thresholds: ThresholdConfig }
): CategoryRules {
  const sampleSize = exemplars.length;
  
  // Calculate benchmarks from exemplar analysis
  const benchmarks = calculateCategoryBenchmarks(exemplars);
  
  // Generate dynamic weights based on exemplar success patterns
  const weights = generateDynamicWeights(exemplars, fallbackConfig.weights, benchmarks);
  
  // Generate dynamic thresholds based on exemplar performance
  const thresholds = generateDynamicThresholds(exemplars, fallbackConfig.thresholds, benchmarks);
  
  // Analyze weight importance
  const weightImportance = analyzeWeightImportance(exemplars);
  
  // Determine rule confidence
  const confidence = calculateRuleConfidence(exemplars, benchmarks);
  
  // Extract patterns
  const { commonFailures, successPatterns } = extractPatterns(exemplars);
  
  // Calculate metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    exemplarCount: sampleSize,
    avgQualityScore: exemplars.reduce((sum, e) => sum + (e.qualityScore || 0), 0) / sampleSize,
    avgRatingQuality: exemplars.reduce((sum, e) => sum + (e._ratingAnalysis?.ratingQuality || 0), 0) / sampleSize,
    bestSellerCount: exemplars.filter(e => e.isBestSeller).length
  };
  
  return {
    category,
    weights,
    thresholds,
    benchmarks,
    weightImportance,
    confidence,
    commonFailures,
    successPatterns,
    metadata
  };
}

/**
 * Calculate category benchmarks from exemplars
 * @param exemplars - Category exemplars
 * @returns Category benchmarks
 */
function calculateCategoryBenchmarks(exemplars: any[]): CategoryBenchmarks {
  // Extract metrics from exemplars
  const ratings = exemplars.map(e => {
    const ratingData = calculateDetailedRating(e.rating || []);
    return ratingData.averageRating;
  }).filter(r => r > 0);
  
  const reviewCounts = exemplars.map(e => e.reviews_count || 0).filter(r => r > 0);
  const imageCounts = exemplars.map(e => e.images_count || 0);
  const videoCounts = exemplars.map(e => e.videos_count || 0);
  const prices = exemplars.map(e => e.price || 0).filter(p => p > 0);
  
  // Content analysis
  const titleLengths = exemplars.map(e => (e.title || '').length).filter(l => l > 0);
  const shortDescLengths = exemplars.map(e => (e.short_description || '').length).filter(l => l > 0);
  const longDescLengths = exemplars.map(e => (e.long_description || '').length).filter(l => l > 0);
  const tagCounts = exemplars.map(e => (e.tags || []).length);
  
  // Freshness analysis (days since last update)
  const daysSinceUpdate = exemplars.map(e => {
    if (!e.last_update) return null;
    const updateDate = new Date(e.last_update);
    const now = new Date();
    return Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
  }).filter((d): d is number => d !== null && d >= 0);
  
  return {
    rating: {
      minimum: percentile(ratings, 25) || 3.5,
      target: percentile(ratings, 75) || 4.2,
      excellent: percentile(ratings, 90) || 4.5
    },
    reviews: {
      minimum: percentile(reviewCounts, 25) || 10,
      target: percentile(reviewCounts, 75) || 50,
      excellent: percentile(reviewCounts, 90) || 100
    },
    media: {
      minImages: Math.floor(percentile(imageCounts, 25)) || 3,
      targetImages: Math.floor(percentile(imageCounts, 75)) || 6,
      minVideos: Math.floor(percentile(videoCounts, 50)) || 1,
      targetVideos: Math.floor(percentile(videoCounts, 75)) || 2
    },
    content: {
      titleLength: {
        min: Math.floor(percentile(titleLengths, 10)) || 20,
        max: Math.floor(percentile(titleLengths, 90)) || 80,
        target: Math.floor(percentile(titleLengths, 50)) || 50
      },
      shortDescLength: {
        min: Math.floor(percentile(shortDescLengths, 25)) || 100,
        max: Math.floor(percentile(shortDescLengths, 90)) || 300,
        target: Math.floor(percentile(shortDescLengths, 75)) || 200
      },
      longDescLength: {
        min: Math.floor(percentile(longDescLengths, 25)) || 500,
        max: Math.floor(percentile(longDescLengths, 90)) || 3000,
        target: Math.floor(percentile(longDescLengths, 75)) || 1500
      },
      minTags: Math.floor(percentile(tagCounts, 25)) || 3,
      targetTags: Math.floor(percentile(tagCounts, 75)) || 6
    },
    pricing: {
      median: percentile(prices, 50) || 25,
      p25: percentile(prices, 25) || 10,
      p75: percentile(prices, 75) || 50,
      premium: percentile(prices, 90) || 100
    },
    freshness: {
      maxDaysOld: Math.floor(percentile(daysSinceUpdate, 75)) || 365,
      targetDaysOld: Math.floor(percentile(daysSinceUpdate, 50)) || 180
    }
  };
}

/**
 * Generate dynamic weights based on exemplar analysis
 * @param exemplars - Category exemplars
 * @param fallbackWeights - Static weights for fallback
 * @param benchmarks - Category benchmarks
 * @returns Dynamic weights
 */
function generateDynamicWeights(
  exemplars: any[], 
  fallbackWeights: WeightConfig, 
  benchmarks: CategoryBenchmarks
): WeightConfig {
  // Start with fallback weights
  const weights = JSON.parse(JSON.stringify(fallbackWeights)) as WeightConfig;
  
  // Analyze exemplar characteristics to adjust weights
  const avgImages = exemplars.reduce((sum, e) => sum + (e.images_count || 0), 0) / exemplars.length;
  const avgVideos = exemplars.reduce((sum, e) => sum + (e.videos_count || 0), 0) / exemplars.length;
  const avgRating = exemplars.reduce((sum, e) => {
    const ratingData = calculateDetailedRating(e.rating || []);
    return sum + ratingData.averageRating;
  }, 0) / exemplars.length;
  const avgReviews = exemplars.reduce((sum, e) => sum + (e.reviews_count || 0), 0) / exemplars.length;
  const bestSellerRatio = exemplars.filter(e => e.isBestSeller).length / exemplars.length;
  
  // Adjust media weights based on exemplar media presence
  if (avgImages > benchmarks.media.targetImages) {
    weights.media.images = Math.min(12, weights.media.images + 2);
    logger.debug(`Increased image weight for ${exemplars[0]?.category}: heavy visual category`);
  }
  
  if (avgVideos > benchmarks.media.targetVideos) {
    weights.media.video = Math.min(10, weights.media.video + 2);
    logger.debug(`Increased video weight for ${exemplars[0]?.category}: video-heavy category`);
  }
  
  // Adjust trust weights based on exemplar trust signals
  if (avgRating > benchmarks.rating.excellent) {
    weights.trust.rating = Math.min(8, weights.trust.rating + 1);
    logger.debug(`Increased rating weight for ${exemplars[0]?.category}: high-rating category`);
  }
  
  if (avgReviews > benchmarks.reviews.excellent) {
    weights.trust.reviews = Math.min(8, weights.trust.reviews + 1);
    logger.debug(`Increased reviews weight for ${exemplars[0]?.category}: review-heavy category`);
  }
  
  // Global adjustment for best seller presence
  if (bestSellerRatio > 0.2) {
    // If 20%+ are best sellers, increase all weights slightly (higher standards)
    const multiplier = 1 + (bestSellerRatio * 0.1);
    Object.keys(weights.content).forEach(key => {
      weights.content[key as keyof typeof weights.content] = Math.round(weights.content[key as keyof typeof weights.content] * multiplier);
    });
    logger.debug(`Applied best seller multiplier (${multiplier.toFixed(2)}) for ${exemplars[0]?.category}`);
  }
  
  return weights;
}

/**
 * Generate dynamic thresholds based on exemplar performance
 * @param exemplars - Category exemplars
 * @param fallbackThresholds - Static thresholds for fallback
 * @param benchmarks - Category benchmarks
 * @returns Dynamic thresholds
 */
function generateDynamicThresholds(
  exemplars: any[], 
  fallbackThresholds: ThresholdConfig, 
  benchmarks: CategoryBenchmarks
): ThresholdConfig {
  // Start with fallback thresholds
  const thresholds = JSON.parse(JSON.stringify(fallbackThresholds)) as ThresholdConfig;
  
  // Update thresholds based on benchmarks
  thresholds.title.minLength = benchmarks.content.titleLength.min;
  thresholds.title.maxLength = benchmarks.content.titleLength.max;
  
  thresholds.shortDesc.minLength = benchmarks.content.shortDescLength.min;
  thresholds.shortDesc.maxLength = benchmarks.content.shortDescLength.max;
  
  // Note: longDesc only has minWords in ThresholdConfig
  // thresholds.longDesc.minLength = benchmarks.content.longDescLength.min;
  
  thresholds.rating.minimum = benchmarks.rating.minimum;
  thresholds.reviews.minimum = benchmarks.reviews.minimum;
  
  thresholds.freshness.maxDays = benchmarks.freshness.maxDaysOld;
  
  return thresholds;
}

/**
 * Analyze weight importance from exemplar data
 * @param exemplars - Category exemplars
 * @returns Weight importance analysis
 */
function analyzeWeightImportance(exemplars: any[]): WeightImportance {
  // Analyze correlation between different factors and quality scores
  const qualityScores = exemplars.map(e => e.qualityScore || 0);
  
  // Calculate correlations (simplified analysis)
  const mediaScores = exemplars.map(e => (e.images_count || 0) + (e.videos_count || 0) * 2);
  const trustScores = exemplars.map(e => {
    const ratingData = calculateDetailedRating(e.rating || []);
    return ratingData.averageRating * Math.log(1 + (e.reviews_count || 0));
  });
  
  const contentScores = exemplars.map(e => {
    const titleLen = (e.title || '').length;
    const descLen = (e.long_description || '').length;
    const tagCount = (e.tags || []).length;
    return titleLen + descLen / 10 + tagCount * 5;
  });
  
  // Simple correlation analysis (would be more sophisticated in practice)
  const mediaCorr = correlation(mediaScores, qualityScores);
  const trustCorr = correlation(trustScores, qualityScores);
  const contentCorr = correlation(contentScores, qualityScores);
  
  // Normalize to percentages
  const total = Math.abs(mediaCorr) + Math.abs(trustCorr) + Math.abs(contentCorr);
  
  return {
    content: Math.round((Math.abs(contentCorr) / total) * 40) || 35, // 35-40% baseline
    media: Math.round((Math.abs(mediaCorr) / total) * 30) || 25,   // 20-30% baseline
    trust: Math.round((Math.abs(trustCorr) / total) * 20) || 20,   // 15-20% baseline
    findability: 15, // Fixed for now
    performance: 10, // Fixed for now
    contentBreakdown: {
      title: 30,
      shortDesc: 25,
      longDesc: 25,
      tags: 15,
      structure: 5
    },
    mediaBreakdown: {
      images: 60,
      videos: 35,
      quality: 5
    }
  };
}

/**
 * Calculate rule confidence based on sample size and data quality
 * @param exemplars - Category exemplars
 * @param benchmarks - Category benchmarks
 * @returns Rule confidence
 */
function calculateRuleConfidence(exemplars: any[], benchmarks: CategoryBenchmarks): RuleConfidence {
  const sampleSize = exemplars.length;
  let dataQuality = 50; // Base score
  
  // Assess data quality factors
  const hasRatings = exemplars.filter(e => e.rating && Array.isArray(e.rating) && e.rating.length > 0).length;
  const hasReviews = exemplars.filter(e => (e.reviews_count || 0) > 0).length;
  const hasMedia = exemplars.filter(e => (e.images_count || 0) > 0).length;
  const hasContent = exemplars.filter(e => e.long_description && e.long_description.length > 100).length;
  
  dataQuality += (hasRatings / sampleSize) * 20;
  dataQuality += (hasReviews / sampleSize) * 15;
  dataQuality += (hasMedia / sampleSize) * 10;
  dataQuality += (hasContent / sampleSize) * 5;
  
  // Determine confidence level
  let level: 'high' | 'medium' | 'low';
  let explanation: string;
  
  if (sampleSize >= 30 && dataQuality >= 80) {
    level = 'high';
    explanation = `High confidence: ${sampleSize} exemplars with excellent data quality (${dataQuality.toFixed(1)}%)`;
  } else if (sampleSize >= 15 && dataQuality >= 60) {
    level = 'medium';
    explanation = `Medium confidence: ${sampleSize} exemplars with good data quality (${dataQuality.toFixed(1)}%)`;
  } else {
    level = 'low';
    explanation = `Low confidence: ${sampleSize} exemplars with limited data quality (${dataQuality.toFixed(1)}%)`;
  }
  
  return {
    level,
    sampleSize,
    dataQuality: Math.round(dataQuality),
    explanation
  };
}

/**
 * Extract common failure and success patterns
 * @param exemplars - Category exemplars
 * @returns Pattern analysis
 */
function extractPatterns(exemplars: any[]): { commonFailures: string[]; successPatterns: string[] } {
  const successPatterns: string[] = [];
  const commonFailures: string[] = [];
  
  // Analyze successful patterns
  const topExemplars = exemplars
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, Math.ceil(exemplars.length * 0.2)); // Top 20%
  
  const avgTopImages = topExemplars.reduce((sum, e) => sum + (e.images_count || 0), 0) / topExemplars.length;
  const avgTopRating = topExemplars.reduce((sum, e) => {
    const ratingData = calculateDetailedRating(e.rating || []);
    return sum + ratingData.averageRating;
  }, 0) / topExemplars.length;
  
  if (avgTopImages >= 6) {
    successPatterns.push(`High-performing assets typically have ${Math.round(avgTopImages)}+ screenshots`);
  }
  
  if (avgTopRating >= 4.5) {
    successPatterns.push(`Top assets maintain ratings above ${avgTopRating.toFixed(1)}/5.0`);
  }
  
  const videoRatio = topExemplars.filter(e => (e.videos_count || 0) > 0).length / topExemplars.length;
  if (videoRatio > 0.7) {
    successPatterns.push(`${Math.round(videoRatio * 100)}% of top assets include video demonstrations`);
  }
  
  // Analyze failure patterns (would require negative examples in practice)
  commonFailures.push('Insufficient visual demonstrations (< 3 screenshots)');
  commonFailures.push('Outdated assets (> 2 years without updates)');
  commonFailures.push('Poor rating quality (< 3.5/5.0 or controversial ratings)');
  
  return { commonFailures, successPatterns };
}

/**
 * Calculate percentile value
 * @param values - Array of numbers
 * @param percentile - Percentile (0-100)
 * @returns Percentile value
 */
function percentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sorted[lower] || 0;
  }
  
  const weight = index - lower;
  const lowerVal = sorted[lower] || 0;
  const upperVal = sorted[upper] || 0;
  return lowerVal * (1 - weight) + upperVal * weight;
}

/**
 * Calculate correlation coefficient between two arrays
 * @param x - First array
 * @param y - Second array
 * @returns Correlation coefficient
 */
function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const xVal = x[i];
    const yVal = y[i];
    if (xVal !== undefined && yVal !== undefined) {
      const deltaX = xVal - meanX;
      const deltaY = yVal - meanY;
      numerator += deltaX * deltaY;
      denomX += deltaX * deltaX;
      denomY += deltaY * deltaY;
    }
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}