#!/usr/bin/env tsx
/**
 * Cold Outreach Publisher Finder - TypeScript Version
 * 
 * Uses the Unity Asset Optimizer grading system directly for maximum efficiency
 * 
 * Usage:
 *   npx tsx cold_outreach_finder_ts.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { DynamicAssetGrader } from '../packages/optimizer/src/dynamic-asset-grader';
import { Config, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from '../packages/optimizer/src/config';
import { Logger } from '../packages/optimizer/src/utils/logger';
import { FileValidator } from '../packages/optimizer/src/utils/validation';
import { calculateDetailedRating } from '../packages/optimizer/src/utils/rating-analysis';
import type { Asset, Vocabulary, GradeResult, CategoryVocabulary, DynamicGradingRulesFile, GraderConfig } from '../packages/optimizer/src/types';

interface Publisher {
  id: string;
  publisherTitle: string;
  publisherEmail?: string;
  publisherWebsite?: string;
  publisherDescription?: string;
  assets_count?: number;
  followers_count?: number;
  [key: string]: any;
}

interface GradedAsset extends Asset {
  grade: GradeResult & { isOptimizer: boolean };
}

interface PublisherAnalysis {
  publisher: Publisher;
  packages: Asset[];
  lowGradePackages: GradedAsset[];
  recentPackages: Asset[];
  reasoning: string;
  priority: number;
  samplePackagesForEmail: Array<{
    name: string;
    improvements: Array<{
      type: string;
      description: string;
    }>;
  }>;
}

/**
 * Cold Outreach Finder with direct TypeScript integration
 */
class ColdOutreachFinderTS {
  private grader: DynamicAssetGrader | null = null;
  private vocabulary: Vocabulary = {};
  private config: GraderConfig;

  constructor() {
    // Initialize with default configuration
    this.config = {
      weights: DEFAULT_WEIGHTS,
      thresholds: DEFAULT_THRESHOLDS,
      textProcessing: { ignoreStopWords: true }
    };
  }

