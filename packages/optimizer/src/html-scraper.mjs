/**
 * Simple HTML scraper for Unity Asset Store
 * Works without Puppeteer by fetching and parsing static HTML content
 * This is a fallback/alternative to the Puppeteer scraper for faster, lighter scraping
 */

import { readFile } from 'fs/promises';

/**
 * Main scraping function using plain HTML parsing
 * @param {string} url - The Unity Asset Store URL to scrape
 * @returns {Promise<Object>} Asset data object
 */
export async function scrapeAssetWithHTML(url) {
  try {
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract asset information from HTML
    const asset = {
      id: extractIdFromUrl(url),
      url: url,
      title: extractTitle(html),
      short_description: extractShortDescription(html),
      long_description: extractLongDescription(html),
      tags: extractTags(html),
      category: extractCategoryFromUrl(url),
      price: extractPrice(html),
      images_count: extractImageCount(html),
      videos_count: extractVideoCount(html),
      rating: extractRating(html),
      reviews_count: extractReviewsCount(html),
      review_breakdown: extractReviewBreakdown(html),
      last_update: extractLastUpdate(html),
      publisher: extractPublisher(html),
      size: extractSize(html),
      version: extractVersion(html),
      favorites: extractFavorites(html)
    };

    return asset;
  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

/**
 * Extract asset ID from URL
 */
function extractIdFromUrl(url) {
  const match = url.match(/\/packages\/[^\/]+\/[^\/]+\/(\d+)/) || url.match(/-(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Extract category from URL
 */
function extractCategoryFromUrl(url) {
  const match = url.match(/\/packages\/([^\/]+)\//);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Unknown';
}

/**
 * Extract title from HTML
 */
function extractTitle(html) {
  // Try multiple selectors for title
  let match;
  
  // Try the specific class used by Unity Asset Store
  match = html.match(/<[^>]*class="[^"]*cfm2v[^"]*"[^>]*>([^<]+)</i);
  if (match) return cleanText(match[1]);
  
  // Try h1 tags
  match = html.match(/<h1[^>]*>([^<]+)</i);
  if (match) return cleanText(match[1]);
  
  // Try title tag
  match = html.match(/<title[^>]*>([^<]+)</i);
  if (match) return cleanText(match[1].replace(/ \| Unity Asset Store/, ''));
  
  // Try Open Graph title
  match = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  if (match) return cleanText(match[1]);
  
  return 'Unknown Title';
}

/**
 * Extract short description from HTML
 */
function extractShortDescription(html) {
  // Try meta description first
  let match = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  if (match) return cleanText(match[1]);
  
  // Try Open Graph description
  match = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  if (match) return cleanText(match[1]);
  
  return '';
}

/**
 * Extract long description from HTML
 */
function extractLongDescription(html) {
  // Try to find description content with various selectors
  let match;
  
  // Try Unity Asset Store specific class
  match = html.match(/<[^>]*class="[^"]*_1rkJa[^"]*"[^>]*>(.*?)<\/[^>]*>/is);
  if (match) return cleanText(match[1]);
  
  // Try description divs
  match = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is);
  if (match) return cleanText(match[1]);
  
  // Fallback to meta description
  return extractShortDescription(html);
}

/**
 * Extract tags from HTML
 */
function extractTags(html) {
  const tags = [];
  
  // Try Unity Asset Store specific tag selectors
  const tagMatches = html.matchAll(/<[^>]*class="[^"]*_15pcy[^"]*"[^>]*>([^<]+)</gi);
  for (const match of tagMatches) {
    const tag = cleanText(match[1]);
    if (tag && tag.length > 0 && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  // If no tags found, try generic approaches
  if (tags.length === 0) {
    // Try keywords meta tag
    const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i);
    if (keywordsMatch) {
      const keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
      tags.push(...keywords.slice(0, 10)); // Limit to 10 keywords
    }
  }
  
  return tags;
}

/**
 * Extract price from HTML
 */
function extractPrice(html) {
  // Try Unity Asset Store specific price selector
  let match = html.match(/<[^>]*class="[^"]*_223RA[^"]*"[^>]*>([^<]+)</i);
  if (match) {
    const priceText = match[1].toLowerCase();
    if (priceText.includes('free')) {
      return 0;
    }
    const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
    return priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;
  }
  
  // Try generic price patterns
  const pricePatterns = [
    /\$\s*([\d,]+\.?\d*)/i,
    /price[^>]*>([^<]*\$[\d,]+\.?\d*)/i,
    /cost[^>]*>([^<]*\$[\d,]+\.?\d*)/i
  ];
  
  for (const pattern of pricePatterns) {
    match = html.match(pattern);
    if (match) {
      const priceText = match[1] || match[0];
      if (priceText.toLowerCase().includes('free')) {
        return 0;
      }
      const priceMatch = priceText.match(/([\d,]+\.?\d*)/);
      return priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;
    }
  }
  
  return null;
}

/**
 * Extract image count from HTML
 */
function extractImageCount(html) {
  // Count screenshot references
  const screenshotMatches = html.match(/screenshot/gi) || [];
  const imageMatches = html.match(/<img[^>]*>/gi) || [];
  
  // Estimate based on image tags and screenshot mentions
  return Math.min(screenshotMatches.length, imageMatches.length, 20); // Cap at 20
}

/**
 * Extract video count from HTML
 */
function extractVideoCount(html) {
  // Count video references
  const videoMatches = html.match(/youtube|video|vimeo/gi) || [];
  const videoTagMatches = html.match(/<video[^>]*>/gi) || [];
  
  // Estimate based on video-related content
  return Math.min(videoMatches.length + videoTagMatches.length, 10); // Cap at 10
}

/**
 * Extract rating from HTML
 */
function extractRating(html) {
  // Try Unity Asset Store specific rating selector
  let match = html.match(/data-rating="([^"]*)"/i);
  if (match) return parseFloat(match[1]);
  
  // Try various rating patterns
  const ratingPatterns = [
    /rating[^>]*>([^<]*)([\d\.]+)/i,
    /([\d\.]+)\s*stars?/i,
    /([\d\.]+)\s*\/\s*5/i,
    /stars[^>]*>([^<]*)([\d\.]+)/i
  ];
  
  for (const pattern of ratingPatterns) {
    match = html.match(pattern);
    if (match) {
      const rating = parseFloat(match[2] || match[1]);
      if (rating >= 0 && rating <= 5) {
        return rating;
      }
    }
  }
  
  return null;
}

/**
 * Extract reviews count from HTML
 */
function extractReviewsCount(html) {
  // Try Unity Asset Store specific selector
  let match = html.match(/<[^>]*class="[^"]*NoXio[^"]*"[^>]*>([^<]+)</i);
  if (match) {
    const countMatch = match[1].match(/([\d,]+)/);
    return countMatch ? parseInt(countMatch[1].replace(',', '')) : 0;
  }
  
  // Try generic review patterns
  const reviewPatterns = [
    /([\d,]+)\s*reviews?/i,
    /reviews?[^>]*>([^<]*)([\d,]+)/i,
    /([\d,]+)\s*ratings?/i
  ];
  
  for (const pattern of reviewPatterns) {
    match = html.match(pattern);
    if (match) {
      const count = parseInt((match[2] || match[1]).replace(',', ''));
      if (!isNaN(count)) {
        return count;
      }
    }
  }
  
  return 0;
}

/**
 * Extract review breakdown from HTML
 */
function extractReviewBreakdown(html) {
  const breakdown = {
    five_star: 0,
    four_star: 0,
    three_star: 0,
    two_star: 0,
    one_star: 0
  };
  
  // Try to find star rating breakdowns
  const starPatterns = [
    { regex: /5\s*star[s]?\s*(\d+)|(\d+)\s*5\s*star/gi, field: 'five_star' },
    { regex: /4\s*star[s]?\s*(\d+)|(\d+)\s*4\s*star/gi, field: 'four_star' },
    { regex: /3\s*star[s]?\s*(\d+)|(\d+)\s*3\s*star/gi, field: 'three_star' },
    { regex: /2\s*star[s]?\s*(\d+)|(\d+)\s*2\s*star/gi, field: 'two_star' },
    { regex: /1\s*star[s]?\s*(\d+)|(\d+)\s*1\s*star/gi, field: 'one_star' }
  ];
  
  for (const pattern of starPatterns) {
    const matches = [...html.matchAll(pattern.regex)];
    for (const match of matches) {
      const count = parseInt(match[1] || match[2]);
      if (!isNaN(count) && count > 0) {
        breakdown[pattern.field] = Math.max(breakdown[pattern.field], count);
      }
    }
  }
  
  return breakdown;
}

/**
 * Extract last update date from HTML
 */
function extractLastUpdate(html) {
  // Try Unity Asset Store specific selector
  let match = html.match(/<[^>]*class="[^"]*product-date[^"]*"[^>]*>.*?<[^>]*class="[^"]*SoNzt[^"]*"[^>]*>([^<]+)</is);
  if (match) return cleanText(match[1]);
  
  // Try generic date patterns
  const datePatterns = [
    /updated?[^>]*>([^<]*\d{4}[^<]*)/i,
    /last[^>]*update[^>]*>([^<]*\d{4}[^<]*)/i,
    /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/
  ];
  
  for (const pattern of datePatterns) {
    match = html.match(pattern);
    if (match) return cleanText(match[1]);
  }
  
  return null;
}

/**
 * Extract publisher from HTML
 */
function extractPublisher(html) {
  // Try Unity Asset Store specific selector
  let match = html.match(/<[^>]*class="[^"]*U9Sw1[^"]*"[^>]*>([^<]+)</i);
  if (match) return cleanText(match[1]);
  
  // Try generic publisher patterns
  const publisherPatterns = [
    /publisher[^>]*>([^<]+)/i,
    /author[^>]*>([^<]+)/i,
    /developer[^>]*>([^<]+)/i,
    /by\s+([^<\s]+)/i
  ];
  
  for (const pattern of publisherPatterns) {
    match = html.match(pattern);
    if (match) return cleanText(match[1]);
  }
  
  return 'Unknown Publisher';
}

/**
 * Extract size from HTML
 */
function extractSize(html) {
  // Try Unity Asset Store specific selector
  let match = html.match(/<[^>]*class="[^"]*product-size[^"]*"[^>]*>.*?<[^>]*class="[^"]*SoNzt[^"]*"[^>]*>([^<]+)</is);
  if (match) return cleanText(match[1]);
  
  // Try generic size patterns
  const sizePatterns = [
    /size[^>]*>([^<]*\d+[^<]*(?:MB|KB|GB))/i,
    /(\d+(?:\.\d+)?\s*(?:MB|KB|GB))/i
  ];
  
  for (const pattern of sizePatterns) {
    match = html.match(pattern);
    if (match) return cleanText(match[1]);
  }
  
  return null;
}

/**
 * Extract version from HTML
 */
function extractVersion(html) {
  // Try Unity Asset Store specific selector
  let match = html.match(/<[^>]*class="[^"]*product-version[^"]*"[^>]*>.*?<[^>]*class="[^"]*SoNzt[^"]*"[^>]*>([^<]+)</is);
  if (match) return cleanText(match[1]);
  
  // Try generic version patterns
  const versionPatterns = [
    /version[^>]*>([^<]*\d+[^<]*)/i,
    /v(\d+(?:\.\d+)*)/i,
    /(\d+(?:\.\d+){2,})/
  ];
  
  for (const pattern of versionPatterns) {
    match = html.match(pattern);
    if (match) return cleanText(match[1]);
  }
  
  return null;
}

/**
 * Extract favorites count from HTML
 */
function extractFavorites(html) {
  // Try Unity Asset Store specific selector
  let match = html.match(/<[^>]*class="[^"]*_3EMPt[^"]*"[^>]*>([^<]+)</i);
  if (match) {
    const favMatch = match[1].match(/(\d+)/);
    return favMatch ? parseInt(favMatch[1]) : null;
  }
  
  // Try generic favorites patterns
  const favPatterns = [
    /favorite[s]?[^>]*>([^<]*\d+[^<]*)/i,
    /(\d+)\s*favorite/i,
    /heart[^>]*>([^<]*\d+[^<]*)/i
  ];
  
  for (const pattern of favPatterns) {
    match = html.match(pattern);
    if (match) {
      const favMatch = (match[1] || match[0]).match(/(\d+)/);
      return favMatch ? parseInt(favMatch[1]) : null;
    }
  }
  
  return null;
}

/**
 * Clean and normalize text content
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}