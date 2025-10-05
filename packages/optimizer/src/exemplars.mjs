import fs from 'fs';
import path from 'path';
import { Logger } from './utils/logger';
import { calculateDetailedRating } from './utils/rating-analysis';

/**
 * Exemplar Management System
 * Identifies and manages high-quality assets as learning exemplars
 */

// Create logger instance
const logger = new Logger('exemplars');

/**
 * Calculate composite quality score for an asset with enhanced rating analysis
 * @param {Object} asset - Asset data
 * @param {boolean} isBestSeller - Whether this asset is marked as a best seller
 * @returns {number} Quality score
 */
export function calculateQualityScore(asset, isBestSeller = false) {
    let score = 0;
    
    // Enhanced rating analysis
    const ratingData = calculateDetailedRating(asset.rating || []);
    const reviewsCount = asset.reviews_count || 0;
    
    // Review strength: average rating × log(1 + reviews) × quality multiplier
    const baseReviewStrength = ratingData.averageRating * Math.log(1 + reviewsCount);
    const qualityMultiplier = 1 + (ratingData.ratingQuality / 100);
    const reviewStrength = baseReviewStrength * qualityMultiplier;
    score += reviewStrength * 10; // Weight factor
    
    // MAJOR BONUS for best sellers
    if (isBestSeller) {
        score += 100; // Significant boost to ensure best sellers are always top-ranked
        logger.debug(`Best seller bonus applied to "${asset.title?.substring(0, 50)}": +100 points`);
    }
    
    // Rating quality bonuses
    if (ratingData.totalRatings >= 50 && ratingData.averageRating >= 4.5) {
        score += 15; // High-volume excellent ratings bonus
    }
    
    if (ratingData.consistency.excellentPercentage > 70) {
        score += 10; // Consistently excellent ratings bonus
    }
    
    if (ratingData.ratingQuality > 80) {
        score += 12; // High overall rating quality bonus
    }
    
    // Rating quality penalties
    if (ratingData.consistency.isControversial) {
        score -= 8; // Controversial rating pattern penalty
    }
    
    if (ratingData.consistency.negativePercentage > 20) {
        score -= 5; // High negative sentiment penalty
    }
    
    // Volume thresholds with quality requirements
    if (ratingData.totalRatings >= 100 && ratingData.averageRating >= 4.0) {
        score += 8; // Proven quality with high volume
    }
    
    if (ratingData.totalRatings >= 20 && ratingData.ratingQuality < 30) {
        score -= 10; // Poor quality despite sufficient volume
    }
    
    // Freshness bonus (recent update ≤ 180 days)
    const freshness = calculateFreshnessScore(asset.last_update);
    score += freshness * 5;
    
    // Popularity proxy (reviews_count + favorites)
    const popularity = reviewsCount + (asset.favorites || 0);
    score += Math.log(1 + popularity) * 3;
    
    // Listing completeness
    const completeness = calculateCompletenessScore(asset);
    score += completeness * 8;
    
    // Log detailed scoring for debugging
    logger.debug('Quality score calculated', {
        title: asset.title?.substring(0, 50),
        baseScore: score.toFixed(1),
        averageRating: ratingData.averageRating.toFixed(2),
        ratingQuality: ratingData.ratingQuality.toFixed(1),
        totalRatings: ratingData.totalRatings,
        reviewStrength: reviewStrength.toFixed(1)
    });
    
    return score;
}

/**
 * Calculate freshness score based on last update
 * @param {string} lastUpdate - Last update date string
 * @returns {number} Freshness score (0-10)
 */
function calculateFreshnessScore(lastUpdate) {
    if (!lastUpdate) return 0;
    
    try {
        const updateDate = new Date(lastUpdate);
        const now = new Date();
        const daysDiff = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 180) return 10; // Very fresh
        if (daysDiff <= 365) return 7;  // Fresh
        if (daysDiff <= 730) return 4;  // Somewhat fresh
        return 1; // Old but still counts
    } catch (error) {
        logger.warn(`Invalid date format: ${lastUpdate}`);
        return 0;
    }
}

