/**
 * Rating Analysis Utilities
 * Advanced analysis of Unity Asset Store rating distributions
 */

import { AssetRating } from '../types.js';
import { Logger } from './logger.js';

const logger = new Logger('rating-analysis');

/**
 * Detailed rating analysis result
 */
export interface DetailedRatingResult {
  /** Weighted average rating (0-5) */
  averageRating: number;
  /** Total number of ratings */
  totalRatings: number;
  /** Rating quality score (0-100) based on distribution */
  ratingQuality: number;
  /** Rating distribution by star value */
  distribution: RatingDistribution[];
  /** Rating consistency indicators */
  consistency: RatingConsistency;
}

/**
 * Rating distribution for a specific star value
 */
export interface RatingDistribution {
  /** Star value (1-5) */
  stars: number;
  /** Number of ratings for this star value */
  count: number;
  /** Percentage of total ratings */
  percentage: number;
}

/**
 * Rating consistency analysis
 */
export interface RatingConsistency {
  /** Percentage of ratings that are 4+ stars */
  positivePercentage: number;
  /** Percentage of ratings that are 5 stars */
  excellentPercentage: number;
  /** Percentage of ratings that are 1-2 stars */
  negativePercentage: number;
  /** Whether the rating distribution suggests controversy */
  isControversial: boolean;
  /** Polarization score (0-100, higher = more polarized) */
  polarizationScore: number;
}

/**
 * Calculate detailed rating analysis from AssetRating array
 * @param ratingArray - Array of rating data from Unity Asset Store
 * @returns Detailed rating analysis
 */
export function calculateDetailedRating(ratingArray: AssetRating[]): DetailedRatingResult {
  // Handle edge cases
  if (!Array.isArray(ratingArray) || ratingArray.length === 0) {
    logger.debug('Empty or invalid rating array provided');
    return createEmptyRatingResult();
  }

  let totalRatings = 0;
  let weightedSum = 0;
  const distribution: RatingDistribution[] = [];

  // Process each rating entry
  for (const rating of ratingArray) {
    try {
      const count = parseInt(rating.count) || 0;
      const value = parseInt(rating.value) || 0;

      // Validate star value is in expected range
      if (value < 1 || value > 5) {
        logger.warn(`Invalid star value: ${value}, skipping`);
        continue;
      }

      totalRatings += count;
      weightedSum += count * value;

      distribution.push({
        stars: value,
        count: count,
        percentage: 0 // Will be calculated after we know total
      });
    } catch (error) {
      logger.warn(`Error processing rating entry: ${JSON.stringify(rating)}`, error);
      continue;
    }
  }

  // Handle case where no valid ratings were found
  if (totalRatings === 0) {
    logger.debug('No valid ratings found in array');
    return createEmptyRatingResult();
  }

  // Calculate percentages
  distribution.forEach(d => {
    d.percentage = (d.count / totalRatings) * 100;
  });

  // Sort distribution by star value for consistency
  distribution.sort((a, b) => a.stars - b.stars);

  // Calculate weighted average
  const averageRating = weightedSum / totalRatings;

  // Calculate consistency metrics
  const consistency = calculateRatingConsistency(distribution, totalRatings);

  // Calculate overall rating quality score
  const ratingQuality = calculateRatingQuality(distribution, totalRatings, averageRating, consistency);

  const result: DetailedRatingResult = {
    averageRating,
    totalRatings,
    ratingQuality,
    distribution,
    consistency
  };

  logger.debug('Rating analysis completed', {
    averageRating: averageRating.toFixed(2),
    totalRatings,
    ratingQuality: ratingQuality.toFixed(1),
    positivePercentage: consistency.positivePercentage.toFixed(1)
  });

  return result;
}

/**
 * Calculate rating quality score based on distribution analysis
 * @param distribution - Rating distribution
 * @param totalRatings - Total number of ratings
 * @param averageRating - Weighted average rating
 * @param consistency - Consistency analysis
 * @returns Quality score (0-100)
 */
export function calculateRatingQuality(
  distribution: RatingDistribution[],
  totalRatings: number,
  averageRating: number,
  consistency: RatingConsistency
): number {
  if (totalRatings === 0) return 0;

  let qualityScore = 0;

  // Base score from average rating (0-50 points)
  qualityScore += (averageRating / 5) * 50;

  // Bonus for high percentage of excellent ratings (0-25 points)
  qualityScore += (consistency.excellentPercentage / 100) * 25;

  // Bonus for overall positive sentiment (0-15 points)
  qualityScore += (consistency.positivePercentage / 100) * 15;

  // Penalty for high negative ratings (0-20 points reduction)
  qualityScore -= (consistency.negativePercentage / 100) * 20;

  // Penalty for controversial/polarized ratings (0-15 points reduction)
  if (consistency.isControversial) {
    qualityScore -= (consistency.polarizationScore / 100) * 15;
  }

  // Volume bonus for statistically significant sample sizes
  if (totalRatings >= 50) {
    qualityScore += 5; // Small bonus for sufficient volume
  }
  if (totalRatings >= 200) {
    qualityScore += 5; // Additional bonus for high volume
  }

  // Ensure score is within bounds
  return Math.max(0, Math.min(100, qualityScore));
}

