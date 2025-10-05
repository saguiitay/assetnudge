/**
 * Unity Asset Optimizer - Module Exports
 * Main entry point for programmatic use of the optimizer
 */

import UnityAssetOptimizer from './optimizer.mjs';
import Config from './config';
import { scrapeAssetWithGraphQL } from './scrappers/graphql-scraper';
import { Asset as ValidatorAsset, Vocabulary as ValidatorVocabulary, FileValidator } from './utils/validation';
import { GradeResult, Vocabulary as TypesVocabulary } from './types';

/**
 * Export Config class as OptimizerConfig for compatibility
 */
export class OptimizerConfig extends Config {}

/**
 * Scrape asset function wrapper (uses fallback strategy by default)
 */
export async function scrapeAsset(url: string, config: { debug?: boolean; apiKey?: string } | null = null) {
  // Convert config to args array if provided
  const args: string[] = [];
  if (config) {
    if (config.debug) args.push('--debug', 'true');
    if (config.apiKey) args.push('--apiKey', config.apiKey);
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  try {
    const asset = await optimizer.scrapeAssetWithGraphQL(url);
    return {
      success: true,
      asset: asset
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Scrape asset with GraphQL API (most reliable)
 */
export async function scrapeAssetWithGraphQLAPI(url: string, config: { debug?: boolean } | null = null) {
  const args: string[] = [];
  if (config) {
    if (config.debug) args.push('--debug', 'true');
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  try {
    const asset = await optimizer.scrapeAssetWithGraphQL(url);
    return {
      success: true,
      asset: asset,
      method: 'graphql' as const
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Grade asset function wrapper
 */
export async function gradeAsset(assetData: ValidatorAsset, vocabPath: string | null = null, config: { debug?: boolean } | null = null): Promise<{ grade: GradeResult }> {
  const args: string[] = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  // Load vocabulary if provided
  let vocabulary: TypesVocabulary = {};
  if (vocabPath) {
    vocabulary = await FileValidator.validateJSONFile(vocabPath);
  }
  
  // Grade the asset directly using the grader
  const grade = await optimizer.grader.gradeAsset(assetData, vocabulary);
  
  return { grade };
}

/**
 * Optimize asset function wrapper
 */
export async function optimizeAsset(options: any, config: { debug?: boolean } | null = null) {
  const args: string[] = [];
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
  scrapeAssetWithGraphQL
};

// Re-export types
export type { ValidatorAsset as Asset, TypesVocabulary as Vocabulary, GradeResult };