import { Logger } from './utils/logger';
import { isStopWord, filterStopWords } from './utils/utils.mjs';

/**
 * Pattern Extraction from Exemplars
 * Analyzes exemplar assets to extract category-specific patterns
 */

// Create logger instance
const logger = new Logger('patterns');

/**
 * Extract vocabulary patterns from exemplars
 * @param {Array} exemplars - Array of exemplar assets
 * @param {Object} config - Configuration object containing textProcessing settings
 * @returns {Object} Vocabulary patterns
 */
export function extractVocabularyPatterns(exemplars, config = {}) {
    const ignoreStopWords = config.textProcessing?.ignoreStopWords ?? true;
    
    const patterns = {
        titleWords: {},      // Word frequency in titles
        titleBigrams: {},    // Common word pairs in titles
        descriptionWords: {},// Important words in descriptions (first 200 words)
        keyPhrases: []       // Common phrases across exemplars
    };
    
    exemplars.forEach(asset => {
        // Process title
        if (asset.title) {
            const titleWords = extractWords(asset.title, ignoreStopWords);
            titleWords.forEach(word => {
                patterns.titleWords[word] = (patterns.titleWords[word] || 0) + 1;
            });
            
            // Extract bigrams from title
            const bigrams = extractBigrams(titleWords);
            bigrams.forEach(bigram => {
                patterns.titleBigrams[bigram] = (patterns.titleBigrams[bigram] || 0) + 1;
            });
        }
        
        // Process description (first 200 words)
        const description = asset.long_description || asset.short_description || '';
        const cleanDescription = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        const descWords = extractWords(cleanDescription, ignoreStopWords).slice(0, 200);
        
        descWords.forEach(word => {
            patterns.descriptionWords[word] = (patterns.descriptionWords[word] || 0) + 1;
        });
    });
    
    // Convert to ranked lists and filter by frequency
    const minFrequency = Math.max(1, Math.floor(exemplars.length * 0.2)); // Appear in at least 20% of exemplars
    
    patterns.titleWords = filterAndRank(patterns.titleWords, minFrequency);
    patterns.titleBigrams = filterAndRank(patterns.titleBigrams, Math.max(1, Math.floor(exemplars.length * 0.15)));
    patterns.descriptionWords = filterAndRank(patterns.descriptionWords, minFrequency);
    
    return patterns;
}

/**
 * Extract tag patterns from exemplars
 * @param {Array} exemplars - Array of exemplar assets
 * @returns {Object} Tag patterns
 */
export function extractTagPatterns(exemplars) {
    const patterns = {
        commonTags: {},      // Tag frequency
        tagCooccurrence: {}, // Tags that often appear together
        averageTagCount: 0
    };
    
    let totalTags = 0;
    
    exemplars.forEach(asset => {
        const tags = asset.tags || [];
        totalTags += tags.length;
        
        // Count individual tags
        tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase().trim();
            patterns.commonTags[normalizedTag] = (patterns.commonTags[normalizedTag] || 0) + 1;
        });
        
        // Count tag co-occurrences
        for (let i = 0; i < tags.length; i++) {
            for (let j = i + 1; j < tags.length; j++) {
                const tag1 = tags[i].toLowerCase().trim();
                const tag2 = tags[j].toLowerCase().trim();
                const pair = [tag1, tag2].sort().join('|');
                patterns.tagCooccurrence[pair] = (patterns.tagCooccurrence[pair] || 0) + 1;
            }
        }
    });
    
    patterns.averageTagCount = totalTags / exemplars.length;
    
    // Filter and rank
    const minTagFreq = Math.max(1, Math.floor(exemplars.length * 0.15));
    patterns.commonTags = filterAndRank(patterns.commonTags, minTagFreq);
    patterns.tagCooccurrence = filterAndRank(patterns.tagCooccurrence, Math.max(1, Math.floor(exemplars.length * 0.1)));
    
    return patterns;
}

/**
 * Extract structural patterns from exemplars
 * @param {Array} exemplars - Array of exemplar assets
 * @returns {Object} Structure patterns
 */