  /**
   * Load all data files
   */
  async loadData(): Promise<{ publishers: Publisher[]; packages: Asset[]; bestSellerPublishers: Set<string> }> {
    console.log('📁 Loading data...');
    
    const publishers: Publisher[] = [];
    const packages: Asset[] = [];
    const bestSellerPublishers = new Set<string>();

    // Load best seller assets to identify successful publishers to exclude
    try {
      const bestSellerPath = 'packages/optimizer/data/best_seller_assets_full.json';
      console.log(`🏆 Loading best seller data from ${bestSellerPath}...`);
      const bestSellerData = JSON.parse(await fs.readFile(bestSellerPath, 'utf8'));
      
      if (Array.isArray(bestSellerData)) {
        for (const asset of bestSellerData) {
          if (asset.publisher) {
            bestSellerPublishers.add(asset.publisher);
          }
        }
      }
      console.log(`🚫 Identified ${bestSellerPublishers.size} successful publishers to exclude from outreach`);
    } catch (error) {
      console.warn('⚠️ Failed to load best seller data:', error);
    }

    // Load all JSON files from publishers directory
    try {
      const publishersDir = 'packages/optimizer/data/publishers';
      const publisherFiles = await fs.readdir(publishersDir);
      
      for (const file of publisherFiles.filter(f => f.endsWith('.json'))) {
        try {
          console.log(`  Loading ${publishersDir}/${file}...`);
          const data = JSON.parse(await fs.readFile(`${publishersDir}/${file}`, 'utf8'));
          if (Array.isArray(data)) {
            publishers.push(...data);
          } else if (data.publishers) {
            publishers.push(...data.publishers);
          }
        } catch (error) {
          console.warn(`  ⚠️ Failed to load ${publishersDir}/${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to read publishers directory:', error);
    }

    // Load all JSON files from corpus directory
    try {
      const corpusDir = 'packages/optimizer/data/corpus';
      const packageFiles = await fs.readdir(corpusDir);
      
      for (const file of packageFiles.filter(f => f.endsWith('.json'))) {
        try {
          console.log(`  Loading ${corpusDir}/${file}...`);
          const data = JSON.parse(await fs.readFile(`${corpusDir}/${file}`, 'utf8'));
          if (Array.isArray(data)) {
            packages.push(...data);
          } else if (data.packages) {
            packages.push(...data.packages);
          } else if (data.assets) {
            packages.push(...data.assets);
          }
        } catch (error) {
          console.warn(`  ⚠️ Failed to load ${corpusDir}/${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to read corpus directory:', error);
    }

    console.log(`✅ Loaded ${publishers.length} publishers and ${packages.length} packages`);
    return { publishers, packages, bestSellerPublishers };
  }

  /**
   * Load vocabulary and grading rules
   */
  async loadVocabulary(): Promise<void> {
    try {
      const vocabPath = 'packages/optimizer/data/results/exemplar_vocab.json';
      console.log(`📚 Loading vocabulary from ${vocabPath}...`);
      const vocabData = await fs.readFile(vocabPath, 'utf8');
      this.vocabulary = JSON.parse(vocabData);
      console.log(`✅ Loaded vocabulary with ${Object.keys(this.vocabulary).length} categories`);
    } catch (error) {
      console.warn('⚠️ Failed to load vocabulary, using empty vocabulary:', error);
      this.vocabulary = {};
    }

    // Load dynamic grading rules
    try {
      const rulesPath = 'packages/optimizer/data/results/grading-rules.json';
      console.log(`📋 Loading dynamic grading rules from ${rulesPath}...`);
      const gradingRules = await FileValidator.validateJSONFile(rulesPath) as DynamicGradingRulesFile;
      
      // Initialize DynamicAssetGrader with the loaded rules
      this.grader = new DynamicAssetGrader(this.config, gradingRules);
      console.log(`✅ Loaded dynamic grading rules for ${Object.keys(gradingRules.rules).length} categories`);
    } catch (error) {
      console.error('❌ Failed to load dynamic grading rules:', error);
      throw new Error('Dynamic grading rules are required for cold outreach analysis');
    }
  }

  /**
   * Grade a package using the Dynamic Asset Grader
   */
  async gradePackage(pkg: Asset): Promise<GradeResult & { isOptimizer: boolean }> {
    if (!this.grader) {
      throw new Error('Grader not initialized. Call loadVocabulary() first.');
    }
    
    try {
      // Asset is already in the correct format
      const grade = await this.grader.gradeAsset(pkg, this.vocabulary);
      return { ...grade, isOptimizer: true };
    } catch (error) {
      console.error(`⚠️ Failed to grade ${pkg.title}:`, error);
      // Fallback to simple heuristic grading
      return this.fallbackGrading(pkg);
    }
  }

  /**
   * Simple fallback grading when optimizer fails
   */
  fallbackGrading(pkg: Asset): GradeResult & { isOptimizer: boolean } {
    let score = 0;
    const reasons: string[] = [];

    // Title scoring (0-20 points) - more generous
    const titleOK = pkg.title && pkg.title.length >= 10 && pkg.title.length <= 80;
    if (titleOK) {
      score += 15;
    } else if (pkg.title && pkg.title.length > 0) {
      score += 8;
      reasons.push(`Title length not optimal (${pkg.title?.length || 0} chars)`);
    }

    // Description scoring (0-25 points) - more generous
    const longDesc = pkg.long_description || '';
    if (longDesc.length > 200) {
      score += 20;
    } else if (longDesc.length > 50) {
      score += 12;
      reasons.push('Description too short');
    } else {
      reasons.push('Missing or very short description');
    }

    // Images scoring (0-20 points) - more generous
    const imageCount = (pkg.images_count || 0);
    if (imageCount >= 5) {
      score += 15;
    } else if (imageCount >= 3) {
      score += 12;
    } else if (imageCount >= 1) {
      score += 8;
      reasons.push('Insufficient images');
    } else {
      reasons.push('No images');
    }

    // Tags scoring (0-15 points) - more generous
    const tagCount = (pkg.tags || []).length;
    if (tagCount >= 8) {
      score += 15;
    } else if (tagCount >= 5) {
      score += 10;
    } else if (tagCount >= 3) {
      score += 5;
      reasons.push('Few tags - poor discoverability');
    } else {
      reasons.push('Very few or no tags');
    }

    // Trust scoring (0-20 points) - more generous
    const reviewsCount = (pkg.reviews_count || 0);
    if (reviewsCount > 0) {
      score += 10;
    } else {
      reasons.push('No reviews or ratings');
    }

    // Freshness scoring (0-10 points)
    const daysSinceUpdate = this.daysBetween(pkg.last_update);
    const fresh = daysSinceUpdate != null && daysSinceUpdate <= 365;
    if (fresh) {
      score += 10;
    } else {
      reasons.push('Needs update');
    }

    // Calculate letter grade based on score
    let letter: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 85) letter = 'A';
    else if (score >= 70) letter = 'B';
    else if (score >= 55) letter = 'C';
    else if (score >= 40) letter = 'D';
    else letter = 'F';

    return {
      score,
      letter,
      reasons: reasons.slice(0, 3),
      breakdown: { content: score * 0.4, media: score * 0.3, trust: score * 0.2, findability: score * 0.1 },
      weights: {
        content: { title: 3, short: 3, long: 4, bullets: 2, cta: 2, uvp: 1 },
        media: { images: 5, video: 5, gif: 2 },
        trust: { freshness: 3, documentation: 2, completeness: 2, publishNotes: 1, rating: 3, reviews: 2 },
        find: { tagcov: 4, titlekw: 3, pricez: 1 }
      },
      isOptimizer: false
    };
  }

  /**
   * Check if asset has strong performance metrics (high reviews/ratings)
   * These indicate the publisher knows what they're doing
   */
  hasStrongPerformance(asset: Asset): boolean {
    const reviewsCount = asset.reviews_count || 0;
    const ratingData = calculateDetailedRating(asset.rating || []);
    const rating = ratingData.averageRating;
    
    // Strong performance indicators:
    // - High review count (50+ reviews shows significant traction)
    // - High rating (4.0+ shows quality)
    // - Both together indicate proven success
    const hasHighReviews = reviewsCount >= 50;
    const hasHighRating = rating >= 4.0;
    const hasModerateSuccess = reviewsCount >= 20 && rating >= 3.5;
    
    return (hasHighReviews && hasHighRating) || hasModerateSuccess;
  }

  /**
   * Check if email is from a free consumer email service
   * These publishers are more likely to be hobbyists/amateurs who need help
   */
  usesFreeEmail(email: string): boolean {
    if (!email) return false;
    
    const freeEmailProviders = [
      'gmail.com', 'googlemail.com',
      'yahoo.com', 'yahoo.co.uk', 'ymail.com',
      'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
      'aol.com',
      'icloud.com', 'me.com', 'mac.com',
      'protonmail.com', 'pm.me',
      'mail.com',
      'gmx.com', 'gmx.net',
      'zoho.com',
      'yandex.com', 'yandex.ru'
    ];
    
    const emailLower = email.toLowerCase();
    return freeEmailProviders.some(provider => emailLower.endsWith('@' + provider));
  }

  /**
   * Check if website is hosted on a free/budget website builder
   * These publishers are more likely to be hobbyists/amateurs who need help
   */
  usesFreeWebsiteBuilder(website: string): boolean {
    if (!website) return false;
    
    const freeWebsiteBuilders = [
      'wix.com', 'wixsite.com',
      'artstation.com',
      'itch.io',
      'weebly.com',
      'wordpress.com', 'wp.com',
      'blogspot.com', 'blogger.com',
      'tumblr.com',
      'squarespace.com',
      'carrd.co',
      'godaddysites.com',
      'site123.com',
      'webnode.com',
      'jimdo.com',
      'strikingly.com'
    ];
    
    const websiteLower = website.toLowerCase();
    return freeWebsiteBuilders.some(builder => websiteLower.includes(builder));
  }

  /**
   * Check if publisher has professional business indicators
   * Custom domain + professional email suggests established business
   */
  hasProfessionalIndicators(publisher: Publisher): boolean {
    const email = publisher.publisherEmail || '';
    const website = publisher.publisherWebsite || '';
    
    // Has custom domain (not free website builder)
    const hasCustomDomain = website.length > 0 && !this.usesFreeWebsiteBuilder(website);
    
    // Has professional email (not free email service)
    const hasProfessionalEmail = email.length > 0 && !this.usesFreeEmail(email);
    
    // Both indicators suggest professional operation
    return hasCustomDomain && hasProfessionalEmail;
  }

  /**
   * Calculate days between date and now
   */
  daysBetween(dateStr: string): number | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const now = new Date();
      return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }

  /**
   * Get sample packages with improvements for email templates using actual grading reasons
   */
  async getSamplePackagesWithImprovements(lowGradePackages: GradedAsset[]): Promise<Array<{
    name: string;
    improvements: Array<{ type: string; description: string }>;
  }>> {
    const samples = lowGradePackages.slice(0, 2); // Take first 2 packages
    const result = [];

    for (const pkg of samples) {
      const improvements: Array<{ type: string; description: string }> = [];
      
      // Use the actual grading reasons as specific recommendations
      const reasons = pkg.grade.reasons || [];
      
      if (reasons.length > 0) {
        // Convert grading reasons into actionable improvements
        for (const reason of reasons.slice(0, 3)) { // Take top 3 reasons
          let improvementType = 'general';
          
          // Categorize the improvement type based on the reason content
          if (reason.toLowerCase().includes('title')) {
            improvementType = 'title';
          } else if (reason.toLowerCase().includes('description') || reason.toLowerCase().includes('bullet')) {
            improvementType = 'description';
          } else if (reason.toLowerCase().includes('tag') || reason.toLowerCase().includes('keyword')) {
            improvementType = 'tags';
          } else if (reason.toLowerCase().includes('image') || reason.toLowerCase().includes('video') || reason.toLowerCase().includes('screenshot')) {
            improvementType = 'media';
          } else if (reason.toLowerCase().includes('version') || reason.toLowerCase().includes('documentation') || reason.toLowerCase().includes('support')) {
            improvementType = 'documentation';
          }
          
          improvements.push({
            type: improvementType,
            description: reason
          });
        }
      } else {
        // Fallback if no reasons available
        improvements.push({ 
          type: 'general', 
          description: 'Consider improving asset presentation and adding more detailed documentation' 
        });
      }

      result.push({
        name: pkg.title,
        improvements: improvements//.slice(0, 1) // Take 1 most important improvement
      });
    }

    return result;
  }

  /**
   * Analyze publishers for cold outreach opportunities
   */
  async analyzePublishers(publishers: Publisher[], packages: Asset[], bestSellerPublishers: Set<string>): Promise<PublisherAnalysis[]> {
    console.log('🔍 Analyzing publishers...');
    
    const packagesByPublisher = new Map<string, Asset[]>();
    packages.forEach(pkg => {
      const publisherName = pkg.publisher;
      if (!packagesByPublisher.has(publisherName)) {
        packagesByPublisher.set(publisherName, []);
      }
      packagesByPublisher.get(publisherName)!.push(pkg);
    });

    console.log(`📊 Found ${packagesByPublisher.size} unique publisher names in packages`);
    
    // Debug: Show first few publisher names from packages
    const publisherNames = Array.from(packagesByPublisher.keys()).slice(0, 10);
    console.log(`🔍 Sample publisher names from packages: ${publisherNames.join(', ')}`);
    
    // Debug: Show first few publisher names from publishers list
    const publisherListNames = publishers.slice(0, 10).map(p => p.publisherTitle || 'unknown');
    console.log(`🔍 Sample publisher names from publishers list: ${publisherListNames.join(', ')}`);

    const analyses: PublisherAnalysis[] = [];
    let processedCount = 0;
    let excludedBestSellers = 0;

    for (const publisher of publishers) {
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`  Processed ${processedCount}/${publishers.length} publishers...`);
      }

      // Skip publishers without email address (we need email for cold outreach)
      if (!publisher.publisherEmail) {
        continue;
      }

      // Use publisherTitle to match with packages (this is the correct field)
      const publisherName = publisher.publisherTitle;

      // Skip publishers who have best seller packages (they're already successful)
      if (bestSellerPublishers.has(publisherName)) {
        excludedBestSellers++;
        continue;
      }
      const publisherPackages = packagesByPublisher.get(publisherName) || [];
      if (publisherPackages.length === 0) continue;

      // Debug for first few publishers
      if (processedCount <= 5) {
        console.log(`    Publisher: ${publisherName} has ${publisherPackages.length} packages`);
      }

      // Filter recent packages (last 2 years)
      const recentPackages = publisherPackages.filter(pkg => {
        const days = this.daysBetween(pkg.last_update);
        return days != null && days <= 730;
      });

      if (recentPackages.length === 0) continue;

      // Debug for first few publishers
      if (processedCount <= 5) {
        console.log(`    Recent packages: ${recentPackages.length}`);
      }

      // Grade packages
      const gradedPackages: GradedAsset[] = [];
      for (const pkg of recentPackages) { // Limit to first 20 for performance
        const grade = await this.gradePackage(pkg);
        gradedPackages.push({ ...pkg, grade });
        
        // Debug: Log grades for first publisher
        if (processedCount === 1) {
          console.log(`      ${pkg.title}: ${grade.letter} (${grade.score})`);
        }
      }

      // Find low-grade packages (score < 55, which is D or F)
      const lowGradePackages = gradedPackages.filter(pkg => 
        pkg.grade.score < 55
      );

      if (lowGradePackages.length === 0) {
        continue; // Skip publishers with no low-grade packages
      }

      // Skip publishers who already demonstrate success through either:
      // 1. Good optimization/presentation (B grade or better in our grading)
      // 2. Strong market performance (high reviews/ratings regardless of grade)
      const hasSuccessfulGrades = gradedPackages.some(pkg => 
        pkg.grade.score >= 70
      );
      
      const hasMarketSuccess = publisherPackages.some(pkg => 
        this.hasStrongPerformance(pkg)
      );

      if (hasSuccessfulGrades || hasMarketSuccess) {
        // Skip publishers who have proven they know what they're doing
        // Either through good presentation OR through market validation
        continue;
      }

      // Check for systematic grading issues + professional indicators
      // If a publisher with professional setup (custom domain + professional email) 
      // has many packages ALL failing for the same reasons, it's likely a grading issue
      const hasHighActivity = recentPackages.length >= 20; // Lots of active packages
      const hasSystematicIssues = lowGradePackages.length >= 15; // Many low-grade packages
      
      if (this.hasProfessionalIndicators(publisher) && hasHighActivity && hasSystematicIssues) {
        // Professional publisher with many active packages all graded low?
        // Check if it's the same issue repeating (systematic grading problem)
        const allReasons = lowGradePackages.flatMap(pkg => pkg.grade.reasons);
        const reasonCounts = new Map<string, number>();
        allReasons.forEach(reason => {
          // Normalize reason to detect duplicates
          const normalized = reason.replace(/\d+/g, 'N').slice(0, 50);
          reasonCounts.set(normalized, (reasonCounts.get(normalized) || 0) + 1);
        });
        
        // If any single issue affects 80%+ of packages, it's systematic
        const maxReasonCount = Math.max(...reasonCounts.values());
        const systematicThreshold = lowGradePackages.length * 0.8;
        
        if (maxReasonCount >= systematicThreshold) {
          // Skip - likely a grading calibration issue, not genuine need
          continue;
        }
      }

      // Debug for first few publishers
      if (processedCount <= 3) {
        console.log(`    Graded ${gradedPackages.length} packages:`);
        gradedPackages.forEach(pkg => {
          console.log(`      ${pkg.title}: ${pkg.grade.letter} (${pkg.grade.score})`);
        });
        console.log(`    Low-grade packages: ${lowGradePackages.length}`);
        const hasSuccessfulGrades = gradedPackages.some(pkg => pkg.grade.score >= 70);
        const hasMarketSuccess = publisherPackages.some(pkg => this.hasStrongPerformance(pkg));
        console.log(`    Has successful grades (B+): ${hasSuccessfulGrades}`);
        console.log(`    Has market success (reviews/ratings): ${hasMarketSuccess}`);
      }

      const reasoning = this.generateReasoning(publisher, gradedPackages, lowGradePackages, recentPackages);
      const samplePackagesForEmail = await this.getSamplePackagesWithImprovements(lowGradePackages);

      // Calculate priority score (1-100)
      // Factors: number of low-grade packages, recency, contact info, professionalism indicators
      let priority = 0;
      
      // Base score from low-grade packages (up to 50 points)
      priority += Math.min(lowGradePackages.length * 5, 50);
      
      // Activity score from recent packages (up to 20 points)
      priority += Math.min(recentPackages.length, 20);
      
      // Contact info availability (15 points each)
      if (publisher.publisherEmail) priority += 15;
      if (publisher.publisherWebsite) priority += 15;
      
      // Check professionalism indicators
      const isProfessional = this.hasProfessionalIndicators(publisher);
      const usesFreeEmail = this.usesFreeEmail(publisher.publisherEmail || '');
      const usesFreeWebsite = this.usesFreeWebsiteBuilder(publisher.publisherWebsite || '');
      
      // BOOST: Publishers with amateur/hobby indicators are HIGHER priority
      // They're more likely to need help with professional marketing
      if (usesFreeEmail) {
        priority += 20; // Significant boost for free email (likely hobbyist/amateur)
      }
      
      if (usesFreeWebsite) {
        priority += 15; // Boost for free website builder (not professional operation)
      }
      
      // Both amateur indicators together = very likely amateur who needs help
      if (usesFreeEmail && usesFreeWebsite) {
        priority += 10; // Extra boost for combination
      }
      
      // PENALTY: Professional publishers should be lower priority
      // They likely have resources and might have grading calibration issues
      if (isProfessional) {
        priority -= 25; // Reduce priority for established businesses
        
        // Extra penalty if they have many packages (likely successful despite low grades)
        if (recentPackages.length >= 20) {
          priority -= 15;
        }
      }
      
      priority = Math.max(1, Math.min(priority, 100));

      analyses.push({
        publisher,
        packages: publisherPackages,
        lowGradePackages,
        recentPackages,
        reasoning,
        samplePackagesForEmail,
        priority
      });
    }

    console.log(`🚫 Excluded ${excludedBestSellers} best seller publishers from outreach analysis`);
    return analyses.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate reasoning for why this publisher is a good target
   */
  generateReasoning(publisher: Publisher, allPackages: GradedAsset[], lowGradePackages: GradedAsset[], recentPackages: Asset[]): string {
    const totalPackages = allPackages.length;
    const lowGradeCount = lowGradePackages.length;
    const recentCount = recentPackages.length;
    
    const commonIssues = new Map<string, number>();
    lowGradePackages.forEach(pkg => {
      pkg.grade.reasons.forEach(reason => {
        commonIssues.set(reason, (commonIssues.get(reason) || 0) + 1);
      });
    });

    const topIssues = Array.from(commonIssues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue, count]) => `${issue} (${count} packages)`);

