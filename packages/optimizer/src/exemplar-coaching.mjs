import { Logger } from './utils/logger';

/**
 * Exemplar-Based Coaching System
 * Provides similarity-driven recommendations by comparing assets to exemplar neighbors
 */

// Create logger instance
const logger = new Logger('coaching');

/**
 * Find nearest exemplar neighbors for an asset
 * @param {Object} asset - Target asset to find neighbors for
 * @param {Object} exemplarsData - Loaded exemplars data
 * @param {number} k - Number of neighbors to return (default: 5)
 * @returns {Array} Array of nearest exemplar neighbors
 */
export function findNearestExemplars(asset, exemplarsData, k = 5) {
    const category = extractAssetCategory(asset);
    const exemplars = exemplarsData.exemplars;
    
    // Start with same category exemplars
    let candidates = exemplars[category] || [];
    
    // If not enough in same category, add from related categories
    if (candidates.length < k) {
        const relatedCategories = findRelatedCategories(category, exemplars);
        for (const relatedCat of relatedCategories) {
            candidates = [...candidates, ...(exemplars[relatedCat] || [])];
            if (candidates.length >= k * 2) break; // Get extra candidates for better selection
        }
    }
    
    // Calculate similarity scores
    const neighborsWithSimilarity = candidates.map(exemplar => ({
        ...exemplar,
        similarity: calculateAssetSimilarity(asset, exemplar)
    }));
    
    // Sort by similarity and return top k
    neighborsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    
    return neighborsWithSimilarity.slice(0, k);
}

/**
 * Generate exemplar-grounded recommendations
 * @param {Object} asset - Target asset
 * @param {Object} exemplarsData - Loaded exemplars data
 * @param {number} maxNeighbors - Maximum neighbors to consider (default: 5)
 * @returns {Object} Comprehensive recommendations
 */
export function generateExemplarRecommendations(asset, exemplarsData, maxNeighbors = 5) {
    logger.info('Generating exemplar-based recommendations', { 
        assetTitle: asset.title,
        category: extractAssetCategory(asset)
    });
    
    const neighbors = findNearestExemplars(asset, exemplarsData, maxNeighbors);
    const category = extractAssetCategory(asset);
    const categoryPatterns = exemplarsData.patterns[category];
    
    if (!categoryPatterns || neighbors.length === 0) {
        logger.warn('No patterns or neighbors found for category', { category });
        return {
            recommendations: [],
            reasoning: 'Insufficient exemplar data for this category',
            neighbors: []
        };
    }
    
    const recommendations = {
        title: analyzeTitleGaps(asset, neighbors, categoryPatterns),
        description: analyzeDescriptionGaps(asset, neighbors, categoryPatterns),
        tags: analyzeTagGaps(asset, neighbors, categoryPatterns),
        media: analyzeMediaGaps(asset, neighbors, categoryPatterns),
        structure: analyzeStructureGaps(asset, neighbors, categoryPatterns),
        price: analyzePriceAlignment(asset, neighbors, categoryPatterns)
    };
    
    // Filter out empty recommendations
    const validRecommendations = Object.entries(recommendations)
        .filter(([_, recs]) => recs && recs.suggestions && recs.suggestions.length > 0)
        .map(([category, data]) => ({
            category,
            ...data
        }));
    
    return {
        recommendations: validRecommendations,
        categoryAlignment: calculateCategoryAlignment(asset, categoryPatterns),
        neighbors: neighbors.map(n => ({
            title: n.title,
            similarity: n.similarity.toFixed(3),
            qualityScore: n.qualityScore.toFixed(1),
            url: n.url
        })),
        metadata: {
            category,
            exemplarsUsed: neighbors.length,
            totalCategoryExemplars: exemplarsData.exemplars[category]?.length || 0
        }
    };
}

/**
 * Analyze title gaps compared to exemplars
 */