export function extractStructurePatterns(exemplars) {
    const patterns = {
        titleLength: { min: Infinity, max: 0, avg: 0, median: 0 },
        shortDescriptionLength: { min: Infinity, max: 0, avg: 0, median: 0 },
        longDescriptionLength: { min: Infinity, max: 0, avg: 0, median: 0 },
        bulletPoints: { avg: 0, median: 0, present: 0 },
        hasShortLead: 0, // Assets with descriptions ≤ 160 chars
        commonStructures: {
            hasFeaturesList: 0,
            hasRequirements: 0,
            hasExamples: 0,
            hasLinks: 0,
            hasCTA: 0 // Call to action
        }
    };
    
    const lengths = {
        title: [],
        shortDesc: [],
        longDesc: [],
        bullets: []
    };
    
    exemplars.forEach(asset => {
        // Title analysis
        if (asset.title) {
            const titleLen = asset.title.length;
            lengths.title.push(titleLen);
            patterns.titleLength.min = Math.min(patterns.titleLength.min, titleLen);
            patterns.titleLength.max = Math.max(patterns.titleLength.max, titleLen);
        }
        
        // Description analysis
        const shortDesc = asset.short_description || '';
        const longDesc = asset.long_description || '';
        
        if (shortDesc) {
            const shortLen = shortDesc.replace(/<[^>]*>/g, '').length;
            lengths.shortDesc.push(shortLen);
            patterns.shortDescriptionLength.min = Math.min(patterns.shortDescriptionLength.min, shortLen);
            patterns.shortDescriptionLength.max = Math.max(patterns.shortDescriptionLength.max, shortLen);
            
            if (shortLen <= 160) patterns.hasShortLead++;
        }
        
        if (longDesc) {
            const longLen = longDesc.replace(/<[^>]*>/g, '').length;
            lengths.longDesc.push(longLen);
            patterns.longDescriptionLength.min = Math.min(patterns.longDescriptionLength.min, longLen);
            patterns.longDescriptionLength.max = Math.max(patterns.longDescriptionLength.max, longLen);
        }
        
        // Structure analysis
        const fullDesc = (shortDesc + ' ' + longDesc).toLowerCase();
        
        // Bullet points
        const bulletMatches = fullDesc.match(/[⚡•▪▫◦‣⁃]/g) || [];
        const listMatches = fullDesc.match(/<li>/g) || [];
        const totalBullets = bulletMatches.length + listMatches.length;
        lengths.bullets.push(totalBullets);
        if (totalBullets > 0) patterns.bulletPoints.present++;
        
        // Common structures
        if (/features?:|what.s included:|includes?:/i.test(fullDesc)) {
            patterns.commonStructures.hasFeaturesList++;
        }
        if (/requirements?:|needs?:|depends? on:|requires?:/i.test(fullDesc)) {
            patterns.commonStructures.hasRequirements++;
        }
        if (/example|demo|sample|see|play\.google\.com|github\.com/i.test(fullDesc)) {
            patterns.commonStructures.hasExamples++;
        }
        if (/<a href|https?:\/\//i.test(fullDesc)) {
            patterns.commonStructures.hasLinks++;
        }
        if (/get|buy|download|try|check out|visit/i.test(fullDesc)) {
            patterns.commonStructures.hasCTA++;
        }
    });
    
    // Calculate averages and medians
    if (lengths.title.length > 0) {
        patterns.titleLength.avg = lengths.title.reduce((a, b) => a + b, 0) / lengths.title.length;
        patterns.titleLength.median = calculateMedian(lengths.title);
    }
    
    if (lengths.shortDesc.length > 0) {
        patterns.shortDescriptionLength.avg = lengths.shortDesc.reduce((a, b) => a + b, 0) / lengths.shortDesc.length;
        patterns.shortDescriptionLength.median = calculateMedian(lengths.shortDesc);
    }
    
    if (lengths.longDesc.length > 0) {
        patterns.longDescriptionLength.avg = lengths.longDesc.reduce((a, b) => a + b, 0) / lengths.longDesc.length;
        patterns.longDescriptionLength.median = calculateMedian(lengths.longDesc);
    }
    
    if (lengths.bullets.length > 0) {
        patterns.bulletPoints.avg = lengths.bullets.reduce((a, b) => a + b, 0) / lengths.bullets.length;
        patterns.bulletPoints.median = calculateMedian(lengths.bullets);
    }
    
    return patterns;
}