/**
 * Calculate rating consistency metrics
 * @param distribution - Rating distribution
 * @param totalRatings - Total number of ratings
 * @returns Consistency analysis
 */
function calculateRatingConsistency(
  distribution: RatingDistribution[],
  totalRatings: number
): RatingConsistency {
  if (totalRatings === 0) {
    return {
      positivePercentage: 0,
      excellentPercentage: 0,
      negativePercentage: 0,
      isControversial: false,
      polarizationScore: 0
    };
  }

  // Calculate key percentages
  const excellentPercentage = distribution.find(d => d.stars === 5)?.percentage || 0;
  const goodPercentage = distribution.find(d => d.stars === 4)?.percentage || 0;
  const positivePercentage = excellentPercentage + goodPercentage;
  
  const poorPercentage = distribution.find(d => d.stars === 2)?.percentage || 0;
  const terriblePercentage = distribution.find(d => d.stars === 1)?.percentage || 0;
  const negativePercentage = poorPercentage + terriblePercentage;

  // Detect controversial patterns
  // High polarization: lots of 5-star AND lots of 1-star with little middle ground
  const polarizationScore = calculatePolarizationScore(distribution);
  const isControversial = polarizationScore > 40 && totalRatings >= 20;

  return {
    positivePercentage,
    excellentPercentage,
    negativePercentage,
    isControversial,
    polarizationScore
  };
}

/**
 * Calculate polarization score (0-100)
 * Higher scores indicate more polarized ratings (bimodal distribution)
 */
function calculatePolarizationScore(distribution: RatingDistribution[]): number {
  if (distribution.length === 0) return 0;

  const fiveStarPct = distribution.find(d => d.stars === 5)?.percentage || 0;
  const oneStarPct = distribution.find(d => d.stars === 1)?.percentage || 0;
  const middlePct = distribution.filter(d => d.stars >= 2 && d.stars <= 4)
    .reduce((sum, d) => sum + d.percentage, 0);

  // High polarization = high extremes + low middle
  const extremesTotal = fiveStarPct + oneStarPct;
  const polarization = extremesTotal > 60 && middlePct < 30 ? 
    extremesTotal - middlePct : 
    0;

  return Math.max(0, Math.min(100, polarization));
}

/**
 * Create empty rating result for edge cases
 */
function createEmptyRatingResult(): DetailedRatingResult {
  return {
    averageRating: 0,
    totalRatings: 0,
    ratingQuality: 0,
    distribution: [],
    consistency: {
      positivePercentage: 0,
      excellentPercentage: 0,
      negativePercentage: 0,
      isControversial: false,
      polarizationScore: 0
    }
  };
}

/**
 * Convert legacy single rating value to DetailedRatingResult
 * @param legacyRating - Single numeric rating value
 * @returns Minimal DetailedRatingResult for backward compatibility
 */
export function convertLegacyRating(legacyRating: number): DetailedRatingResult {
  if (!legacyRating || legacyRating <= 0) {
    return createEmptyRatingResult();
  }

  // Create synthetic distribution assuming this is an average
  const syntheticDistribution: RatingDistribution[] = [
    { stars: 5, count: Math.round(legacyRating >= 4.5 ? 80 : 20), percentage: 0 },
    { stars: 4, count: Math.round(legacyRating >= 4 ? 15 : 30), percentage: 0 },
    { stars: 3, count: Math.round(legacyRating >= 3 ? 5 : 30), percentage: 0 },
    { stars: 2, count: Math.round(legacyRating >= 2 ? 0 : 15), percentage: 0 },
    { stars: 1, count: Math.round(legacyRating < 2 ? 50 : 5), percentage: 0 }
  ];

  const totalRatings = syntheticDistribution.reduce((sum, d) => sum + d.count, 0);
  syntheticDistribution.forEach(d => {
    d.percentage = (d.count / totalRatings) * 100;
  });

  const consistency = calculateRatingConsistency(syntheticDistribution, totalRatings);
  const ratingQuality = calculateRatingQuality(syntheticDistribution, totalRatings, legacyRating, consistency);

  return {
    averageRating: legacyRating,
    totalRatings,
    ratingQuality,
    distribution: syntheticDistribution,
    consistency
  };
}

/**
 * Helper function to extract simple average rating for backward compatibility
 * @param ratingArray - Array of rating data or legacy single value
 * @returns Simple average rating number
 */
export function extractSimpleRating(ratingArray: AssetRating[] | number | undefined): number {
  if (typeof ratingArray === 'number') {
    return ratingArray;
  }

  if (!Array.isArray(ratingArray)) {
    return 0;
  }

  const detailed = calculateDetailedRating(ratingArray);
  return detailed.averageRating;
}