function analyzeTitleGaps(asset, neighbors, patterns) {
    const suggestions = [];
    const reasoning = [];
    
    const assetTitle = (asset.title || '').toLowerCase();
    const titleWords = extractWords(assetTitle);
    
    // Check for missing high-frequency title words from exemplars
    const topTitleWords = patterns.vocabulary.titleWords.slice(0, 10);
    const missingWords = topTitleWords.filter(wordData => {
        const word = wordData.item.toLowerCase();
        return !titleWords.includes(word) && wordData.frequency >= 3; // In at least 3 exemplars
    });
    
    if (missingWords.length > 0) {
        const topMissing = missingWords.slice(0, 3);
        suggestions.push({
            type: 'keywords',
            content: `Consider including these keywords: ${topMissing.map(w => `"${w.item}"`).join(', ')}`,
            impact: 'high',
            explanation: `These appear in ${topMissing[0].frequency}+ top exemplars in this category`
        });
        reasoning.push(`Missing ${topMissing.length} high-frequency title keywords`);
    }
    
    // Check title length against exemplar patterns
    const titleLength = assetTitle.length;
    const optimalLength = patterns.structure.titleLength;
    
    if (titleLength < optimalLength.median - 10) {
        suggestions.push({
            type: 'length',
            content: `Title is shorter than typical (${titleLength} vs ${Math.round(optimalLength.median)} chars)`,
            impact: 'medium',
            explanation: `Exemplars average ${Math.round(optimalLength.avg)} characters`
        });
    } else if (titleLength > optimalLength.median + 20) {
        suggestions.push({
            type: 'length',
            content: `Title might be too long (${titleLength} vs ${Math.round(optimalLength.median)} chars)`,
            impact: 'medium',
            explanation: `Consider focusing on core keywords`
        });
    }
    
    // Check for common bigrams
    const topBigrams = patterns.vocabulary.titleBigrams.slice(0, 5);
    const assetBigrams = extractBigrams(titleWords);
    const missingBigrams = topBigrams.filter(bigramData => {
        return !assetBigrams.includes(bigramData.item) && bigramData.frequency >= 2;
    });
    
    if (missingBigrams.length > 0) {
        suggestions.push({
            type: 'phrases',
            content: `Consider these common phrases: ${missingBigrams.slice(0, 2).map(b => `"${b.item}"`).join(', ')}`,
            impact: 'medium',
            explanation: `These phrase combinations are common in successful listings`
        });
    }
    
    return {
        suggestions,
        reasoning: reasoning.join('; '),
        score: Math.max(0, 100 - suggestions.length * 20), // Simple scoring
        exemplarExamples: neighbors.slice(0, 3).map(n => n.title)
    };
}

/**
 * Analyze description gaps compared to exemplars
 */
function analyzeDescriptionGaps(asset, neighbors, patterns) {
    const suggestions = [];
    const reasoning = [];
    
    const description = (asset.long_description || asset.short_description || '').replace(/<[^>]*>/g, ' ');
    const descWords = extractWords(description);
    const descLength = description.length;
    
    // Check description length
    const optimalLength = patterns.structure.longDescriptionLength;
    if (descLength < optimalLength.median * 0.5) {
        suggestions.push({
            type: 'length',
            content: `Description is too short (${descLength} vs ${Math.round(optimalLength.median)} chars)`,
            impact: 'high',
            explanation: `Exemplars provide detailed explanations averaging ${Math.round(optimalLength.avg)} characters`
        });
        reasoning.push('Description significantly shorter than exemplars');
    }
    
    // Check for missing important description words
    const topDescWords = patterns.vocabulary.descriptionWords.slice(0, 15);
    const missingDescWords = topDescWords.filter(wordData => {
        return !descWords.includes(wordData.item.toLowerCase()) && wordData.frequency >= 3;
    });
    
    if (missingDescWords.length > 0) {
        suggestions.push({
            type: 'keywords',
            content: `Missing common terms: ${missingDescWords.slice(0, 4).map(w => w.item).join(', ')}`,
            impact: 'medium',
            explanation: `These terms frequently appear in high-performing descriptions`
        });
    }
    
    // Check structure patterns
    if (patterns.structure.commonStructures.hasFeaturesList > 0.6 && !/features?:|what.s included:/i.test(description)) {
        suggestions.push({
            type: 'structure',
            content: 'Consider adding a "Features:" or "What\'s included:" section',
            impact: 'medium',
            explanation: `${Math.round(patterns.structure.commonStructures.hasFeaturesList * 100)}% of exemplars include feature lists`
        });
    }
    
    if (patterns.structure.bulletPoints.median > 3 && !/[⚡•▪▫◦‣⁃]|<li>/i.test(description)) {
        suggestions.push({
            type: 'formatting',
            content: `Add bullet points (exemplars average ${Math.round(patterns.structure.bulletPoints.median)})`,
            impact: 'medium',
            explanation: 'Bullet points improve readability and highlight key features'
        });
    }
    
    return {
        suggestions,
        reasoning: reasoning.join('; '),
        score: Math.max(0, 100 - suggestions.length * 15),
        exemplarExamples: neighbors.slice(0, 2).map(n => ({
            title: n.title,
            descriptionLength: (n.long_description || n.short_description || '').replace(/<[^>]*>/g, '').length
        }))
    };
}