/**
 * Calculate completeness score based on listing quality
 * @param {Object} asset - Asset data
 * @returns {number} Completeness score (0-10)
 */
function calculateCompletenessScore(asset) {
    let score = 0;
    
    // Images presence and count
    const imageCount = asset.images_count || 0;
    if (imageCount >= 5) score += 3;
    else if (imageCount >= 3) score += 2;
    else if (imageCount >= 1) score += 1;
    
    // Videos presence
    if ((asset.videos_count || 0) > 0) score += 2;
    
    // Description richness
    const description = asset.long_description || asset.short_description || '';
    const descriptionLength = description.replace(/<[^>]*>/g, '').length; // Strip HTML
    if (descriptionLength >= 500) score += 3;
    else if (descriptionLength >= 200) score += 2;
    else if (descriptionLength >= 50) score += 1;
    
    // Tags presence
    const tagsCount = (asset.tags || []).length;
    if (tagsCount >= 4) score += 2;
    else if (tagsCount >= 2) score += 1;
    
    return score;
}

/**
 * Normalize URL for matching
 * @param {string} url - Asset Store URL
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
    if (!url) return '';
    return url.toLowerCase().replace(/[?#].*$/, '').replace(/\/$/, '');
}

/**
 * Normalize title for matching
 * @param {string} title - Asset title
 * @returns {string} Normalized title
 */
