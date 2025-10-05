/**
 * Asset Grading Module
 * Provides heuristic scoring and evaluation for Unity Asset Store listings
 */

import { daysBetween, clamp, zscore, jaccard, tokenize } from './utils/utils';
import { Logger } from './utils/logger';
import { AssetValidator, Asset } from './utils/validation';
import { CategoryVocabulary, GraderConfig, GradeResult, PreparedContent, ScoreResult, ThresholdConfig, Vocabulary, WeightConfig } from './types';
import { calculateDetailedRating, DetailedRatingResult } from './utils/rating-analysis';
// Note: VocabularyBuilder is imported from the .mjs file for now

const logger = new Logger('grader');

/**
 * Asset grading and scoring engine
 */
export class AssetGrader {
  private config: GraderConfig;
  private weights: WeightConfig;
  private thresholds: ThresholdConfig;
  private logger: Logger;

  constructor(config: GraderConfig) {
    this.config = config;
    this.weights = config.weights;
    this.thresholds = config.thresholds;
    this.logger = logger.child('scorer');
  }

  /**
   * Grades a Unity Asset Store listing using heuristic scoring
   * Evaluates content quality, media presence, trust signals, discoverability, and performance
   * 
   * @param asset - Asset data (title, descriptions, tags, stats, etc.)
   * @param vocab - Category vocabulary and statistics from buildVocabAndMedians()
   * @returns Grade with score (0-100), letter grade (A-F), and detailed reasons
   */
  async gradeAsset(asset: Asset, vocab: Vocabulary): Promise<GradeResult> {
    return this.logger.time('gradeAsset', async () => {
      // Validate input
      AssetValidator.validateAsset(asset);

      // Get appropriate vocabulary for this asset's category
      const categoryVocab = this.getVocabularyForCategory(vocab, asset.category);
      
      this.logger.debug('Grading asset', {
        title: asset.title,
        category: asset.category,
        hasVocab: !!vocab,
        vocabCategory: asset.category && vocab?.[asset.category] ? asset.category : 'fallback'
      });

      // Prepare text content for analysis
      const content = this.prepareContent(asset);
      
      // Score each dimension
      const contentScore = this.scoreContent(content, categoryVocab);
      const mediaScore = this.scoreMedia(asset);
      const trustScore = this.scoreTrust(asset);
      const findabilityScore = this.scoreFindability(asset, categoryVocab);
      const performanceScore = this.scorePerformance(asset);

      // Combine scores and generate grade
      const totalScore = contentScore.score + mediaScore.score + trustScore.score + 
                        findabilityScore.score + performanceScore.score;
      
      const letterGrade = this.calculateLetterGrade(totalScore);
      const allReasons = [
        ...contentScore.reasons,
        ...mediaScore.reasons,
        ...trustScore.reasons,
        ...findabilityScore.reasons,
        ...performanceScore.reasons
      ];

      const result = {
        score: Math.round(totalScore),
        letter: letterGrade,
        reasons: allReasons,
        breakdown: {
          content: contentScore.score,
          media: mediaScore.score,
          trust: trustScore.score,
          findability: findabilityScore.score,
          performance: performanceScore.score
        }
      };

      this.logger.info('Asset graded', {
        title: asset.title,
        score: result.score,
        letter: result.letter,
        issueCount: allReasons.length
      });

      return result;
    });
  }