/**
 * Analyze tag gaps compared to exemplars
 */
function analyzeTagGaps(asset, neighbors, patterns) {
    const suggestions = [];
    const reasoning = [];
    
    const assetTags = (asset.tags || []).map(t => t.toLowerCase().trim());
    const assetTagCount = assetTags.length;
    
    // Check tag count
    const optimalTagCount = patterns.tags.averageTagCount;
    if (assetTagCount < optimalTagCount * 0.7) {
        suggestions.push({
            type: 'count',
            content: `Add more tags (${assetTagCount} vs avg ${Math.round(optimalTagCount)})`,
            impact: 'medium',
            explanation: 'More tags improve discoverability'
        });
        reasoning.push('Fewer tags than typical exemplars');
    }
    
    // Check for missing common tags
    const topTags = patterns.tags.commonTags.slice(0, 10);
    const missingTags = topTags.filter(tagData => {
        return !assetTags.includes(tagData.item.toLowerCase()) && tagData.frequency >= 3;
    });
    
    if (missingTags.length > 0) {
        suggestions.push({
            type: 'keywords',
            content: `Consider these common tags: ${missingTags.slice(0, 4).map(t => t.item).join(', ')}`,
            impact: 'high',
            explanation: `These tags appear in ${missingTags[0].frequency}+ exemplars`
        });
    }
    
    // Check for tag co-occurrence opportunities
    const topCooccurrences = patterns.tags.tagCooccurrence.slice(0, 5);
    for (const cooccur of topCooccurrences) {
        const [tag1, tag2] = cooccur.item.split('|');
        if (assetTags.includes(tag1) && !assetTags.includes(tag2)) {
            suggestions.push({
                type: 'cooccurrence',
                content: `Since you have "${tag1}", consider adding "${tag2}"`,
                impact: 'medium',
                explanation: `These tags often appear together in successful listings`
            });
            break; // Only suggest one co-occurrence
        }
    }
    
    return {
        suggestions,
        reasoning: reasoning.join('; '),
        score: Math.max(0, 100 - suggestions.length * 20),
        exemplarExamples: neighbors.slice(0, 3).map(n => ({
            title: n.title,
            tags: n.tags || []
        }))
    };
}

/**
 * Analyze media gaps compared to exemplars
 */
function analyzeMediaGaps(asset, neighbors, patterns) {
    const suggestions = [];
    const reasoning = [];
    
    const assetImages = asset.images_count || 0;
    const assetVideos = asset.videos_count || 0;
    
    // Check image count
    const optimalImages = patterns.media.images;
    if (assetImages < optimalImages.median) {
        const deficit = Math.round(optimalImages.median - assetImages);
        suggestions.push({
            type: 'images',
            content: `Add ${deficit} more images (${assetImages} vs median ${Math.round(optimalImages.median)})`,
            impact: 'high',
            explanation: `Exemplars average ${Math.round(optimalImages.avg)} images`
        });
        reasoning.push('Below median image count');
    }
    
    // Check video presence
    if (assetVideos === 0 && patterns.media.hasVideo > 0.4) {
        suggestions.push({
            type: 'video',
            content: 'Consider adding a demo video',
            impact: 'high',
            explanation: `${Math.round(patterns.media.hasVideo * 100)}% of exemplars include videos`
        });
        reasoning.push('No video while many exemplars have videos');
    }
    
    return {
        suggestions,
        reasoning: reasoning.join('; '),
        score: Math.max(0, 100 - suggestions.length * 25),
        exemplarExamples: neighbors.slice(0, 3).map(n => ({
            title: n.title,
            images: n.images_count || 0,
            videos: n.videos_count || 0
        }))
    };
}

/**
 * Analyze structure gaps compared to exemplars
 */
function analyzeStructureGaps(asset, neighbors, patterns) {
    const suggestions = [];
    const description = (asset.long_description || asset.short_description || '');
    
    // Check for short lead
    if (patterns.structure.hasShortLead > 0.5 && description.length > 160) {
        const shortDesc = asset.short_description || '';
        if (shortDesc.replace(/<[^>]*>/g, '').length > 160 || !shortDesc) {
            suggestions.push({
                type: 'lead',
                content: 'Add a concise lead paragraph (≤160 characters)',
                impact: 'medium',
                explanation: `${Math.round(patterns.structure.hasShortLead * 100)}% of exemplars start with short summaries`
            });
        }
    }
    
    return {
        suggestions,
        reasoning: suggestions.length > 0 ? 'Structure improvements needed' : 'Structure looks good',
        score: Math.max(0, 100 - suggestions.length * 30)
    };
}

