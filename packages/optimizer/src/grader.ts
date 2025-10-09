/**
 * Asset Grading Module
 * Provides heuristic scoring and evaluation for Unity Asset Store listings
 */

import { daysBetween, clamp, zscore, jaccard, tokenize, countBullets, isStopWord } from './utils/utils';
import { Logger } from './utils/logger';
import { AssetValidator } from './utils/validation';
import { Asset, CategoryVocabulary, GraderConfig, GradeResult, LinkAnalysis, PreparedContent, ScoreResult, ThresholdConfig, Vocabulary, WeightConfig } from './types';
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
   * Evaluates content quality, media presence, trust signals, and discoverability
   * 
   * @param asset - Asset data (title, descriptions, tags, stats, etc.)
   * @param vocab - Category vocabulary and statistics from buildVocabAndMedians()
   * @returns Grade with normalized score (0-100), letter grade (A-F), and detailed reasons
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

      // Combine scores and generate grade
      const totalScore = contentScore.score + mediaScore.score + trustScore.score + 
                        findabilityScore.score;
      
      // Normalize score to 0-100 scale
      const maxScore = this.getMaxScore();
      const normalizedScore = (totalScore / maxScore) * 100;
      
      const letterGrade = this.calculateLetterGrade(totalScore);
      const allReasons = [
        ...contentScore.reasons,
        ...mediaScore.reasons,
        ...trustScore.reasons,
        ...findabilityScore.reasons
      ];

      const result = {
        score: Math.round(normalizedScore),
        letter: letterGrade,
        reasons: allReasons,
        breakdown: {
          content: contentScore.score,
          media: mediaScore.score,
          trust: trustScore.score,
          findability: findabilityScore.score
        },
        weights: {
          content: this.weights.content,
          media: this.weights.media,
          trust: this.weights.trust,
          find: this.weights.find
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
    
    // Analyze links separately from CTA
    const linkAnalysis = this.analyzeLinks(description);
    
    return {
      title,
      shortDesc,
      longDesc,
      description,
      short: shortDesc.slice(0, 180),
      bullets: countBullets(description),
      hasCTA: this.detectCTA(description),
      hasUVP: this.detectUVP(title, shortDesc, longDesc),
      wordCount: description.replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0).length,
      linkAnalysis // Add link analysis to prepared content
    };
  }

  /**
   * Detect Call-To-Action patterns in content
   * Enhanced based on analysis of high-quality Unity Asset Store listings
   */
  private detectCTA(description: string): boolean {
    if (!description) return false;
    
    // Primary CTA patterns (most common in high-quality assets)
    const primaryCTA = /\b(buy|get|download|try|start|upgrade|pro|support|docs|click|install|add|check|contact|discord|documentation)\b/i;
    
    // Engagement patterns
    const engagementPatterns = /\b(demo|preview|experience|watch|view|discover|explore|learn|read|tutorial|guide|manual)\b/i;
    
    // Action-oriented phrases (more specific to avoid false positives)
    const actionPhrases = /\b(click here|get started|try now|download now|buy now|learn more|find out|check out|see more|contact us|join us)\b/i;
    
    return primaryCTA.test(description) || engagementPatterns.test(description) || actionPhrases.test(description);
  }

  /**
   * Analyze links in content for quality and relevance
   * Returns object with link metrics and quality indicators
   */
  private analyzeLinks(description: string): {
    hasLinks: boolean;
    linkCount: number;
    hasQualityLinks: boolean;
    linkTypes: string[];
  } {
    if (!description) return { hasLinks: false, linkCount: 0, hasQualityLinks: false, linkTypes: [] };
    
    const linkTypes: string[] = [];
    let linkCount = 0;
    let hasQualityLinks = false;
    
    // Extract actual URLs using proper regex
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const urls: string[] = [...(description.match(urlPattern) || [])];
    linkCount += urls.length;
    
    // Extract HTML links with href attributes
    const htmlLinkPattern = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let htmlMatch;
    while ((htmlMatch = htmlLinkPattern.exec(description)) !== null) {
      if (htmlMatch[1]) {
        urls.push(htmlMatch[1]);
        linkCount++;
      }
    }
    
    // Analyze link quality and types
    urls.forEach(url => {
      const lowercaseUrl = url.toLowerCase();
      
      // High-value links that indicate strong community/support
      if (lowercaseUrl.includes('discord') || lowercaseUrl.includes('discord.gg') || lowercaseUrl.includes('discord.com')) {
        linkTypes.push('Discord');
        hasQualityLinks = true;
      } else if (lowercaseUrl.includes('github.com')) {
        linkTypes.push('GitHub');
        hasQualityLinks = true;
      } else if (lowercaseUrl.includes('documentation') || lowercaseUrl.includes('docs') || lowercaseUrl.includes('/docs/')) {
        linkTypes.push('Documentation');
        hasQualityLinks = true;
      } else if (lowercaseUrl.includes('tutorial') || lowercaseUrl.includes('guide') || lowercaseUrl.includes('wiki')) {
        linkTypes.push('Tutorial/Guide');
        hasQualityLinks = true;
      } else if (lowercaseUrl.includes('demo') || lowercaseUrl.includes('example') || lowercaseUrl.includes('sample')) {
        linkTypes.push('Demo/Example');
        hasQualityLinks = true;
      } else if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) {
        linkTypes.push('YouTube');
        hasQualityLinks = true;
      } else if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('instagram.com')) {
        linkTypes.push('Social Media');
      } else if (lowercaseUrl.includes('store') || lowercaseUrl.includes('shop') || lowercaseUrl.includes('buy')) {
        linkTypes.push('Store/Purchase');
      } else {
        linkTypes.push('Other');
      }
    });
    
    // Also check for common link text patterns that indicate quality links
    const linkTextPatterns = [
      /\b(discord|github|documentation|docs|tutorial|guide|manual|wiki|demo|example|youtube)\b/gi
    ];
    
    linkTextPatterns.forEach(pattern => {
      const matches = description.match(pattern) || [];
      if (matches.length > 0 && !hasQualityLinks) {
        hasQualityLinks = true; // Even without actual links, mentioning these indicates support
      }
    });
    
    return {
      hasLinks: linkCount > 0,
      linkCount,
      hasQualityLinks,
      linkTypes: [...new Set(linkTypes)] // Remove duplicates
    };
  }

  /**
   * Detect Value Proposition patterns in content
   * Enhanced based on analysis - looks at title + first part of description for stronger UVP detection
   */
  private detectUVP(title: string, shortDesc: string, longDesc: string): boolean {
    // Combine title and first part of description for better UVP detection
    const openingText = `${title} ${shortDesc}`.slice(0, 200);
    const cleanText = openingText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    
    // Purpose and capability words (140% coverage in high-quality assets)
    const purposeWords = /\b(for|to|help|helps|enable|allows|let|lets|make|makes|create|creates|build|builds|design|designs)\b/i;
    
    // Tool and product descriptors (97% coverage)
    const toolDescriptors = /\b(pack|set|asset|package|collection|kit|system|library|tool|solution|framework|toolkit)\b/i;
    
    // Value and quality descriptors (43% coverage but high impact)
    const valueWords = /\b(best|perfect|ideal|ultimate|complete|comprehensive|professional|advanced|powerful|easy|simple|fast|quick|efficient|optimized|premium)\b/i;
    
    // Game development specific terms (92% coverage)
    const gameDevTerms = /\b(game|games|gaming|unity|unreal|project|projects|developer|development|indie|studio)\b/i;
    
    // Feature presentation terms (39% coverage)
    const featureWords = /\b(includes|contains|features|offers|provides|comes with|feature|delivers|equipped|loaded)\b/i;
    
    // Benefit terms
    const benefitWords = /\b(save|saves|improve|improves|boost|boosts|enhance|enhances|increase|increases|reduce|reduces|optimize|optimizes|streamline|streamlines)\b/i;
    
    // Check multiple patterns for stronger UVP detection
    let uvpScore = 0;
    
    if (purposeWords.test(cleanText)) uvpScore += 2;
    if (toolDescriptors.test(cleanText)) uvpScore += 2;
    if (valueWords.test(cleanText)) uvpScore += 3; // Higher weight for quality descriptors
    if (gameDevTerms.test(cleanText)) uvpScore += 1;
    if (featureWords.test(cleanText)) uvpScore += 1;
    if (benefitWords.test(cleanText)) uvpScore += 2;
    
    // Require a minimum score to ensure strong UVP presence
    return uvpScore >= 3;
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
   * Score trust signals with controllable factors
   * Evaluates content freshness, completeness, and professional presentation
   */
  scoreTrust(asset: Asset): ScoreResult {
    const score: ScoreResult = { score: 0, reasons: [] };
    const w = this.weights.trust;

    // Freshness - users can control this
    const days = daysBetween(asset.last_update);
    const freshOK = days != null && days <= this.thresholds.freshness.maxDays;
    if (freshOK) {
      score.score += w.freshness;
    } else {
      score.reasons.push(
        `Update older than ${this.thresholds.freshness.maxDays} days${days != null ? ` - ${days} days ago` : ''}`
      );
    }

    // Asset documentation/support links - users can control this
    const hasDocumentation = this.hasDocumentationLinks(asset);
    if (hasDocumentation) {
      score.score += w.documentation;
    } else {
      score.reasons.push('Add documentation or support links');
    }

    // Complete asset information - users can control this
    const completeness = this.calculateCompletenessScore(asset);
    if (completeness >= 0.8) {
      score.score += w.completeness;
    } else {
      score.reasons.push(`Incomplete asset information (${Math.round(completeness * 100)}% complete)`);
    }

    // Version information - users can control this
    const hasPublishNotes = asset.publishNotes && asset.publishNotes.trim().length > 0;
    if (hasPublishNotes) {
      score.score += w.publishNotes;
    } else {
      score.reasons.push('Add version information');
    }

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

    // Tag coverage - measures how well asset tags cover the category hierarchy
    const assetTags = new Set((asset.tags || []).map(x => String(x).toLowerCase()));
    const topTags = (vocab.top_tags || []).slice(0, 30).map(x => x.t);
    
    // Extract category hierarchy terms (e.g., "3D/Characters/Humanoids/Humans" -> ["3d", "characters", "humanoids", "humans"])
    const categoryTerms = this.extractCategoryTerms(asset.category || '');
    
    // Calculate category coverage: percentage of category terms present in asset tags
    const categoryCoverage = categoryTerms.length > 0 
      ? categoryTerms.filter(term => assetTags.has(term)).length / categoryTerms.length
      : 0;
    
    // Calculate top tags coverage for fallback when no category terms exist
    const topTagsCoverage = jaccard(Array.from(assetTags), topTags);
    
    // Use category coverage if available, otherwise fall back to top tags coverage
    const tagCoverage = categoryTerms.length > 0 ? categoryCoverage : topTagsCoverage;
    const tagCoverageOK = tagCoverage >= 0.35;
    
    if (tagCoverageOK) {
      score.score += w.tagcov;
    } else {
      const missingTerms = categoryTerms.filter(term => !assetTags.has(term));
      const coverageDetail = categoryTerms.length > 0 
        ? `category coverage ${Math.round(tagCoverage * 100)}% (missing: ${missingTerms.join(', ')})`
        : `tag coverage ${Math.round(tagCoverage * 100)}%`;
      score.reasons.push(`Increase ${coverageDetail}`);
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
   * Calculate letter grade from numeric score
   */
  calculateLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    // Normalize score to 0-100 scale based on maximum possible score
    const maxScore = this.getMaxScore();
    const normalizedScore = (score / maxScore) * 100;
    
    if (normalizedScore >= 85) return 'A';
    if (normalizedScore >= 70) return 'B';
    if (normalizedScore >= 55) return 'C';
    if (normalizedScore >= 40) return 'D';
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
           Object.values(w.find).reduce((a, b) => a + b, 0);
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

  /**
   * Extract terms from hierarchical category path
   * E.g., "3D/Characters/Humanoids/Humans" -> ["3d", "characters", "humanoids", "humans"]
   */
  private extractCategoryTerms(category: string): string[] {
    if (!category) return [];
    
    return category
      .split('/')
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0 && !isStopWord(term));
  }

  /**
   * Check for documentation or support links in descriptions
   * Enhanced to use proper link analysis
   */
  private hasDocumentationLinks(asset: Asset): boolean {
    const description = asset.long_description || asset.short_description || '';
    const linkAnalysis = this.analyzeLinks(description);
    
    // Check for quality links (documentation, GitHub, Discord, etc.)
    if (linkAnalysis.hasQualityLinks) {
      return true;
    }
    
    // Fallback to text-based detection for documentation keywords
    const docKeywords = /\b(documentation|docs|manual|guide|support|help|wiki|tutorial)\b/i;
    return docKeywords.test(description);
  }

  /**
   * Calculate completeness score based on filled fields
   */
  private calculateCompletenessScore(asset: Asset): number {
    const fields = [
      asset.title,
      asset.short_description,
      asset.long_description,
      asset.category,
      asset.tags && asset.tags.length > 0,
      asset.images_count && asset.images_count > 0,
      asset.version
    ];
    
    const filledFields = fields.filter(field => field && field !== '').length;
    return filledFields / fields.length;
  }
}

export default AssetGrader;