  /**
   * Prepare and clean content for analysis
   */
  prepareContent(asset: Asset): PreparedContent {
    const title = String(asset.title || '');
    const shortDesc = String(asset.short_description || '');
    const longDesc = String(asset.long_description || '');
    const description = longDesc || shortDesc;
    
    return {
      title,
      shortDesc,
      longDesc,
      description,
      short: shortDesc.slice(0, 180),
      bullets: (description.match(/\n[-•*]/g) || []).length,
      hasCTA: /buy|get|download|try|start|upgrade|pro|support|docs|click/i.test(description),
      hasUVP: /for|use|build|create|template|tool|optimi[sz]e/i.test(
        description.replace(/\s+/g, ' ').slice(0, 50)
      ),
      wordCount: description.replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0).length
    };
  }

  /**
   * Score content quality (titles, descriptions, structure, messaging)
   */
  scoreContent(content: PreparedContent, vocab: CategoryVocabulary): ScoreResult {
    const score: ScoreResult = { score: 0, reasons: [] };
    const w = this.weights.content;

    // Title length scoring
    const idealTitleMin = Math.max(
      this.thresholds.title.minLength,
      (vocab.title_length.median ?? 60) - (vocab.title_length.std ?? 15)
    );
    const idealTitleMax = Math.min(
      this.thresholds.title.maxLength,
      (vocab.title_length.median ?? 60) + (vocab.title_length.std ?? 15)
    );
    
    const titleOK = content.title.length >= idealTitleMin && 
                   content.title.length <= idealTitleMax;
    
    if (titleOK) {
      score.score += w.title;
    } else {
      score.reasons.push(
        `Title not in ${Math.round(idealTitleMin)}–${Math.round(idealTitleMax)} chars ` +
        `(category median: ${Math.round(vocab.title_length.median ?? 60)}) - currently ${content.title.length} chars`
      );
    }

    // Short description scoring
    const shortOK = content.short.length >= this.thresholds.shortDesc.minLength && 
                   content.short.length <= this.thresholds.shortDesc.maxLength;
    
    if (shortOK) {
      score.score += w.short;
    } else {
      score.reasons.push(
        `Short description not ${this.thresholds.shortDesc.minLength}–${this.thresholds.shortDesc.maxLength} chars - ` +
        `currently ${content.short.length} chars`
      );
    }

    // Long description word count
    const minWords = Math.max(
      this.thresholds.longDesc.minWords,
      Math.round((vocab.word_count_long.median ?? 300) - (vocab.word_count_long.std ?? 100))
    );
    
    const longOK = content.wordCount >= minWords;
    if (longOK) {
      score.score += w.long;
    } else {
      score.reasons.push(
        `Long description under ${minWords} words ` +
        `(category median: ${Math.round(vocab.word_count_long.median ?? 300)}) - only ${content.wordCount} words`
      );
    }

    // Bullet points
    const bulletsOK = content.bullets >= this.thresholds.bullets.minimum;
    if (bulletsOK) {
      score.score += w.bullets;
    } else {
      score.reasons.push(`Fewer than ${this.thresholds.bullets.minimum} bullet points - only ${content.bullets} found`);
    }

    // Call to action
    if (content.hasCTA) {
      score.score += w.cta;
    } else {
      score.reasons.push('No clear CTA');
    }

    // Value proposition
    if (content.hasUVP) {
      score.score += w.uvp;
    } else {
      score.reasons.push('Weak UVP in opening');
    }

    return score;
  }

  /**
   * Score media presence and quality
   */
  scoreMedia(asset: Asset): ScoreResult {
    const score: ScoreResult = { score: 0, reasons: [] };
    const w = this.weights.media;

    // Images
    const imgOK = (asset.images_count || 0) >= this.thresholds.images.minimum;
    if (imgOK) {
      score.score += w.images;
    } else {
      score.reasons.push(`Add ≥${this.thresholds.images.minimum} images - currently ${asset.images_count || 0}`);
    }

    // Videos
    const vidOK = (asset.videos_count || 0) >= this.thresholds.videos.minimum;
    if (vidOK) {
      score.score += w.video;
    } else {
      score.reasons.push(`Add ≥${this.thresholds.videos.minimum} video - currently ${asset.videos_count || 0}`);
    }

    // GIF/Demo (bonus points if videos exist)
    if (vidOK) {
      score.score += w.gif;
    } else {
      score.reasons.push('Consider a short GIF/demo');
    }

    return score;
  }

  /**
   * Score trust signals (ratings, reviews, freshness)
   */
  /**
   * Score trust signals with enhanced rating analysis
   * Evaluates rating quality, review volume, and content freshness
   */
  scoreTrust(asset: Asset): ScoreResult {
    const score: ScoreResult = { score: 0, reasons: [] };
    const w = this.weights.trust;

    // Enhanced Rating Analysis
    // Handle both AssetRating[] and legacy number formats
    let ratingData: DetailedRatingResult;
    if (Array.isArray(asset.rating)) {
      ratingData = calculateDetailedRating(asset.rating);
    } else if (typeof asset.rating === 'number') {
      // Legacy format - create synthetic rating data
      ratingData = {
        averageRating: asset.rating,
        totalRatings: asset.reviews_count || 0,
        ratingQuality: asset.rating >= 4 ? 70 : asset.rating >= 3 ? 50 : 30,
        distribution: [],
        consistency: {
          positivePercentage: asset.rating >= 4 ? 80 : 50,
          excellentPercentage: asset.rating >= 4.5 ? 70 : 30,
          negativePercentage: asset.rating < 3 ? 30 : 10,
          isControversial: false,
          polarizationScore: 0
        }
      };
    } else {
      // No rating data available
      ratingData = calculateDetailedRating([]);
    }
    
    // Rating scoring with quality considerations
    const minRating = this.thresholds.rating.minimum;
    if (ratingData.averageRating >= minRating) {
      let ratingScore = w.rating;
      
      // Quality bonuses
      if (ratingData.ratingQuality > 80) {
        ratingScore += Math.round(w.rating * 0.5); // 50% bonus for excellent quality
        score.reasons.push(`Excellent rating quality (${ratingData.ratingQuality.toFixed(1)}/100) +${Math.round(w.rating * 0.5)} bonus`);
      } else if (ratingData.ratingQuality > 60) {
        ratingScore += Math.round(w.rating * 0.2); // 20% bonus for good quality
        score.reasons.push(`Good rating quality (${ratingData.ratingQuality.toFixed(1)}/100) +${Math.round(w.rating * 0.2)} bonus`);
      }
      
      // Consistency bonuses
      if (ratingData.consistency.excellentPercentage > 70) {
        ratingScore += 1;
        score.reasons.push(`${ratingData.consistency.excellentPercentage.toFixed(1)}% excellent ratings +1 bonus`);
      }
      
      // Volume + quality combo bonus
      if (ratingData.totalRatings >= 50 && ratingData.averageRating >= 4.5) {
        ratingScore += 2;
        score.reasons.push(`High-volume excellent ratings (${ratingData.totalRatings} ratings, ${ratingData.averageRating.toFixed(2)} avg) +2 bonus`);
      }
      
      score.score += ratingScore;
    } else {
      // Quality penalties
      let penalty = 0;
      if (ratingData.consistency.isControversial) {
        penalty += 2;
        score.reasons.push(`Controversial rating pattern (polarization: ${ratingData.consistency.polarizationScore.toFixed(1)}) -2 penalty`);
      }
      
      if (ratingData.consistency.negativePercentage > 20) {
        penalty += 1;
        score.reasons.push(`High negative sentiment (${ratingData.consistency.negativePercentage.toFixed(1)}% negative) -1 penalty`);
      }
      
      score.reasons.push(`Rating below ${minRating} - currently ${ratingData.averageRating.toFixed(2)} (${ratingData.totalRatings} ratings)${penalty > 0 ? ` with -${penalty} quality penalties` : ''}`);
    }

    // Reviews with enhanced volume assessment
    const minReviews = this.thresholds.reviews.minimum;
    const reviewsCount = asset.reviews_count || 0;
    
    if (reviewsCount >= minReviews) {
      let reviewScore = w.reviews;
      
      // Volume bonuses
      if (reviewsCount >= 100) {
        reviewScore += 2; // Significant review volume
        score.reasons.push(`High review volume (${reviewsCount} reviews) +2 bonus`);
      } else if (reviewsCount >= 50) {
        reviewScore += 1; // Good review volume
        score.reasons.push(`Good review volume (${reviewsCount} reviews) +1 bonus`);
      }
      
      // Rating-review alignment bonus
      if (ratingData.totalRatings >= reviewsCount * 0.8) {
        reviewScore += 1; // Ratings align with reviews (engagement)
        score.reasons.push(`High rating engagement (${ratingData.totalRatings} ratings vs ${reviewsCount} reviews) +1 bonus`);
      }
      
      score.score += reviewScore;
    } else {
      score.reasons.push(`Fewer than ${minReviews} reviews - currently ${reviewsCount}`);
    }

    // Freshness (unchanged)
    const days = daysBetween(asset.last_update);
    const freshOK = days != null && days <= this.thresholds.freshness.maxDays;
    if (freshOK) {
      score.score += w.freshness;
    } else {
      score.reasons.push(
        `Update older than ${this.thresholds.freshness.maxDays} days${days != null ? ` - ${days} days ago` : ''}`
      );
    }

    // Log detailed trust scoring for debugging
    this.logger.debug('Trust score calculated', {
      title: asset.title?.substring(0, 50),
      trustScore: score.score,
      averageRating: ratingData.averageRating.toFixed(2),
      ratingQuality: ratingData.ratingQuality.toFixed(1),
      totalRatings: ratingData.totalRatings,
      reviewsCount: reviewsCount,
      isControversial: ratingData.consistency.isControversial
    });

    return score;
  }

  /**
   * Score findability and SEO factors
   */
  scoreFindability(asset: Asset, vocab: CategoryVocabulary): ScoreResult {
    const score: ScoreResult = { score: 0, reasons: [] };
    const w = this.weights.find;

    // Title keywords
    const titleTokens = new Set(tokenize(asset.title).uni);
    const topTitleKw = (vocab.top_unigrams || []).slice(0, 30).map(x => x.t);
    const titleOverlap = topTitleKw.filter(t => titleTokens.has(t)).length;
    const titleKWOK = titleOverlap >= 2;
    
    if (titleKWOK) {
      score.score += w.titlekw;
    } else {
      score.reasons.push(`Add ≥2 category keywords in title - currently ${titleOverlap}`);
    }

    // Tag coverage
    const assetTags = (asset.tags || []).map(x => String(x).toLowerCase());
    const topTags = (vocab.top_tags || []).slice(0, 30).map(x => x.t);
    const tagCoverage = jaccard(assetTags, topTags);
    const tagCoverageOK = tagCoverage >= 0.35;
    
    if (tagCoverageOK) {
      score.score += w.tagcov;
    } else {
      score.reasons.push(`Increase tag coverage vs category - currently ${Math.round(tagCoverage * 100)}%`);
    }

    // Price outlier detection
    if (vocab.price_mean != null && vocab.price_std != null && asset.price != null) {
      const priceZ = Math.abs(zscore(asset.price, vocab.price_mean, vocab.price_std));
      const priceOK = priceZ <= 1.5;
      
      if (priceOK) {
        score.score += w.pricez;
      } else {
        score.reasons.push(`Price is an outlier in category - ${priceZ.toFixed(1)} std devs from mean`);
      }
    }

    return score;
  }

  /**
   * Score performance metrics (if available)
   */
  scorePerformance(asset: Asset): ScoreResult {
    const score: ScoreResult = { score: 0, reasons: [] };
    const w = this.weights.perf;

    if (asset.stats && typeof asset.stats.conversion === 'number') {
      const cvr = asset.stats.conversion;
      const medianCVR = 0.004; // Typical median conversion rate
      const ratio = cvr / medianCVR;
      
      // Scale conversion rate performance
      const cvrScore = clamp((ratio - 0.5) / 0.5 * w.cvr, 0, w.cvr);
      score.score += cvrScore;

      // Penalty for high views but low conversion
      if (asset.stats.pageviews && asset.stats.pageviews > 1000 && cvr < medianCVR * 0.5) {
        score.score -= w.hv_lc_penalty;
        score.reasons.push('High views but low conversion');
      }
    }

    return score;
  }

  /**
   * Calculate letter grade from numeric score
   */
  calculateLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Get maximum possible score
   */
  getMaxScore(): number {
    const w = this.weights;
    return Object.values(w.content).reduce((a, b) => a + b, 0) +
           Object.values(w.media).reduce((a, b) => a + b, 0) +
           Object.values(w.trust).reduce((a, b) => a + b, 0) +
           Object.values(w.find).reduce((a, b) => a + b, 0) +
           Object.values(w.perf).reduce((a, b) => a + b, 0);
  }

  /**
   * Get vocabulary for a specific category with fallback
   */
  private getVocabularyForCategory(vocab: Vocabulary, category?: string): CategoryVocabulary {
    if (!vocab || typeof vocab !== 'object') {
      return this.getDefaultVocabulary();
    }

    const vocabKeys = Object.keys(vocab);
    
    // Try exact category match first
    if (category && vocab[category]) {
      return vocab[category];
    }
    
    // Fallback to first available category
    if (vocabKeys.length > 0) {
      const firstKey = vocabKeys[0];
      if (firstKey && vocab[firstKey]) {
        return vocab[firstKey];
      }
    }
    
    // Ultimate fallback
    return this.getDefaultVocabulary();
  }

  /**
   * Get default vocabulary when none is available
   */
  private getDefaultVocabulary(): CategoryVocabulary {
    return {
      top_unigrams: [],
      top_bigrams: [],
      top_tags: [],
      med_images: 5,
      med_videos: 1,
      med_price: null,
      price_mean: null,
      price_std: null,
      title_length: { median: 60, mean: 60, std: 15 },
      short_desc_length: { median: 150, mean: 150, std: 30 },
      long_desc_length: { median: 400, mean: 400, std: 100 },
      word_count_short: { median: 25, mean: 25, std: 10 },
      word_count_long: { median: 300, mean: 350, std: 100 },
      tag_count: { median: 8, mean: 8, std: 3 },
      bullet_count: { median: 6, mean: 6 },
      sample_size: 0
    };
  }
}

export default AssetGrader;