/**
 * Analyze price alignment with exemplars
 */
function analyzePriceAlignment(asset, neighbors, patterns) {
    const suggestions = [];
    const assetPrice = asset.price || 0;
    
    if (assetPrice > 0 && patterns.price.median > 0) {
        const medianPrice = patterns.price.median;
        const iqr = patterns.price.iqr;
        
        if (assetPrice > iqr.q3 * 1.5) {
            suggestions.push({
                type: 'pricing',
                content: `Price is high compared to category (${assetPrice} vs median ${medianPrice.toFixed(2)})`,
                impact: 'medium',
                explanation: 'Consider if premium pricing is justified by features'
            });
        } else if (assetPrice < iqr.q1 * 0.5) {
            suggestions.push({
                type: 'pricing',
                content: `Price might be too low (${assetPrice} vs median ${medianPrice.toFixed(2)})`,
                impact: 'low',
                explanation: 'Could potentially charge more given category norms'
            });
        }
    }
    
    return {
        suggestions,
        reasoning: suggestions.length > 0 ? 'Price outside typical range' : 'Price aligned with category',
        score: suggestions.length === 0 ? 100 : 70,
        categoryPricing: {
            median: patterns.price.median,
            range: `${patterns.price.min} - ${patterns.price.max}`,
            q1: patterns.price.iqr.q1,
            q3: patterns.price.iqr.q3
        }
    };
}

/**
 * Calculate overall category alignment score
 */
function calculateCategoryAlignment(asset, patterns) {
    let alignmentScore = 0;
    let maxScore = 0;
    
    // Title alignment (20 points)
    const titleWords = extractWords((asset.title || '').toLowerCase());
    const topTitleWords = patterns.vocabulary.titleWords.slice(0, 10).map(w => w.item);
    const titleMatches = titleWords.filter(word => topTitleWords.includes(word)).length;
    alignmentScore += Math.min(20, (titleMatches / topTitleWords.length) * 20);
    maxScore += 20;
    
    // Tag alignment (15 points)
    const assetTags = (asset.tags || []).map(t => t.toLowerCase().trim());
    const topTags = patterns.tags.commonTags.slice(0, 10).map(t => t.item);
    const tagMatches = assetTags.filter(tag => topTags.includes(tag)).length;
    alignmentScore += Math.min(15, (tagMatches / Math.min(topTags.length, assetTags.length || 1)) * 15);
    maxScore += 15;
    
    // Media alignment (10 points)
    const imageScore = Math.min(10, ((asset.images_count || 0) / patterns.media.images.median) * 10);
    alignmentScore += imageScore;
    maxScore += 10;
    
    return {
        score: Math.round((alignmentScore / maxScore) * 100),
        breakdown: {
            title: Math.round((titleMatches / topTitleWords.length) * 100),
            tags: Math.round((tagMatches / Math.min(topTags.length, assetTags.length || 1)) * 100),
            media: Math.round(imageScore * 10)
        }
    };
}

// Helper functions

function extractAssetCategory(asset) {
    return asset.category || asset.tags?.[0] || 'Uncategorized';
}

function findRelatedCategories(category, exemplars) {
    const categoryLower = category.toLowerCase();
    const related = [];
    
    // Simple category relationships
    const relationships = {
        '3d': ['vfx', 'tools'],
        '2d': ['tools', 'templates'],
        'tools': ['3d', '2d', 'templates'],
        'templates': ['tools', '2d'],
        'vfx': ['3d', 'tools'],
        'audio': ['tools']
    };
    
    return relationships[categoryLower] || Object.keys(exemplars).filter(cat => cat !== category);
}