function normalizeTitle(title) {
    if (!title) return '';
    return title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Check if an asset is a best seller
 * @param {Object} asset - Asset data
 * @param {Set} bestSellerLookup - Set of best seller identifiers
 * @returns {boolean} True if asset is a best seller
 */
function isBestSellerAsset(asset, bestSellerLookup) {
    // Check by URL
    if (asset.url && bestSellerLookup.has(normalizeUrl(asset.url))) {
        return true;
    }
    
    // Check by ID
    if (asset.id && bestSellerLookup.has(asset.id.toString())) {
        return true;
    }
    
    // Check by title
    if (asset.title && bestSellerLookup.has(normalizeTitle(asset.title))) {
        return true;
    }
    
    return false;
}

/**
 * Extract category from asset data
 * @param {Object} asset - Asset data
 * @returns {string} Normalized category
 */
function extractCategory(asset) {
    // Use category field, or fall back to extracting from URL or tags
    if (asset.category && asset.category.trim()) {
        return asset.category.trim();
    }
    
    // Try to extract from URL path
    const urlMatch = asset.url?.match(/\/packages\/([^\/]+)/);
    if (urlMatch) {
        return urlMatch[1].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    // Fall back to first tag if available
    if (asset.tags && asset.tags.length > 0) {
        return asset.tags[0];
    }
    
    return 'Uncategorized';
}

/**
 * Identify exemplar assets from a corpus with optional best sellers
 * @param {Array} assets - Array of asset objects
 * @param {number} topN - Number of exemplars per category (default: 20)
 * @param {number} topPercent - Percentage of exemplars per category
 * @param {Array} bestSellers - Array of best seller assets to always include
 * @returns {Object} Exemplars grouped by category
 */
export function identifyExemplars(assets, topN = null, topPercent = null, bestSellers = []) {
    // Default to topN = 20 if neither is specified
    const finalTopN = topN !== null ? topN : (topPercent !== null ? null : 20);
    const finalTopPercent = topPercent;
    
    const selectionMethod = finalTopPercent !== null ? `top ${finalTopPercent}%` : `top ${finalTopN}`;
    logger.info(`Identifying exemplars from ${assets.length} assets using ${selectionMethod}, with ${bestSellers.length} best sellers`);
    
    // Create a lookup for best sellers by URL, ID, and title
    const bestSellerLookup = new Set();
    bestSellers.forEach(bs => {
        if (bs.url) bestSellerLookup.add(normalizeUrl(bs.url));
        if (bs.id) bestSellerLookup.add(bs.id.toString());
        if (bs.title) bestSellerLookup.add(normalizeTitle(bs.title));
    });
    
    // Group assets by category
    const assetsByCategory = {};
    
    assets.forEach(asset => {
        const category = extractCategory(asset);
        if (!assetsByCategory[category]) {
            assetsByCategory[category] = [];
        }
        
        // Check if this asset is a best seller
        const isBestSeller = isBestSellerAsset(asset, bestSellerLookup);
        
        // Calculate quality score with enhanced rating analysis and add to asset
        const qualityScore = calculateQualityScore(asset, isBestSeller);
        const ratingData = calculateDetailedRating(asset.rating || []);
        
        assetsByCategory[category].push({
            ...asset,
            qualityScore,
            category: category, // Normalize category
            // Add rating analysis for later use
            _ratingAnalysis: ratingData,
            // Mark best seller status
            isBestSeller: isBestSeller
        });
    });
    
    // Select exemplars per category
    const exemplars = {};
    
    Object.keys(assetsByCategory).forEach(category => {
        const categoryAssets = assetsByCategory[category];
        
        // Separate best sellers from regular assets
        const bestSellerAssets = categoryAssets.filter(asset => asset.isBestSeller);
        const regularAssets = categoryAssets.filter(asset => !asset.isBestSeller);
        
        // Sort both groups by quality score (descending)
        bestSellerAssets.sort((a, b) => b.qualityScore - a.qualityScore);
        regularAssets.sort((a, b) => b.qualityScore - a.qualityScore);
        
        // Calculate how many regular assets to take
        let countToTake;
        if (finalTopPercent !== null) {
            countToTake = Math.ceil(categoryAssets.length * (finalTopPercent / 100));
        } else {
            countToTake = Math.min(finalTopN, categoryAssets.length);
        }
        
        // Always include ALL best sellers, then fill remaining slots with regular assets
        const bestSellerCount = bestSellerAssets.length;
        const regularCount = Math.max(0, countToTake - bestSellerCount);
        
        exemplars[category] = [
            ...bestSellerAssets, // All best sellers are automatically included
            ...regularAssets.slice(0, regularCount) // Top regular assets to fill remaining slots
        ];
        
        // If we have more best sellers than total slots, just take all best sellers
        if (bestSellerCount > countToTake) {
            exemplars[category] = bestSellerAssets;
        }
        
        const percentage = categoryAssets.length > 0 ? 
            ((exemplars[category].length / categoryAssets.length) * 100).toFixed(1) : '0.0';
        
        logger.info(`Category "${category}": ${categoryAssets.length} total assets, selected ${exemplars[category].length} exemplars (${percentage}%) - ${bestSellerCount} best sellers, ${exemplars[category].length - bestSellerCount} regular`);
        
        // Log enhanced stats about the exemplars
        if (exemplars[category].length > 0) {
            const scores = exemplars[category].map(a => a.qualityScore);
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const topScore = Math.max(...scores);
            const avgRating = exemplars[category].reduce((sum, a) => 
                sum + (a._ratingAnalysis?.averageRating || 0), 0) / exemplars[category].length;
            const avgRatingQuality = exemplars[category].reduce((sum, a) => 
                sum + (a._ratingAnalysis?.ratingQuality || 0), 0) / exemplars[category].length;
            const bestSellerCount = exemplars[category].filter(a => a.isBestSeller).length;
            
            logger.debug(`  Score range: ${topScore.toFixed(2)} (top) to ${Math.min(...scores).toFixed(2)} (bottom), avg: ${avgScore.toFixed(2)}`);
            logger.debug(`  Rating quality: avg rating ${avgRating.toFixed(2)}, avg quality score ${avgRatingQuality.toFixed(1)}`);
            logger.debug(`  Best sellers: ${bestSellerCount}/${exemplars[category].length} (${((bestSellerCount / exemplars[category].length) * 100).toFixed(1)}%)`);
        }
    });
    
    return exemplars;
}

/**
 * Load exemplars from a saved file
 * @param {string} filePath - Path to exemplars file
 * @returns {Object|null} Exemplars object or null if file doesn't exist
 */
export function loadExemplars(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        logger.error(`Error loading exemplars from ${filePath}:`, error);
        return null;
    }
}

/**
 * Save exemplars to a file
 * @param {Object} exemplars - Exemplars object
 * @param {string} filePath - Path to save exemplars
 */
export function saveExemplars(exemplars, filePath) {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(exemplars, null, 2));
        logger.info(`Exemplars saved to ${filePath}`);
    } catch (error) {
        logger.error(`Error saving exemplars to ${filePath}:`, error);
        throw error;
    }
}

