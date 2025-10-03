/**
 * Asset Grading Module
 * Provides heuristic scoring and evaluation for Unity Asset Store listings
 */

import { daysBetween, clamp, zscore, jaccard, tokenize } from './utils/utils.mjs';
import { Logger } from './utils/logger.mjs';
import { AssetValidator } from './utils/validation.mjs';
import { VocabularyBuilder } from './vocabulary.mjs';

const logger = new Logger('grader');

/**
 * Asset grading and scoring engine
 */
export class AssetGrader {
  constructor(config) {
    this.config = config;
    this.weights = config.weights;
    this.thresholds = config.thresholds;
    this.logger = logger.child('scorer');
  }

  /**
   * Grades a Unity Asset Store listing using heuristic scoring
   * Evaluates content quality, media presence, trust signals, discoverability, and performance
   * 
   * @param {Object} asset - Asset data (title, descriptions, tags, stats, etc.)
   * @param {Object} vocab - Category vocabulary and statistics from buildVocabAndMedians()
   * @returns {Object} Grade with score (0-100), letter grade (A-F), and detailed reasons
   */
  async gradeAsset(asset, vocab) {
    return this.logger.time('gradeAsset', async () => {
      // Validate input
      AssetValidator.validateAsset(asset);

      // Get appropriate vocabulary for this asset's category
      const categoryVocab = VocabularyBuilder.getVocabularyForCategory(vocab, asset.category);
      
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
  prepareContent(asset) {
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
  scoreContent(content, vocab) {
    const score = { score: 0, reasons: [] };
    const w = this.weights.content;

    // Title length scoring
    const idealTitleMin = Math.max(
      this.thresholds.title.minLength,
      vocab.title_length.median - vocab.title_length.std
    );
    const idealTitleMax = Math.min(
      this.thresholds.title.maxLength,
      vocab.title_length.median + vocab.title_length.std
    );
    
    const titleOK = content.title.length >= idealTitleMin && 
                   content.title.length <= idealTitleMax;
    
    if (titleOK) {
      score.score += w.title;
    } else {
      score.reasons.push(
        `Title not in ${Math.round(idealTitleMin)}–${Math.round(idealTitleMax)} chars ` +
        `(category median: ${Math.round(vocab.title_length.median)}) - currently ${content.title.length} chars`
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
      Math.round(vocab.word_count_long.median - vocab.word_count_long.std)
    );
    
    const longOK = content.wordCount >= minWords;
    if (longOK) {
      score.score += w.long;
    } else {
      score.reasons.push(
        `Long description under ${minWords} words ` +
        `(category median: ${Math.round(vocab.word_count_long.median)}) - only ${content.wordCount} words`
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
  scoreMedia(asset) {
    const score = { score: 0, reasons: [] };
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
  scoreTrust(asset) {
    const score = { score: 0, reasons: [] };
    const w = this.weights.trust;

    // Rating
    const ratingOK = (asset.rating || 0) >= this.thresholds.rating.minimum;
    if (ratingOK) {
      score.score += w.rating;
    } else {
      score.reasons.push(`Rating below ${this.thresholds.rating.minimum} - currently ${asset.rating || 0}`);
    }

    // Reviews
    const reviewsOK = (asset.reviews_count || 0) >= this.thresholds.reviews.minimum;
    if (reviewsOK) {
      score.score += w.reviews;
    } else {
      score.reasons.push(`Fewer than ${this.thresholds.reviews.minimum} reviews - currently ${asset.reviews_count || 0}`);
    }

    // Freshness
    const days = daysBetween(asset.last_update);
    const freshOK = days != null && days <= this.thresholds.freshness.maxDays;
    if (freshOK) {
      score.score += w.freshness;
    } else {
      score.reasons.push(
        `Update older than ${this.thresholds.freshness.maxDays} days${days != null ? ` - ${days} days ago` : ''}`
      );
    }

    return score;
  }

  /**
   * Score findability and SEO factors
   */
  scoreFindability(asset, vocab) {
    const score = { score: 0, reasons: [] };
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
  scorePerformance(asset) {
    const score = { score: 0, reasons: [] };
    const w = this.weights.perf;

    if (asset.stats && typeof asset.stats.conversion === 'number') {
      const cvr = asset.stats.conversion;
      const medianCVR = 0.004; // Typical median conversion rate
      const ratio = cvr / medianCVR;
      
      // Scale conversion rate performance
      const cvrScore = clamp((ratio - 0.5) / 0.5 * w.cvr, 0, w.cvr);
      score.score += cvrScore;

      // Penalty for high views but low conversion
      if (asset.stats.pageviews > 1000 && cvr < medianCVR * 0.5) {
        score.score -= w.hv_lc_penalty;
        score.reasons.push('High views but low conversion');
      }
    }

    return score;
  }

  /**
   * Calculate letter grade from numeric score
   */
  calculateLetterGrade(score) {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Get maximum possible score
   */
  getMaxScore() {
    const w = this.weights;
    return Object.values(w.content).reduce((a, b) => a + b, 0) +
           Object.values(w.media).reduce((a, b) => a + b, 0) +
           Object.values(w.trust).reduce((a, b) => a + b, 0) +
           Object.values(w.find).reduce((a, b) => a + b, 0) +
           Object.values(w.perf).reduce((a, b) => a + b, 0);
  }
}

export default AssetGrader;