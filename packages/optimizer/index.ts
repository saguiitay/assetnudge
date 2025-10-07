/**
 * Unity Asset Optimizer - Module Exports
 * Main entry point for programmatic use of the optimizer
 */

import path from 'path';
import UnityAssetOptimizer from './src/optimizer';
import Config from './src/config';
import { scrapeAssetWithGraphQL, Asset as GraphQLAsset } from './src/scrappers/graphql-scraper';
import { Asset as ValidatorAsset, Vocabulary as ValidatorVocabulary, FileValidator } from './src/utils/validation';
import { GradeResult, Vocabulary as TypesVocabulary } from './src/types';
import { DynamicAssetGrader } from './src/dynamic-asset-grader';

/**
 * Export Config class as OptimizerConfig for compatibility
 */
export class OptimizerConfig extends Config {}

/**
 * Scrape asset function wrapper (uses fallback strategy by default)
 */
export async function scrapeAsset(url: string, config: { debug?: boolean; apiKey?: string } | null = null): Promise<{ success: true; asset: GraphQLAsset } | { success: false; error: string }> {
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
      asset: asset as any
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
export async function scrapeAssetWithGraphQLAPI(url: string, config: { debug?: boolean } | null = null): Promise<{ success: true; asset: GraphQLAsset; method: 'graphql' } | { success: false; error: string }> {
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
      asset: asset as any,
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
  
  // Try multiple possible locations for the data files
  const possibleDataDirs = [
    path.join(__dirname, 'data', 'results'), // Same directory as index.ts
    path.join(__dirname, '..', 'optimizer', 'data', 'results'), // Relative to packages dir
    path.join(process.cwd(), 'packages', 'optimizer', 'data', 'results'), // From monorepo root
    path.join(process.cwd(), 'data', 'results'), // From current working directory
    'data/results' // Relative path fallback
  ];
  
  // Find the correct data directory
  let dataDir: string = possibleDataDirs[0] || 'data/results'; // Default to first option or fallback
  for (const dir of possibleDataDirs) {
    try {
      const testPath = path.join(dir, 'grading-rules.json');
      await FileValidator.validateJSONFile(testPath);
      dataDir = dir;
      break;
    } catch {
      // Continue to next possible location
    }
  }
  
  const defaultVocabPath = vocabPath || path.join(dataDir, 'exemplar_vocab.json');
  const defaultRulesPath = path.join(dataDir, 'grading-rules.json');
  
  // Add default arguments as specified
  if (!vocabPath) {
    args.push('--vocab', defaultVocabPath);
  }
  args.push('--rules', defaultRulesPath);
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  // Load vocabulary
  let vocabulary: TypesVocabulary = {};
  try {
    vocabulary = await FileValidator.validateJSONFile(defaultVocabPath);
  } catch (error) {
    // If default vocab file doesn't exist, continue with empty vocabulary
    console.warn(`Warning: Could not load vocabulary from ${defaultVocabPath}: ${(error as Error).message}`);
  }
  
  // Load grading rules if available
  let gradingRules = null;
  try {
    gradingRules = await FileValidator.validateJSONFile(defaultRulesPath);
  } catch (error) {
    // If rules file doesn't exist, fall back to static grading
    console.warn(`Warning: Could not load grading rules from ${defaultRulesPath}, using static heuristics: ${(error as Error).message}`);
  }
  
  // Grade the asset
  let grade: GradeResult;
  if (gradingRules) {
    // Use dynamic grading rules if available
    const dynamicGrader = new DynamicAssetGrader(optimizer.config, gradingRules);
    grade = await dynamicGrader.gradeAsset(assetData, vocabulary);
  } else {
    // Fall back to static heuristic grading
    grade = await optimizer.grader.gradeAsset(assetData, vocabulary);
  }
  
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
export type { ValidatorAsset as Asset, GraphQLAsset as ScrapedAsset, TypesVocabulary as Vocabulary, GradeResult };