    return `Publisher has ${lowGradeCount} low-grade packages out of ${totalPackages} recent packages. ` +
           `Common issues: ${topIssues.join(', ')}. ` +
           `Active publisher with ${recentCount} packages in the last 2 years.`;
  }

  /**
   * Generate analysis report
   */
  generateReport(analyses: PublisherAnalysis[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COLD OUTREACH ANALYSIS REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`  Publishers analyzed: ${analyses.length}`);
    console.log(`  Average low-grade packages per publisher: ${analyses.length > 0 
      ? (analyses.reduce((sum, a) => sum + a.lowGradePackages.length, 0) / analyses.length).toFixed(1)
      : 0}`);

    console.log(`\n🎯 Top Cold Outreach Targets:`);
    analyses.slice(0, 20).forEach((analysis, i) => {
      console.log(`\n${i + 1}. ${analysis.publisher.publisherTitle}`);
      console.log(`   🎯 Priority Score: ${analysis.priority}/100`);
      console.log(`   📧 ${analysis.publisher.publisherEmail || 'No email'}`);
      console.log(`   🌐 ${analysis.publisher.publisherWebsite || 'No website'}`);
      console.log(`   Low-grade packages: ${analysis.lowGradePackages.length}`);
      console.log(`   Recent packages: ${analysis.recentPackages.length}`);
      console.log(`   ${analysis.reasoning}`);

      if (analysis.samplePackagesForEmail.length > 0) {
        console.log(`   Sample packages for email:`);
        analysis.samplePackagesForEmail.forEach(sample => {
          console.log(`     • ${sample.name}`);
          sample.improvements.forEach(imp => {
            console.log(`       - ${imp.description}`);
          });
        });
      }
    });
  }

  /**
   * Save results to JSON file
   */
  async saveResults(analyses: PublisherAnalysis[]): Promise<void> {
    const outputPath = 'cold_outreach_targets_ts.json';
    const output = {
      generated: new Date().toISOString(),
      summary: {
        totalTargets: analyses.length,
        avgLowGradePackagesPerPublisher: analyses.length > 0 
          ? analyses.reduce((sum, a) => sum + a.lowGradePackages.length, 0) / analyses.length 
          : 0
      },
      targets: analyses.map(analysis => ({
        publisher: {
          name: analysis.publisher.publisherTitle,
          email: analysis.publisher.publisherEmail,
          website: analysis.publisher.publisherWebsite,
          lowGradePackages: analysis.lowGradePackages.length,
          recentPackages: analysis.recentPackages.length,
          priority: analysis.priority
        },
        packages: analysis.lowGradePackages.map(pkg => ({
          title: pkg.title,
          score: pkg.grade.score,
          letter: pkg.grade.letter,
          issues: pkg.grade.reasons, // all recommendations
          lastUpdate: pkg.last_update
        })),
        reasoning: analysis.reasoning,
        samplePackagesForEmail: analysis.samplePackagesForEmail
      }))
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Results saved to ${outputPath}`);

    // Also save CSV
    await this.saveCSV(analyses);
  }

  /**
   * Save results to CSV file with one row per publisher
   */
  async saveCSV(analyses: PublisherAnalysis[]): Promise<void> {
    const csvPath = 'cold_outreach_targets.csv';
    const rows: string[] = [];

    // CSV header - one row per publisher
    rows.push([
      'Publisher Name',
      'Priority Score (1-100)',
      'Email',
      'Website',
      'Low Grade Packages',
      'Recent Packages',
      'Average Package Score',
      'Most Common Issue 1',
      'Most Common Issue 2', 
      'Most Common Issue 3',
      'Sample Package 1',
      'Sample Package 1 Issues',
      'Sample Package 2',
      'Sample Package 2 Issues',
      'Sample Package 3',
      'Sample Package 3 Issues',
      'Reasoning'
    ].join(','));

    // Sort by priority (highest first)
    const sortedAnalyses = analyses.sort((a, b) => b.priority - a.priority);

    for (const analysis of sortedAnalyses) {
      const pub = analysis.publisher;
      
      // Calculate average package score
      const avgScore = analysis.lowGradePackages.length > 0 
        ? Math.round(analysis.lowGradePackages.reduce((sum, pkg) => sum + pkg.grade.score, 0) / analysis.lowGradePackages.length)
        : 0;

      // Get all recommendations and find most common issues
      const allRecommendations = analysis.lowGradePackages.flatMap(pkg => pkg.grade.reasons || []);
      const issueCount = new Map<string, number>();
      allRecommendations.forEach(rec => {
        issueCount.set(rec, (issueCount.get(rec) || 0) + 1);
      });
      
      const topIssues = Array.from(issueCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([issue]) => issue);

      // Get sample packages (up to 3) with their specific issues
      const samplePackagesData = analysis.lowGradePackages.slice(0, 3);
      
      const rowData = [
        this.csvEscape(pub.publisherTitle || ''),
        analysis.priority.toString(),
        this.csvEscape(pub.publisherEmail || ''),
        this.csvEscape(pub.publisherWebsite || ''),
        analysis.lowGradePackages.length.toString(),
        analysis.recentPackages.length.toString(),
        avgScore.toString(),
        this.csvEscape(topIssues[0] || ''),
        this.csvEscape(topIssues[1] || ''),
        this.csvEscape(topIssues[2] || ''),
        this.csvEscape(samplePackagesData[0]?.title || ''),
        this.csvEscape((samplePackagesData[0]?.grade.reasons || []).join(' | ')),
        this.csvEscape(samplePackagesData[1]?.title || ''),
        this.csvEscape((samplePackagesData[1]?.grade.reasons || []).join(' | ')),
        this.csvEscape(samplePackagesData[2]?.title || ''),
        this.csvEscape((samplePackagesData[2]?.grade.reasons || []).join(' | ')),
        this.csvEscape(analysis.reasoning)
      ];

      rows.push(rowData.join(','));
    }

    await fs.writeFile(csvPath, rows.join('\n'));
    console.log(`📊 CSV results saved to ${csvPath}`);
  }

  /**
   * Escape CSV field content
   */
  csvEscape(value: string): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Main execution function
   */
  async run(): Promise<void> {
    console.log('🚀 Advanced Cold Outreach Finder Starting (TypeScript Version)...\n');

    try {
      // Load data
      const { publishers, packages, bestSellerPublishers } = await this.loadData();
      
      // Load vocabulary for grading
      await this.loadVocabulary();

      // Analyze publishers
      const analyses = await this.analyzePublishers(publishers, packages, bestSellerPublishers);

      // Generate report
      this.generateReport(analyses);

      // Save results
      await this.saveResults(analyses);

      console.log('\n✅ Analysis complete!');
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
console.log('🚀 Starting Cold Outreach Finder...');
const finder = new ColdOutreachFinderTS();
finder.run().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export default ColdOutreachFinderTS;