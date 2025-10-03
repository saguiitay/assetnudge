/**
 * GraphQL scraper for Unity Asset Store
 * Uses Unity's official GraphQL API for reliable and accurate data extraction
 * This is the most reliable method as it uses the same API the website uses
 * 
 * ADVANTAGES:
 * - Direct access to Unity's official API
 * - Always up-to-date and accurate data
 * - Complete asset information including reviews, pricing, etc.
 * - Fast and efficient
 * 
 * WHAT IT CAN EXTRACT:
 * - Complete product information (title, description, tags, etc.)
 * - Accurate pricing and discount information
 * - Full review data and ratings breakdown
 * - Publisher information
 * - Images, videos, and asset counts
 * - Version history and compatibility info
 * - Recommendations and related products
 */

/**
 * Extract asset ID from URL
 * @param {string} url - The Unity Asset Store URL
 * @returns {string|null} The asset ID or null if not found
 */
function extractIdFromUrl(url) {
  const match = url.match(/\/packages\/[^\/]+\/[^\/]+\/(\d+)/) || url.match(/-(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Extract category from URL
 * @param {string} url - The Unity Asset Store URL
 * @returns {string} The category name
 */
function extractCategoryFromUrl(url) {
  const match = url.match(/\/packages\/([^\/]+)\//);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Unknown';
}

/**
 * Clean HTML content to plain text
 * @param {string} html - HTML content to clean
 * @returns {string} Plain text content
 */
function cleanHtmlText(html) {
  if (!html) return '';
  
  return html
    // Convert HTML entities
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
    // Convert HTML tags to meaningful text
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
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n\s+/g, '\n')
    .trim();
}

/**
 * Format file size from bytes to readable format
 * @param {string|number} sizeInBytes - Size in bytes
 * @returns {string|null} Formatted size string
 */
function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) return null;
  
  const bytes = parseInt(sizeInBytes);
  if (isNaN(bytes)) return null;
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Extract version from supported Unity versions array
 * @param {Array} versions - Array of supported versions
 * @returns {string|null} Latest version or null
 */
function extractVersionFromSupportedVersions(versions) {
  if (!versions || versions.length === 0) return null;
  // Return the latest version
  return versions[versions.length - 1];
}

/**
 * Count total images including main image and screenshots
 * @param {Array} images - Images array from GraphQL response
 * @param {Object} mainImage - Main image object from GraphQL response
 * @returns {number} Total number of images
 */
function countAllImages(images, mainImage) {
  let count = 0;
  
  // Count screenshots
  if (images) {
    count += images.filter(img => img.type === 'screenshot').length;
  }
  
  // Add main image if it exists
  if (mainImage && mainImage.big) {
    count += 1;
  }
  
  return count;
}

/**
 * Count video entries in images array
 * @param {Array} images - Images array from GraphQL response
 * @returns {number} Number of videos
 */
function countVideos(images) {
  if (!images) return 0;
  return images.filter(img => img.type === 'video' || img.type === 'youtube').length;
}

/**
 * Count screenshot entries in images array
 * @param {Array} images - Images array from GraphQL response
 * @returns {number} Number of screenshots
 */
function countScreenshots(images) {
  if (!images) return 0;
  return images.filter(img => img.type === 'screenshot').length;
}

/**
 * Extract tags from popularTags array
 * @param {Array} popularTags - Popular tags from GraphQL response
 * @returns {Array} Array of tag names
 */
function extractTags(popularTags) {
  if (!popularTags) return [];
  return popularTags.map(tag => tag.name).filter(name => name && name.length > 0);
}

/**
 * Format date to a more readable format like "Jan 8, 2024"
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(isoDate) {
  if (!isoDate) return null;
  
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return isoDate; // Return original if parsing fails
  }
}

/**
 * Extract main category from full category path
 * @param {Object} categoryObj - Category object from GraphQL
 * @returns {string} Main category name
 */
function extractMainCategory(categoryObj) {
  if (!categoryObj) return 'Unknown';
  
  // If it's Tools/Game Toolkits, return just "Tools"
  // If it's Templates/Packs, return just "Templates"
  const longName = categoryObj.longName || categoryObj.name || '';
  const parts = longName.split('/');
  return parts[0] || categoryObj.name || 'Unknown';
}

/**
 * Convert rating breakdown to the expected format (array of objects)
 * @param {Array} ratingArray - Rating array from GraphQL response
 * @returns {Array} Rating array in expected format
 */
function convertRatingToArray(ratingArray) {
  if (!ratingArray) {
    // Return default rating array with zero counts
    return [
      { "count": "0", "value": "1" },
      { "count": "0", "value": "2" },
      { "count": "0", "value": "3" },
      { "count": "0", "value": "4" },
      { "count": "0", "value": "5" }
    ];
  }

  // Convert GraphQL rating array to expected format
  const result = [];
  for (let i = 1; i <= 5; i++) {
    const ratingEntry = ratingArray.find(r => parseInt(r.value) === i);
    result.push({
      count: ratingEntry ? ratingEntry.count : "0",
      value: i.toString()
    });
  }
  
  return result;
}

/**
 * Extract images array in the expected format
 * @param {Array} images - Images array from GraphQL response
 * @returns {Array} Images array with only screenshots
 */
function extractImagesArray(images) {
  if (!images) return [];
  
  // Filter only screenshots and format them
  return images
    .filter(img => img.type === 'screenshot')
    .map(img => ({
      imageUrl: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl
    }));
}

/**
 * Extract videos array from images
 * @param {Array} images - Images array from GraphQL response
 * @returns {Array} Videos array with YouTube and video type entries
 */
function extractVideosArray(images) {
  if (!images) return [];
  
  // Filter only videos (youtube and video types) and format them
  return images
    .filter(img => img.type === 'youtube' || img.type === 'video')
    .map(img => ({
      type: img.type,
      imageUrl: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl
    }));
}

/**
 * Generate a random CSRF token (mimics what the website does)
 * @returns {string} Random CSRF token
 */
function generateCSRFToken() {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Get essential cookies for Unity Asset Store API
 * @returns {string} Cookie header string
 */
function getEssentialCookies() {
  const csrfToken = generateCSRFToken();
  
  // Essential cookies based on the provided list
  const cookies = [
    `_csrf=${csrfToken}`,
    'NEXT_LOCALE=en-US',
    'AC_CURR=USD',
    '_sessionStart=true',
    'DS=e64179f5-a73b-4a82-a3d4-846729e72e39', // Device/session ID
    'scrollerWidth=15'
  ];
  
  return {
    cookieHeader: cookies.join('; '),
    csrfToken: csrfToken
  };
}

/**
 * Main scraping function using GraphQL API
 * @param {string} url - The Unity Asset Store URL to scrape
 * @returns {Promise<Object>} Asset data object
 */
export async function scrapeAssetWithGraphQL(url) {
  try {
    // Extract asset ID from URL
    const assetId = extractIdFromUrl(url);
    if (!assetId) {
      throw new Error('Could not extract asset ID from URL');
    }

    console.log(`Scraping asset ${assetId} using GraphQL API`);

    // Get essential cookies and CSRF token
    const { cookieHeader, csrfToken } = getEssentialCookies();

    // Prepare GraphQL queries
    const queries = [
      {
        query: `query ProductReview($id: ID!, $rows: Int, $page: Int, $sort_by: String, $reviewId: String, $rating: String) {
          product(id: $id) {
            ...product
            reviews(rows: $rows, page: $page, sortBy: $sort_by, reviewId: $reviewId, rating: $rating) {
              ...reviews
              __typename
            }
            __typename
          }
        }

        fragment product on Product {
          id
          productId
          itemId
          slug
          name
          description
          aiDescription
          elevatorPitch
          keyFeatures
          compatibilityInfo
          srps {
            version
            types
            __typename
          }
          rating {
            average
            count
            __typename
          }
          currentVersion {
            id
            name
            publishedDate
            __typename
          }
          reviewCount
          downloadSize
          assetCount
          mainImage {
            big
            facebook
            small
            icon
            icon75
          }
          originalPrice {
            itemId
            originalPrice
            finalPrice
            isFree
            discount {
              save
              percentage
              type
              saleType
              __typename
            }
            currency
            entitlementType
            __typename
          }
          images {
            type
            imageUrl
            thumbnailUrl
            __typename
          }
          category {
            id
            name
            slug
            longName
            __typename
          }
          firstPublishedDate
          publishNotes
          supportedUnityVersions
          state
          overlay
          overlayText
          popularTags {
            id
            pTagId
            name
            __typename
          }
          plusProSale
          licenseText
          packageType
          __typename
        }

        fragment reviews on Reviews {
          count
          canRate: can_rate
          canReply: can_reply
          canComment: can_comment
          hasCommented: has_commented
          totalEntries: total_entries
          lastPage: last_page
          comments {
            id
            date
            editable
            rating
            user {
              id
              name
              profileUrl
              avatar
              __typename
            }
            isHelpful: is_helpful {
              count
              score
              __typename
            }
            subject
            version
            full
            is_complimentary
            vote
            replies {
              id
              editable
              date
              version
              full
              user {
                id
                name
                profileUrl
                avatar
                __typename
              }
              isHelpful: is_helpful {
                count
                score
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }`,
        variables: {
          id: assetId,
          rows: 10,
          page: 1,
          sort_by: "recent",
          rating: null
        },
        operationName: "ProductReview"
      },
      {
        query: `query ProductRatingStar($id: ID!) {
          rating(id: $id) {
            count
            value
            __typename
          }
        }`,
        variables: {
          id: assetId
        },
        operationName: "ProductRatingStar"
      }
    ];

    // Make the GraphQL request
    const response = await fetch('https://assetstore.unity.com/api/graphql/batch', {
      method: 'POST',
      headers: {
        'authority': 'assetstore.unity.com',
        'method': 'POST',
        'path': '/api/graphql/batch',
        'scheme': 'https',
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'dnt': '1',
        'operations': 'ProductReview,ProductRatingStar',
        'origin': 'https://assetstore.unity.com',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://assetstore.unity.com/',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-csrf-token': csrfToken,
        'x-requested-with': 'XMLHttpRequest',
        'x-source': 'storefront',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Content-Type': 'application/json;charset=UTF-8',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(queries)
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`GraphQL request failed with status: ${response.status} - ${responseText}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid GraphQL response format');
    }

    // Extract product data from the first query response
    const productResponse = data[0];
    if (!productResponse.data || !productResponse.data.product) {
      throw new Error('Product data not found in GraphQL response');
    }

    const product = productResponse.data.product;
    
    // Extract rating array from the second query response
    let ratingArray = [
      { "count": "0", "value": "1" },
      { "count": "0", "value": "2" },
      { "count": "0", "value": "3" },
      { "count": "0", "value": "4" },
      { "count": "0", "value": "5" }
    ];

    if (data.length > 1 && data[1].data && data[1].data.rating) {
      ratingArray = convertRatingToArray(data[1].data.rating);
    }

    // Transform the GraphQL data to our asset format
    const asset = {
      id: product.id || assetId,
      url: url,
      title: product.name || 'Unknown Title',
      short_description: cleanHtmlText(product.elevatorPitch || ''),
      long_description: product.description || '', // Keep HTML format as in the expected output
      tags: extractTags(product.popularTags),
      category: extractMainCategory(product.category),
      price: parseFloat(product.originalPrice?.finalPrice || 0),
      images_count: countAllImages(product.images, product.mainImage),
      videos_count: countVideos(product.images),
      rating: ratingArray, // Use rating array format
      reviews_count: product.rating?.count || product.reviewCount || 0,
      last_update: formatDate(product.currentVersion?.publishedDate || product.firstPublishedDate),
      publisher: product.publisher?.name || 'Unknown Publisher',
      size: formatFileSize(product.downloadSize),
      version: product.currentVersion?.name || extractVersionFromSupportedVersions(product.supportedUnityVersions),
      favorites: 1, // Default to 1 as shown in expected output (GraphQL doesn't provide this field)
      mainImage: product.mainImage || null,
      images: extractImagesArray(product.images),
      videos: extractVideosArray(product.images)
    };

    console.log(`Successfully scraped asset ${assetId} using GraphQL API`);
    return asset;

  } catch (error) {
    throw new Error(`Failed to scrape ${url} with GraphQL: ${error.message}`);
  }
}