/**
 * Unity Asset Optimizer - Module Exports
 * Main entry point for programmatic use of the optimizer
 */

import UnityAssetOptimizer from './src/optimizer.mjs';
import Config from './src/config.mjs';
import { scrapeAssetWithPuppeteer } from './src/puppeteer-scraper.mjs';
import { scrapeAssetWithHTML } from './src/html-scraper.mjs';

/**
 * Export Config class as OptimizerConfig for compatibility
 */
export class OptimizerConfig extends Config {}

/**
 * Scrape asset function wrapper (uses fallback strategy by default)
 */
export async function scrapeAsset(url, config = null) {
  // Convert config to args array if provided
  const args = [];
  if (config) {
    if (config.debug) args.push('--debug', 'true');
    if (config.apiKey) args.push('--apiKey', config.apiKey);
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  try {
    const asset = await optimizer.scrapeAssetWithFallback(url);
    return {
      success: true,
      asset: asset
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Scrape asset with Puppeteer (full-featured)
 */
export async function scrapeAssetWithPuppeteerAPI(url, config = null) {
  const args = [];
  if (config) {
    if (config.debug) args.push('--debug', 'true');
    if (config.apiKey) args.push('--apiKey', config.apiKey);
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  try {
    const asset = await optimizer.scrapeAsset(url);
    return {
      success: true,
      asset: asset,
      method: 'puppeteer'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Scrape asset with HTML parser (lightweight)
 */
export async function scrapeAssetWithHTMLAPI(url, config = null) {
  const args = [];
  if (config) {
    if (config.debug) args.push('--debug', 'true');
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  try {
    const asset = await optimizer.scrapeAssetWithHTML(url);
    return {
      success: true,
      asset: asset,
      method: 'html'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Grade asset function wrapper
 */
export async function gradeAsset(assetData, vocabPath = null, config = null) {
  const args = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  return optimizer.gradeAsset(assetData, vocabPath);
}

/**
 * Optimize asset function wrapper
 */
export async function optimizeAsset(options, config = null) {
  const args = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  return optimizer.optimizeAsset(options);
}

// Export the main class as default
export { UnityAssetOptimizer as default };

// Named exports for convenience
export { 
  UnityAssetOptimizer, 
  Config,
  scrapeAssetWithPuppeteer,
  scrapeAssetWithHTML
};