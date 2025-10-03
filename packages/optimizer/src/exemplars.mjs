import fs from 'fs';
import path from 'path';
import { Logger } from './utils/logger.mjs';

/**
 * Exemplar Management System
 * Identifies and manages high-quality assets as learning exemplars
 */

// Create logger instance
const logger = new Logger('exemplars');

/**
 * Calculate composite quality score for an asset
 * @param {Object} asset - Asset data
 * @returns {number} Quality score
 */
export function calculateQualityScore(asset) {
    let score = 0;
    
    // Review strength: rating × log(1 + reviews_count)
    const rating = asset.rating || 0;
    const reviewsCount = asset.reviews_count || 0;
    const reviewStrength = rating * Math.log(1 + reviewsCount);
    score += reviewStrength * 10; // Weight factor
    
    // Freshness bonus (recent update ≤ 180 days)
    const freshness = calculateFreshnessScore(asset.last_update);
    score += freshness * 5;
    
    // Popularity proxy (reviews_count + favorites)
    const popularity = reviewsCount + (asset.favorites || 0);
    score += Math.log(1 + popularity) * 3;
    
    // Listing completeness
    const completeness = calculateCompletenessScore(asset);
    score += completeness * 8;
    
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
 * Identify exemplar assets from a corpus
 * @param {Array} assets - Array of asset objects
 * @param {number} topN - Number of exemplars per category (default: 20)
 * @returns {Object} Exemplars grouped by category
 */
export function identifyExemplars(assets, topN = null, topPercent = null) {
    // Default to topN = 20 if neither is specified
    const finalTopN = topN !== null ? topN : (topPercent !== null ? null : 20);
    const finalTopPercent = topPercent;
    
    const selectionMethod = finalTopPercent !== null ? `top ${finalTopPercent}%` : `top ${finalTopN}`;
    logger.info(`Identifying exemplars from ${assets.length} assets using ${selectionMethod}`);
    
    // Group assets by category
    const assetsByCategory = {};
    
    assets.forEach(asset => {
        const category = extractCategory(asset);
        if (!assetsByCategory[category]) {
            assetsByCategory[category] = [];
        }
        
        // Calculate quality score and add to asset
        const qualityScore = calculateQualityScore(asset);
        assetsByCategory[category].push({
            ...asset,
            qualityScore,
            category: category // Normalize category
        });
    });
    
    // Select exemplars per category
    const exemplars = {};
    
    Object.keys(assetsByCategory).forEach(category => {
        const categoryAssets = assetsByCategory[category];
        
        // Sort by quality score (descending)
        categoryAssets.sort((a, b) => b.qualityScore - a.qualityScore);
        
        // Calculate how many to take
        let countToTake;
        if (finalTopPercent !== null) {
            // Use percentage
            countToTake = Math.max(1, Math.ceil(categoryAssets.length * (finalTopPercent / 100)));
        } else {
            // Use fixed number
            countToTake = Math.min(finalTopN, categoryAssets.length);
        }
        
        // Take top exemplars
        exemplars[category] = categoryAssets.slice(0, countToTake);
        
        const percentage = ((exemplars[category].length / categoryAssets.length) * 100).toFixed(1);
        logger.info(`Category "${category}": ${categoryAssets.length} total assets, selected ${exemplars[category].length} exemplars (${percentage}%)`);
        
        // Log some stats about the exemplars
        if (exemplars[category].length > 0) {
            const scores = exemplars[category].map(a => a.qualityScore);
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const topScore = Math.max(...scores);
            logger.debug(`  Score range: ${topScore.toFixed(2)} (top) to ${Math.min(...scores).toFixed(2)} (bottom), avg: ${avgScore.toFixed(2)}`);
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
        averageExemplarsPerCategory: 0,
        categoriesWithMostExemplars: [],
        averageQualityScore: 0,
        scoreDistribution: {
            high: 0,    // > 50
            medium: 0,  // 20-50
            low: 0      // < 20
        }
    };
    
    let totalScore = 0;
    let totalAssets = 0;
    
    Object.entries(exemplars).forEach(([category, assets]) => {
        stats.totalExemplars += assets.length;
        totalAssets += assets.length;
        
        assets.forEach(asset => {
            totalScore += asset.qualityScore;
            
            if (asset.qualityScore > 50) stats.scoreDistribution.high++;
            else if (asset.qualityScore > 20) stats.scoreDistribution.medium++;
            else stats.scoreDistribution.low++;
        });
        
        stats.categoriesWithMostExemplars.push({
            category,
            count: assets.length,
            avgScore: assets.reduce((sum, a) => sum + a.qualityScore, 0) / assets.length
        });
    });
    
    stats.averageExemplarsPerCategory = stats.totalExemplars / stats.totalCategories;
    stats.averageQualityScore = totalScore / totalAssets;
    
    // Sort categories by exemplar count
    stats.categoriesWithMostExemplars.sort((a, b) => b.count - a.count);
    stats.categoriesWithMostExemplars = stats.categoriesWithMostExemplars.slice(0, 10); // Top 10
    
    return stats;
}