/**
 * Get exemplar statistics
 * @param {Object} exemplars - Exemplars object
 * @returns {Object} Statistics about exemplars
 */
export function getExemplarStats(exemplars) {
    const stats = {
        totalCategories: Object.keys(exemplars).length,
        totalExemplars: 0,
        totalBestSellers: 0,
        averageExemplarsPerCategory: 0,
        categoriesWithMostExemplars: [],
        averageQualityScore: 0,
        averageRatingQuality: 0,
        scoreDistribution: {
            high: 0,    // > 50
            medium: 0,  // 20-50
            low: 0      // < 20
        },
        ratingQualityDistribution: {
            excellent: 0,  // > 80
            good: 0,       // 60-80
            fair: 0,       // 40-60
            poor: 0        // < 40
        },
        bestSellerDistribution: {}
    };
    
    let totalScore = 0;
    let totalRatingQuality = 0;
    let totalAssets = 0;
    
    Object.entries(exemplars).forEach(([category, assets]) => {
        stats.totalExemplars += assets.length;
        totalAssets += assets.length;
        
        const bestSellersInCategory = assets.filter(a => a.isBestSeller).length;
        stats.totalBestSellers += bestSellersInCategory;
        stats.bestSellerDistribution[category] = bestSellersInCategory;
        
        assets.forEach(asset => {
            totalScore += asset.qualityScore;
            
            const ratingQuality = asset._ratingAnalysis?.ratingQuality || 0;
            totalRatingQuality += ratingQuality;
            
            // Quality score distribution
            if (asset.qualityScore > 50) stats.scoreDistribution.high++;
            else if (asset.qualityScore > 20) stats.scoreDistribution.medium++;
            else stats.scoreDistribution.low++;
            
            // Rating quality distribution
            if (ratingQuality > 80) stats.ratingQualityDistribution.excellent++;
            else if (ratingQuality > 60) stats.ratingQualityDistribution.good++;
            else if (ratingQuality > 40) stats.ratingQualityDistribution.fair++;
            else stats.ratingQualityDistribution.poor++;
        });
        
        stats.categoriesWithMostExemplars.push({
            category,
            count: assets.length,
            bestSellers: bestSellersInCategory,
            avgScore: assets.reduce((sum, a) => sum + a.qualityScore, 0) / assets.length,
            avgRatingQuality: assets.reduce((sum, a) => sum + (a._ratingAnalysis?.ratingQuality || 0), 0) / assets.length
        });
    });
    
    stats.averageExemplarsPerCategory = stats.totalExemplars / stats.totalCategories;
    stats.averageQualityScore = totalScore / totalAssets;
    stats.averageRatingQuality = totalRatingQuality / totalAssets;
    
    // Sort categories by exemplar count
    stats.categoriesWithMostExemplars.sort((a, b) => b.count - a.count);
    stats.categoriesWithMostExemplars = stats.categoriesWithMostExemplars.slice(0, 10); // Top 10
    
    return stats;
}