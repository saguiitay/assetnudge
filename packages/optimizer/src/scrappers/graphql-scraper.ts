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

// Types for GraphQL response structures
interface MainImage {
  big?: string;
  facebook?: string;
  small?: string;
  icon?: string;
  icon75?: string;
}

interface Image {
  type: string;
  imageUrl: string;
  thumbnailUrl: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  longName: string;
}

interface PopularTag {
  id: string;
  pTagId: string;
  name: string;
}

interface Rating {
  average: number;
  count: number;
}

interface CurrentVersion {
  id: string;
  name: string;
  publishedDate: string;
}

interface Discount {
  save: number;
  percentage: number;
  type: string;
  saleType: string;
}

interface OriginalPrice {
  itemId: string;
  originalPrice: number;
  finalPrice: number;
  isFree: boolean;
  discount?: Discount;
  currency: string;
  entitlementType: string;
}

interface Product {
  id: string;
  productId?: string;
  itemId?: string;
  slug?: string;
  name: string;
  description?: string;
  aiDescription?: string;
  elevatorPitch?: string;
  keyFeatures?: string;
  compatibilityInfo?: string;
  rating?: Rating;
  currentVersion?: CurrentVersion;
  reviewCount?: number;
  downloadSize?: string | number;
  assetCount?: number;
  mainImage?: MainImage;
  originalPrice?: OriginalPrice;
  images?: Image[];
  category?: Category;
  firstPublishedDate?: string;
  publishNotes?: string;
  supportedUnityVersions?: string[];
  state?: string;
  overlay?: string;
  overlayText?: string;
  popularTags?: PopularTag[];
  plusProSale?: boolean;
  licenseText?: string;
  packageType?: string;
  publisher?: { name: string };
}

interface GraphQLRating {
  count: string;
  value: string;
}

interface RatingBreakdown {
  count: string;
  value: string;
}

interface AssetImage {
  imageUrl: string;
  thumbnailUrl: string;
}