function calculateAssetSimilarity(asset1, asset2) {
    let similarity = 0;
    
    // Title similarity (40% weight)
    const title1Words = extractWords((asset1.title || '').toLowerCase());
    const title2Words = extractWords((asset2.title || '').toLowerCase());
    const titleJaccard = jaccardSimilarity(title1Words, title2Words);
    similarity += titleJaccard * 0.4;
    
    // Tag similarity (30% weight)
    const tags1 = (asset1.tags || []).map(t => t.toLowerCase());
    const tags2 = (asset2.tags || []).map(t => t.toLowerCase());
    const tagJaccard = jaccardSimilarity(tags1, tags2);
    similarity += tagJaccard * 0.3;
    
    // Price similarity (15% weight)
    const price1 = asset1.price || 0;
    const price2 = asset2.price || 0;
    if (price1 > 0 && price2 > 0) {
        const priceSim = 1 - Math.abs(price1 - price2) / Math.max(price1, price2);
        similarity += priceSim * 0.15;
    }
    
    // Media similarity (15% weight)
    const media1 = (asset1.images_count || 0) + (asset1.videos_count || 0);
    const media2 = (asset2.images_count || 0) + (asset2.videos_count || 0);
    if (media1 > 0 || media2 > 0) {
        const mediaSim = 1 - Math.abs(media1 - media2) / Math.max(media1, media2, 1);
        similarity += mediaSim * 0.15;
    }
    
    return similarity;
}

function jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.includes(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

function extractWords(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !isStopWord(word));
}

function extractBigrams(words) {
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams;
}

function isStopWord(word) {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'this', 'that', 'these', 'those', 'you', 'your', 'it', 'its', 'is', 'are', 'was', 'were',
        'be', 'been', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'may', 'might'
    ]);
    return stopWords.has(word);
}

/**
 * Generate a category playbook from exemplar patterns
 * @param {string} category - Category name
 * @param {Object} patterns - Category patterns
 * @param {Array} exemplars - Category exemplars
 * @returns {Object} Category playbook
 */
export function generateCategoryPlaybook(category, patterns, exemplars) {
    return {
        category,
        summary: {
            exemplarCount: exemplars.length,
            averageQualityScore: patterns.metadata.averageQualityScore,
            lastUpdated: patterns.metadata.extractedAt
        },
        recommendations: {
            title: {
                optimalLength: `${Math.round(patterns.structure.titleLength.median)} characters (range: ${Math.round(patterns.structure.titleLength.min)}-${Math.round(patterns.structure.titleLength.max)})`,
                mustHaveKeywords: patterns.vocabulary.titleWords.slice(0, 5).map(w => w.item),
                commonPhrases: patterns.vocabulary.titleBigrams.slice(0, 3).map(b => b.item)
            },
            description: {
                optimalLength: `${Math.round(patterns.structure.longDescriptionLength.median)} characters`,
                shouldInclude: patterns.structure.commonStructures.hasFeaturesList > 0.5 ? ['Feature list'] : [],
                bulletPoints: `~${Math.round(patterns.structure.bulletPoints.median)} bullet points`,
                keyTerms: patterns.vocabulary.descriptionWords.slice(0, 8).map(w => w.item)
            },
            tags: {
                optimalCount: Math.round(patterns.tags.averageTagCount),
                mostImportant: patterns.tags.commonTags.slice(0, 6).map(t => t.item),
                commonPairs: patterns.tags.tagCooccurrence.slice(0, 3).map(co => co.item.replace('|', ' + '))
            },
            media: {
                images: `${Math.round(patterns.media.images.median)} images (range: ${patterns.media.images.min}-${patterns.media.images.max})`,
                videos: patterns.media.hasVideo > 0.3 ? 'Include demo video' : 'Video optional',
                videoAdoption: `${Math.round(patterns.media.hasVideo * 100)}% of exemplars include videos`
            },
            pricing: {
                median: `$${patterns.price.median?.toFixed(2) || 'N/A'}`,
                range: `$${patterns.price.min || 0} - $${patterns.price.max || 0}`,
                sweetSpot: `$${patterns.price.iqr?.q1?.toFixed(2) || 0} - $${patterns.price.iqr?.q3?.toFixed(2) || 0} (middle 50%)`
            }
        },
        topExemplars: exemplars.slice(0, 5).map(e => ({
            title: e.title,
            qualityScore: e.qualityScore.toFixed(1),
            keyStrengths: identifyExemplarStrengths(e, patterns)
        }))
    };
}

function identifyExemplarStrengths(exemplar, patterns) {
    const strengths = [];
    
    if (exemplar.reviews_count > 100) strengths.push('High review count');
    if (exemplar.rating > 4.5) strengths.push('Excellent rating');
    if ((exemplar.images_count || 0) >= patterns.media.images.median) strengths.push('Good media coverage');
    
    return strengths;
}