/**
 * Extract media patterns from exemplars
 * @param {Array} exemplars - Array of exemplar assets
 * @returns {Object} Media patterns
 */
export function extractMediaPatterns(exemplars) {
    const patterns = {
        images: { min: Infinity, max: 0, avg: 0, median: 0 },
        videos: { min: Infinity, max: 0, avg: 0, median: 0 },
        hasVideo: 0, // Percentage with videos
        imageVideoRatio: 0
    };
    
    const imageCounts = [];
    const videoCounts = [];
    let totalImages = 0;
    let totalVideos = 0;
    
    exemplars.forEach(asset => {
        const images = asset.images_count || 0;
        const videos = asset.videos_count || 0;
        
        imageCounts.push(images);
        videoCounts.push(videos);
        totalImages += images;
        totalVideos += videos;
        
        patterns.images.min = Math.min(patterns.images.min, images);
        patterns.images.max = Math.max(patterns.images.max, images);
        patterns.videos.min = Math.min(patterns.videos.min, videos);
        patterns.videos.max = Math.max(patterns.videos.max, videos);
        
        if (videos > 0) patterns.hasVideo++;
    });
    
    patterns.images.avg = totalImages / exemplars.length;
    patterns.images.median = calculateMedian(imageCounts);
    patterns.videos.avg = totalVideos / exemplars.length;
    patterns.videos.median = calculateMedian(videoCounts);
    patterns.hasVideo = patterns.hasVideo / exemplars.length; // Convert to percentage
    patterns.imageVideoRatio = totalImages > 0 ? totalVideos / totalImages : 0;
    
    return patterns;
}

/**
 * Extract price patterns from exemplars
 * @param {Array} exemplars - Array of exemplar assets
 * @returns {Object} Price patterns
 */
export function extractPricePatterns(exemplars) {
    const prices = exemplars
        .map(asset => asset.price)
        .filter(price => price !== null && price !== undefined && price > 0);
    
    if (prices.length === 0) {
        return { min: 0, max: 0, avg: 0, median: 0, iqr: { q1: 0, q3: 0 } };
    }
    
    prices.sort((a, b) => a - b);
    
    const patterns = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        median: calculateMedian(prices),
        iqr: calculateIQR(prices)
    };
    
    return patterns;
}

/**
 * Extract all patterns from exemplars for a category
 * @param {Array} exemplars - Array of exemplar assets for a category
 * @param {Object} config - Configuration object containing textProcessing settings
 * @returns {Object} Complete pattern analysis
 */
export function extractCategoryPatterns(exemplars, config = {}) {
    logger.info(`Extracting patterns from ${exemplars.length} exemplars`);
    
    return {
        vocabulary: extractVocabularyPatterns(exemplars, config),
        tags: extractTagPatterns(exemplars),
        structure: extractStructurePatterns(exemplars),
        media: extractMediaPatterns(exemplars),
        price: extractPricePatterns(exemplars),
        metadata: {
            exemplarCount: exemplars.length,
            averageQualityScore: exemplars.reduce((sum, e) => sum + e.qualityScore, 0) / exemplars.length,
            topExemplarScore: Math.max(...exemplars.map(e => e.qualityScore)),
            extractedAt: new Date().toISOString()
        }
    };
}

// Helper functions

function extractWords(text, ignoreStopWords = true) {
    if (!text) return [];
    
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && word.length < 20);
    
    return filterStopWords(words, ignoreStopWords);
}

function extractBigrams(words) {
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams;
}

// Remove the old isStopWord function since we're using the centralized one from utils.mjs

function filterAndRank(frequencyMap, minFrequency) {
    return Object.entries(frequencyMap)
        .filter(([_, freq]) => freq >= minFrequency)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 50) // Top 50
        .map(([item, freq]) => ({ item, frequency: freq }));
}

function calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
        return sorted[mid];
    }
}

function calculateIQR(sortedNumbers) {
    if (sortedNumbers.length === 0) return { q1: 0, q3: 0 };
    
    const q1Index = Math.floor(sortedNumbers.length * 0.25);
    const q3Index = Math.floor(sortedNumbers.length * 0.75);
    
    return {
        q1: sortedNumbers[q1Index],
        q3: sortedNumbers[q3Index]
    };
}