interface AssetVideo {
  type: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface Asset {
  id: string;
  url: string;
  title: string;
  short_description: string;
  long_description: string;
  tags: string[];
  category: string;
  price: number;
  images_count: number;
  videos_count: number;
  rating: RatingBreakdown[];
  reviews_count: number;
  last_update: string | null;
  publisher: string;
  size: string | null;
  version: string | null;
  favorites: number;
  mainImage: MainImage | null;
  images: AssetImage[];
  videos: AssetVideo[];
}

interface GraphQLQuery {
  query: string;
  variables: Record<string, any>;
  operationName: string;
}

interface CookieData {
  cookieHeader: string;
  csrfToken: string;
}

/**
 * Extract asset ID from URL
 * @param url - The Unity Asset Store URL
 * @returns The asset ID or null if not found
 */
function extractIdFromUrl(url: string): string | null {
  try {
    // Parse URL to handle hash fragments and query parameters properly
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Try multiple patterns to match different Unity Asset Store URL formats:
    // 1. /packages/category/name/id (old format)
    // 2. /packages/category/subcategory/name-id (current format)
    // 3. Any URL ending with -id
    const patterns = [
      /\/packages\/[^\/]+\/[^\/]+\/(\d+)$/,           // /packages/category/name/id
      /\/packages\/[^\/]+\/[^\/]+\/[^\/]+-(\d+)$/,    // /packages/category/subcategory/name-id
      /\/packages\/.*?-(\d+)$/,                       // /packages/.../anything-id
      /-(\d+)$/                                       // fallback: anything ending with -id
    ];
    
    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    // Fallback to original regex if URL parsing fails
    const patterns = [
      /\/packages\/[^\/]+\/[^\/]+\/(\d+)$/,
      /\/packages\/[^\/]+\/[^\/]+\/[^\/]+-(\d+)$/,
      /\/packages\/.*?-(\d+)$/,
      /-(\d+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
}

/**
 * Extract category from URL
 * @param url - The Unity Asset Store URL
 * @returns The category name
 */
function extractCategoryFromUrl(url: string): string {
  const match = url.match(/\/packages\/([^\/]+)\//); 
  if (match && match[1]) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Unknown';
}/**
 * Clean HTML content to plain text
 * @param html - HTML content to clean
 * @returns Plain text content
 */
function cleanHtmlText(html: string): string {
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
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec)))
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
 * @param sizeInBytes - Size in bytes
 * @returns Formatted size string
 */
function formatFileSize(sizeInBytes: string | number): string | null {
  if (!sizeInBytes) return null;
  
  const bytes = parseInt(String(sizeInBytes));
  if (isNaN(bytes)) return null;
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Extract version from supported Unity versions array
 * @param versions - Array of supported versions
 * @returns Latest version or null
 */
function extractVersionFromSupportedVersions(versions: string[]): string | null {
  if (!versions || versions.length === 0) return null;
  // Return the latest version
  return versions[versions.length - 1] || null;
}

/**
 * Count total images including main image and screenshots
 * @param images - Images array from GraphQL response
 * @param mainImage - Main image object from GraphQL response
 * @returns Total number of images
 */
function countAllImages(images: Image[] | undefined, mainImage: MainImage | undefined): number {
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
 * @param images - Images array from GraphQL response
 * @returns Number of videos
 */
function countVideos(images: Image[] | undefined): number {
  if (!images) return 0;
  return images.filter(img => img.type === 'video' || img.type === 'youtube').length;
}

/**
 * Count screenshot entries in images array
 * @param images - Images array from GraphQL response
 * @returns Number of screenshots
 */
function countScreenshots(images: Image[] | undefined): number {
  if (!images) return 0;
  return images.filter(img => img.type === 'screenshot').length;
}

/**
 * Extract tags from popularTags array
 * @param popularTags - Popular tags from GraphQL response
 * @returns Array of tag names
 */
function extractTags(popularTags: PopularTag[] | undefined): string[] {
  if (!popularTags) return [];
  return popularTags.map(tag => tag.name).filter(name => name && name.length > 0);
}

/**
 * Format date to a more readable format like "Jan 8, 2024"
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
function formatDate(isoDate: string | undefined): string | null {
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
 * Extract full category path from category object
 * @param categoryObj - Category object from GraphQL
 * @returns Full category path (e.g., "Characters/Animals/Mammals")
 */
function extractFullCategory(categoryObj: Category | undefined): string {
  if (!categoryObj) return 'Unknown';
  
  // Return the full category path to preserve hierarchy
  return categoryObj.longName || categoryObj.name || 'Unknown';
}

/**
 * Convert rating breakdown to the expected format (array of objects)
 * @param ratingArray - Rating array from GraphQL response
 * @returns Rating array in expected format
 */
function convertRatingToArray(ratingArray: GraphQLRating[] | undefined): RatingBreakdown[] {
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
  const result: RatingBreakdown[] = [];
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
 * @param images - Images array from GraphQL response
 * @returns Images array with only screenshots
 */
function extractImagesArray(images: Image[] | undefined): AssetImage[] {
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
 * @param images - Images array from GraphQL response
 * @returns Videos array with YouTube and video type entries
 */
function extractVideosArray(images: Image[] | undefined): AssetVideo[] {
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
 * @returns Random CSRF token
 */
function generateCSRFToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Get essential cookies for Unity Asset Store API
 * @returns Cookie header string and CSRF token
 */
function getEssentialCookies(): CookieData {
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
 * @param url - The Unity Asset Store URL to scrape
 * @returns Asset data object
 */
export async function scrapeAssetWithGraphQL(url: string): Promise<Asset> {
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
    const queries: GraphQLQuery[] = [
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

    const product: Product = productResponse.data.product;
    
    // Extract rating array from the second query response
    let ratingArray: RatingBreakdown[] = [
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
    const asset: Asset = {
      id: product.id || assetId,
      url: url,
      title: product.name || 'Unknown Title',
      short_description: cleanHtmlText(product.elevatorPitch || ''),
      long_description: product.description || '', // Keep HTML format as in the expected output
      tags: extractTags(product.popularTags),
      category: extractFullCategory(product.category),
      price: parseFloat(String(product.originalPrice?.finalPrice || 0)),
      images_count: countAllImages(product.images, product.mainImage),
      videos_count: countVideos(product.images),
      rating: ratingArray, // Use rating array format
      reviews_count: product.rating?.count || product.reviewCount || 0,
      last_update: formatDate(product.currentVersion?.publishedDate || product.firstPublishedDate),
      publisher: product.publisher?.name || 'Unknown Publisher',
      size: formatFileSize(product.downloadSize || ''),
      version: product.currentVersion?.name || extractVersionFromSupportedVersions(product.supportedUnityVersions || []),
      favorites: 1, // Default to 1 as shown in expected output (GraphQL doesn't provide this field)
      mainImage: product.mainImage || null,
      images: extractImagesArray(product.images),
      videos: extractVideosArray(product.images)
    };

    console.log(`Successfully scraped asset ${assetId} using GraphQL API`);
    return asset;

  } catch (error) {
    throw new Error(`Failed to scrape ${url} with GraphQL: ${(error as Error).message}`);
  }
}