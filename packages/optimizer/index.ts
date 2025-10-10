/**
 * Unity Asset Optimizer - Module Exports
 * Main entry point for programmatic use of the optimizer
 */

import path from 'path';
import UnityAssetOptimizer from './src/optimizer';
import { SetupValidator } from './src/utils/validation';
import Config from './src/config';
import { scrapeAssetWithGraphQL } from './src/scrappers/graphql-scraper';
import { FileValidator } from './src/utils/validation';
import { Asset, GradeResult, Vocabulary as TypesVocabulary } from './src/types';
import { DynamicAssetGrader } from './src/dynamic-asset-grader';
import { findDataDirectory } from './src/utils/utils';
import { 
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
  buildTagsSystemPrompt,
  buildTagsUserPrompt,
  buildShortDescSystemPrompt,
  buildShortDescUserPrompt,
  buildLongDescSystemPrompt,
  buildLongDescUserPrompt
} from './src/prompts/index';

/**
 * Export Config class as OptimizerConfig for compatibility
 */
export class OptimizerConfig extends Config {}

/**
 * Scrape asset with GraphQL API (most reliable)
 */
export async function scrapeAsset(url: string, config: { debug?: boolean } | null = null): Promise<{ success: true; asset: Asset; method: 'graphql' } | { success: false; error: string }> {
  const args: string[] = [];
  if (config) {
    if (config.debug) args.push('--debug', 'true');
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
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
export async function gradeAsset(assetData: Asset, vocabPath: string | null = null, config: { debug?: boolean } | null = null): Promise<{ grade: GradeResult }> {
  const args: string[] = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  // Find the correct data directory
  const dataDir = await findDataDirectory('grading-rules.json');
  
  const defaultVocabPath = vocabPath || path.join(dataDir, 'exemplar_vocab.json');
  const defaultRulesPath = path.join(dataDir, 'grading-rules.json');
  
  // Add default arguments as specified
  if (!vocabPath) {
    args.push('--vocab', defaultVocabPath);
  }
  args.push('--rules', defaultRulesPath);
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
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
  
  // If no explicit file paths provided, try to resolve default locations
  if (!options.vocabPath || !options.exemplarsPath) {
    // Find the correct data directory
    const dataDir = await findDataDirectory('exemplars.json');

    // Set default paths if not provided
    if (!options.vocabPath) {
      options.vocabPath = path.join(dataDir, 'exemplar_vocab.json');
    }
    if (!options.exemplarsPath) {
      options.exemplarsPath = path.join(dataDir, 'exemplars.json');
    }
    
    if (config?.debug) {
      console.log(`Using default file paths: vocab=${options.vocabPath}, exemplars=${options.exemplarsPath}`);
    }
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  return optimizer.optimizeAsset(options);
}

/**
 * Suggest titles for an asset using exemplars, grading rules, AI, and heuristics
 */
export async function suggestTitleForAsset(
  asset: Asset,
  exemplarsPath?: string | null,
  gradingRulesPath?: string | null,
  vocab?: TypesVocabulary,
  config: { debug?: boolean } | null = null
): Promise<any[]> {
  const args: string[] = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  return optimizer.suggestTitleForAsset(asset, exemplarsPath, gradingRulesPath, vocab);
}

/**
 * Suggest tags for an asset using exemplars, grading rules, AI, and heuristics
 */
export async function suggestTagsForAsset(
  asset: Asset,
  exemplarsPath?: string | null,
  gradingRulesPath?: string | null,
  vocab?: TypesVocabulary,
  config: { debug?: boolean } | null = null
): Promise<any[]> {
  const args: string[] = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  return optimizer.suggestTagsForAsset(asset, exemplarsPath, gradingRulesPath, vocab);
}

/**
 * Suggest short description for an asset using exemplars, grading rules, AI, and heuristics
 */
export async function suggestShortDescriptionForAsset(
  asset: Asset,
  exemplarsPath?: string | null,
  gradingRulesPath?: string | null,
  vocab?: TypesVocabulary,
  config: { debug?: boolean } | null = null
): Promise<any> {
  const args: string[] = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  return optimizer.suggestShortDescriptionForAsset(asset, exemplarsPath, gradingRulesPath, vocab);
}

/**
 * Suggest long description for an asset using exemplars, grading rules, AI, and heuristics
 */
export async function suggestLongDescriptionForAsset(
  asset: Asset,
  exemplarsPath?: string | null,
  gradingRulesPath?: string | null,
  vocab?: TypesVocabulary,
  config: { debug?: boolean } | null = null
): Promise<any> {
  const args: string[] = [];
  if (config && config.debug) args.push('--debug', 'true');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  return optimizer.suggestLongDescriptionForAsset(asset, exemplarsPath, gradingRulesPath, vocab);
}

/**
 * Generate AI prompts for asset optimization fields
 * Loads context data (exemplars and vocabulary) from default file locations
 */
export async function generatePrompts(
  asset: Asset, 
  fieldType?: string,
  config: { debug?: boolean } | null = null
): Promise<{ success: true; prompts?: Record<string, string>; prompt?: string; fieldType?: string } | { success: false; error: string }> {
  try {
    // Validate asset has required fields
    if (!asset.title || !asset.category) {
      return {
        success: false,
        error: 'Asset must have at least title and category fields'
      };
    }

    // Find the correct data directory
    const dataDir = await findDataDirectory('exemplars.json');

    // Load context data from default file locations
    let categoryExemplars: any[] = [];
    let categoryVocab: any = {};
    
    // Try to load exemplars from default location
    try {
      const exemplarsPath = path.join(dataDir, 'exemplars.json');
      const exemplarsData = await FileValidator.validateJSONFile(exemplarsPath);
      categoryExemplars = exemplarsData?.exemplars?.[asset.category] || [];
      
      if (config?.debug) {
        console.log(`Loaded exemplars from ${exemplarsPath} for category ${asset.category}: ${categoryExemplars.length} items`);
      }
    } catch (error) {
      if (config?.debug) {
        console.warn('Failed to load exemplars:', (error as Error).message);
      }
      // Continue without exemplars
    }
    
    // Try to load vocabulary from default location
    try {
      const vocabularyPath = path.join(dataDir, 'exemplar_vocab.json');
      const vocabulary: TypesVocabulary = await FileValidator.validateJSONFile(vocabularyPath) as TypesVocabulary;
      categoryVocab = vocabulary[asset.category] || {};
      
      if (config?.debug) {
        console.log(`Loaded vocabulary from ${vocabularyPath} for category ${asset.category}: ${Object.keys(categoryVocab).length} terms`);
      }
    } catch (error) {
      if (config?.debug) {
        console.warn('Failed to load vocabulary:', (error as Error).message);
      }
      // Continue without vocabulary
    }

    // If specific field type requested, return that prompt only
    if (fieldType) {
      const validTypes = ['title', 'tags', 'short_description', 'long_description'];
      
      if (!validTypes.includes(fieldType)) {
        return {
          success: false,
          error: `Invalid field type. Must be one of: ${validTypes.join(', ')}`
        };
      }

      const combinedPrompt = generateFieldPrompt(fieldType, asset, categoryExemplars, categoryVocab);
      
      return {
        success: true,
        fieldType,
        prompt: combinedPrompt
      };
    }

    // Return all prompts
    const allPrompts = generateAllPrompts(asset, categoryExemplars, categoryVocab);

    return {
      success: true,
      prompts: allPrompts
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to generate prompts: ${(error as Error).message}`
    };
  }
}

/**
 * Helper function to generate combined prompt for a specific field type
 */
function generateFieldPrompt(
  fieldType: string, 
  asset: Asset, 
  exemplars: any[] = [], 
  vocab: any = {}
): string {
  let systemPrompt: string;
  let userPrompt: string;
  
  switch (fieldType) {
    case 'title':
      systemPrompt = buildTitleSystemPrompt();
      userPrompt = buildTitleUserPrompt(asset, exemplars, vocab);
      break;
    case 'tags':
      systemPrompt = buildTagsSystemPrompt();
      userPrompt = buildTagsUserPrompt(asset, exemplars, vocab);
      break;
    case 'short_description':
      systemPrompt = buildShortDescSystemPrompt();
      userPrompt = buildShortDescUserPrompt(asset, exemplars, vocab);
      break;
    case 'long_description':
      systemPrompt = buildLongDescSystemPrompt();
      userPrompt = buildLongDescUserPrompt(asset, exemplars, vocab);
      break;
    default:
      throw new Error(`Unsupported field type: ${fieldType}`);
  }
  
  return `${systemPrompt}\n\n---\n\n${userPrompt}`;
}

/**
 * Helper function to generate all combined prompts for an asset
 */
function generateAllPrompts(
  asset: Asset, 
  exemplars: any[] = [], 
  vocab: any = {}
): Record<string, string> {
  return {
    title: `${buildTitleSystemPrompt()}\n\n---\n\n${buildTitleUserPrompt(asset, exemplars, vocab)}`,
    tags: `${buildTagsSystemPrompt()}\n\n---\n\n${buildTagsUserPrompt(asset, exemplars, vocab)}`,
    short_description: `${buildShortDescSystemPrompt()}\n\n---\n\n${buildShortDescUserPrompt(asset, exemplars, vocab)}`,
    long_description: `${buildLongDescSystemPrompt()}\n\n---\n\n${buildLongDescUserPrompt(asset, exemplars, vocab)}`
  };
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
export type { TypesVocabulary as Vocabulary, GradeResult };