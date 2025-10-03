/**
 * Simple HTML scraper for Unity Asset Store
 * Works without Puppeteer by fetching and parsing static HTML content
 * This is a fallback/alternative to the Puppeteer scraper for faster, lighter scraping
 * 
 * LIMITATIONS:
 * - Unity Asset Store loads detailed descriptions dynamically via JavaScript
 * - Static HTML only contains meta descriptions (~100-200 characters)
 * - For full description content (4000+ characters), use Puppeteer scraper
 * - This scraper is optimized for speed and basic data extraction
 * 
 * WHAT IT CAN EXTRACT FROM STATIC HTML:
 * - Title, category, tags, price, publisher
 * - Basic metadata (size, version, last update)
 * - Short descriptions from meta tags and JSON-LD
 * - Rating and review counts
 * - Image/video counts (estimated)
 */

/**
 * Simple HTML parser to extract elements by class name
 * @param {string} html - The HTML content to parse
 * @param {string} className - The class name to search for
 * @returns {Array} Array of element contents
 */
function getElementsByClassName(html, className) {
  const elements = [];
  const classPattern = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`, 'gi');
  
  let match;
  let searchPos = 0;
  
  while ((match = classPattern.exec(html)) !== null) {
    const elementStart = html.lastIndexOf('<', match.index);
    if (elementStart === -1) continue;
    
    // Find the tag name
    const tagMatch = html.slice(elementStart).match(/^<(\w+)/);
    if (!tagMatch) continue;
    
    const tagName = tagMatch[1];
    
    // Find the matching closing tag
    let depth = 1;
    let pos = elementStart;
    let tagStart = elementStart;
    
    // Skip to after the opening tag
    const openTagEnd = html.indexOf('>', match.index);
    if (openTagEnd === -1) continue;
    pos = openTagEnd + 1;
    
    while (depth > 0 && pos < html.length) {
      const nextTag = html.indexOf('<', pos);
      if (nextTag === -1) break;
      
      const tagContent = html.slice(nextTag + 1, html.indexOf('>', nextTag));
      if (tagContent.startsWith('/')) {
        // Closing tag
        const closingTagName = tagContent.slice(1).split(/\s/)[0];
        if (closingTagName.toLowerCase() === tagName.toLowerCase()) {
          depth--;
        }
      } else if (!tagContent.endsWith('/')) {
        // Opening tag (not self-closing)
        const openingTagName = tagContent.split(/\s/)[0];
        if (openingTagName.toLowerCase() === tagName.toLowerCase()) {
          depth++;
        }
      }
      
      pos = html.indexOf('>', nextTag) + 1;
    }
    
    if (depth === 0) {
      // Extract content between opening and closing tags
      const fullElement = html.slice(tagStart, pos);
      const contentStart = fullElement.indexOf('>') + 1;
      const contentEnd = fullElement.lastIndexOf('<');
      
      if (contentStart < contentEnd) {
        const content = fullElement.slice(contentStart, contentEnd);
        elements.push(content);
      }
    }
    
    // Move search position to avoid finding the same element again
    classPattern.lastIndex = pos;
  }
  
  return elements;
}

/**
 * Extract elements by tag and class using a more robust approach
 * @param {string} html - HTML content
 * @param {string} tagName - Tag name to search for
 * @param {string} className - Class name to match
 * @returns {Array} Array of inner HTML content
 */
function extractElementsByTagAndClass(html, tagName, className) {
  const elements = [];
  const regex = new RegExp(`<${tagName}[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>(.*?)<\\/${tagName}>`, 'gis');
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    elements.push(match[1]);
  }
  
  return elements;
}

/**
 * Main scraping function using plain HTML parsing
 * Now extracts embedded JSON data from the page for more reliable results
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
    
    // First try to extract from embedded JSON data (experimental)
    const jsonData = extractEmbeddedJSON(html, url);
    if (jsonData) {
      return jsonData;
    }
    
    // Use DOM parsing (primary method - very effective)
    console.log('Using DOM parsing for asset extraction');
    
    // Extract asset information from HTML using DOM parsing
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
 * Extract embedded JSON data from Unity Asset Store page
 * @param {string} html - The HTML content
 * @param {string} url - The original URL for ID extraction
 * @returns {Object|null} Parsed asset data or null if not found
 */
function extractEmbeddedJSON(html, url) {
  try {
    // Extract asset ID from URL
    const assetId = extractIdFromUrl(url);
    if (!assetId) {
      console.warn('Could not extract asset ID from URL:', url);
      return null;
    }
    
    // Look for the specific pattern: "assetId": { ... }
    // Use a more targeted approach to find the JSON block
    const startPattern = `"${assetId}": {`;
    const startIndex = html.indexOf(startPattern);
    
    if (startIndex === -1) {
      console.warn('Could not find asset JSON block for ID:', assetId);
      return null;
    }
    
    // Find the matching closing brace
    let braceCount = 0;
    let endIndex = startIndex + startPattern.length - 1; // Start at the opening brace
    let inString = false;
    let escaped = false;
    
    for (let i = endIndex; i < html.length; i++) {
      const char = html[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }
    
    if (braceCount !== 0) {
      console.warn('Could not find matching closing brace for JSON block');
      return null;
    }
    
    // Extract the JSON string
    const jsonStart = startIndex + `"${assetId}": `.length;
    const jsonString = html.substring(jsonStart, endIndex + 1);
    
    try {
      const assetData = JSON.parse(jsonString);
      
      // Transform the JSON data to our asset format
      const asset = {
        id: assetData.id || assetId,
        url: url,
        title: assetData.name || 'Unknown Title',
        short_description: assetData.elevatorPitch || '',
        long_description: cleanText(assetData.description || ''),
        tags: extractTagsFromJSON(assetData),
        category: extractCategoryFromUrl(url),
        price: parseFloat(assetData.originalPrice?.finalPrice || 0),
        images_count: assetData.images?.length || 0,
        videos_count: countVideosInImages(assetData.images || []),
        rating: assetData.rating?.average || null,
        reviews_count: assetData.rating?.count || assetData.reviewCount || 0,
        review_breakdown: {
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0
        },
        last_update: assetData.firstPublishedDate || null,
        publisher: 'Unknown Publisher', // Publisher info is referenced by ID, need to look it up separately
        size: formatFileSize(assetData.downloadSize),
        version: extractVersionFromSupportedVersions(assetData.supportedUnityVersions),
        favorites: null // Not available in this JSON structure
      };
      
      console.log('Successfully extracted asset data from embedded JSON');
      return asset;
      
    } catch (parseError) {
      console.warn('Failed to parse extracted JSON:', parseError.message);
      return null;
    }
    
  } catch (error) {
    console.warn('Error extracting embedded JSON:', error.message);
    return null;
  }
}

/**
 * Extract tags from JSON data structure
 */
function extractTagsFromJSON(assetData) {
  // Tags are referenced by ID, we'll need to extract them from the page or use a fallback
  // For now, return empty array since tag names aren't directly available
  return [];
}

/**
 * Count video entries in images array
 */
function countVideosInImages(images) {
  return images.filter(img => img.type === 'video' || img.type === 'youtube').length;
}

/**
 * Format file size from bytes to readable format
 */
function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) return null;
  
  const bytes = parseInt(sizeInBytes);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Extract version info from supported Unity versions
 */
function extractVersionFromSupportedVersions(versions) {
  if (!versions || versions.length === 0) return null;
  // Return the latest version
  return versions[versions.length - 1];
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
  
  return 'Unknown Title';
}

/**
 * Extract short description from HTML
 */
function extractShortDescription(html) {
  // Try Unity Asset Store specific class - look for _1rkJa elements
  const rkjaElements = getElementsByClassName(html, '_1rkJa');
  
  if (rkjaElements.length >= 2) {
    // First element is the short description (same logic as Puppeteer)
    const shortDesc = cleanText(rkjaElements[0]);
    if (shortDesc && shortDesc.length > 0) {
      return shortDesc;
    }
  } else if (rkjaElements.length === 1) {
    // Only one description found - leave short empty, use it for long description
    // (following Puppeteer logic)
    const content = cleanText(rkjaElements[0]);
    if (content && content.length <= 300) {
      return content;
    }
    return '';
  }
  
  return '';
}

/**
 * Extract long description from HTML
 */
function extractLongDescription(html) {
  // Try Unity Asset Store specific class - look for _1rkJa elements
  const rkjaElements = getElementsByClassName(html, '_1rkJa');
  
  if (rkjaElements.length >= 2) {
    // Second element is the long description (same logic as Puppeteer)
    const longDesc = cleanText(rkjaElements[1]);
    if (longDesc && longDesc.length > 0) {
      return longDesc;
    }
  } 
  if (rkjaElements.length === 1) {
    // Only one description found - use it as long description if substantial
    const content = cleanText(rkjaElements[0]);
    if (content && content.length > 100) {
      return content;
    }
  }
  
  // Try to find substantial div content that looks like descriptions
  const divMatches = html.match(/<div[^>]*class="[^"]*"[^>]*>([\s\S]{100,3000}?)<\/div>/g);
  if (divMatches) {
    for (const divMatch of divMatches) {
      const text = divMatch.replace(/<[^>]*>/g, '').trim();
      // Look for content that seems like asset descriptions
      // Be more specific - avoid generic Unity documentation
      if (text.length > 200 && 
          !text.toLowerCase().includes('built-in render pipeline') &&
          !text.toLowerCase().includes('universal render pipeline') &&
          !text.toLowerCase().includes('unity editor') &&
          (text.toLowerCase().includes('animate') ||
           text.toLowerCase().includes('tween') ||
           text.toLowerCase().includes('dotween') ||
           text.toLowerCase().includes('feature') ||
           text.toLowerCase().includes('asset') ||
           text.toLowerCase().includes('tool') ||
           text.toLowerCase().includes('script'))) {
        
        // Extract the content inside the div
        const contentMatch = divMatch.match(/<div[^>]*>([\s\S]*)<\/div>/);
        if (contentMatch) {
          const cleaned = cleanText(contentMatch[1]);
          if (cleaned.length > 200) {
            return cleaned;
          }
        }
      }
    }
  }
  
  // Try description-specific selectors
  const descPatterns = [
    /<[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/[^>]*>/is,
    /<[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/[^>]*>/is,
    /<[^>]*class="[^"]*details[^"]*"[^>]*>(.*?)<\/[^>]*>/is,
    /<section[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/is,
    /<article[^>]*>(.*?)<\/article>/is
  ];
  
  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match && match[1].trim().length > 100) {
      const cleaned = cleanText(match[1]);
      if (cleaned.length > 100) {
        return cleaned;
      }
    }
  }
  
  // Final fallback to short description
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
 * Enhanced to handle HTML content similar to Puppeteer scraper
 */
function cleanText(text) {
  if (!text) return '';
  
  return text
    // First handle HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Convert common HTML tags to meaningful text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>|<\/ul>/gi, '')
    .replace(/<ol[^>]*>|<\/ol>/gi, '')
    .replace(/<strong[^>]*>|<\/strong>/gi, '')
    .replace(/<b[^>]*>|<\/b>/gi, '')
    .replace(/<em[^>]*>|<\/em>/gi, '')
    .replace(/<i[^>]*>|<\/i>/gi, '')
    .replace(/<a[^>]*>|<\/a>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs
    .replace(/^\s+|\s+$/g, '') // Trim
    .replace(/\n\s+/g, '\n') // Remove leading spaces on new lines
    .trim();
}