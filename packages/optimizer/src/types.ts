/**
 * @fileoverview TypeScript type definitions for Unity Asset Store assets
 */

/**
 * Rating data for an asset with count and star value
 */
export interface AssetRating {
  /** Number of ratings for this star value */
  count: string;
  /** Star rating value (1-5) */
  value: string;
}

/**
 * Main promotional images for an asset in various sizes
 */
export interface AssetMainImage {
  /** URL for large main image */
  big: string;
  /** URL for Facebook share image */
  facebook: string;
  /** URL for small main image */
  small: string;
  /** URL for icon image */
  icon: string;
  /** URL for 75px icon image */
  icon75: string;
}

/**
 * Screenshot image data for an asset
 */
export interface AssetImage {
  /** URL for full-size image */
  imageUrl: string;
  /** URL for thumbnail image */
  thumbnailUrl: string;
}

/**
 * Video data for an asset
 */
export interface AssetVideo
{
  imageUrl: string;
  thumbnailUrl: string;
}

/**
 * Complete Unity Asset Store asset data structure
 */
export interface Asset {
  /** Unique asset ID */
  id: string;
  /** Asset Store URL for this asset */
  url: string;
  /** Asset title/name */
  title: string;
  /** Brief description of the asset */
  short_description: string;
  /** Detailed HTML description of the asset */
  long_description: string;
  /** Array of tag strings describing the asset */
  tags: string[];
  /** Asset category (e.g., "Tools", "Templates", etc.) */
  category: string;
  /** Asset price in USD */
  price: number;
  /** Number of screenshot images */
  images_count: number;
  /** Number of video previews */
  videos_count: number;
  /** Array of rating objects with counts for each star value */
  rating: AssetRating[];
  /** Total number of reviews */
  reviews_count: number;
  /** Last update date string */
  last_update: string;
  /** Publisher/developer name */
  publisher: string;
  /** Asset package size (e.g., "2.3 MB") */
  size: string;
  /** Asset version string */
  version: string;
  /** Number of users who favorited this asset */
  favorites: number;
  /** Main promotional images in various sizes */
  mainImage: AssetMainImage;
  /** Array of screenshot images */
  images: AssetImage[];
  /** Array of video previews */
  videos: AssetVideo[];
}