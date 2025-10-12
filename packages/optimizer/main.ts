#!/usr/bin/env node
/**
 * UNITY ASSET OPTIMIZER — AI-POWERED CLI TOOL (v2.0)
 * 
 * A comprehensive optimization tool for Unity Asset Store listings that combines:
 * 1. Deterministic heuristic scoring (always works offline)
 * 2. AI-powered content suggestions (requires OpenAI API key)
 * 3. Competitive analysis via similarity matching
 * 4. Live web scraping capabilities
 * 
 * ARCHITECTURE (v2.0):
 * - Modular design with separate concerns
 * - Robust error handling and validation
 * - Structured logging and monitoring
 * - Performance optimizations
 * - Comprehensive configuration management
 * 
 * SCORING SYSTEM (0-100 points, normalized):
 * - Content (35 pts): Title, descriptions, structure, messaging
 * - Media (20 pts): Images, videos, visual demonstrations  
 * - Trust (19 pts): Ratings, reviews, update recency
 * - Findability (15 pts): SEO keywords, tags, pricing
 * 
 * Raw scores are normalized to a 0-100 scale for consistent grading.
 * Note: After removing performance grading, existing grading-rules.json files
 * should be regenerated using build-grading-rules command.
 * 
 * Requirements:
 *   npm i openai@^4
 *   export OPENAI_API_KEY=... (or pass --apiKey) [optional]
 *
 * Usage examples:
 *   node main.mjs grade --input data/asset.json --vocab data/vocab.json
 *   node main.mjs scrape --url https://assetstore.unity.com/packages/... --out data/asset.json
 *   node main.mjs optimize --input data/asset.json --vocab data/vocab.json --neighbors data/corpus.json --ai true
 *   node main.mjs optimize --url https://assetstore.unity.com/packages/... --ai true
 *   node main.mjs status
 */

import fs from 'fs/promises';
import { UnityAssetOptimizer } from './src/optimizer';
import { SetupValidator } from './src/utils/validation';
import { Builder } from './src/builder';
import type { Asset, BestSellerAsset } from './src/types';

// Simple logger interface for CLI output
interface SimpleLogger {
  error(message: string): void;
}

// CLI helpers
const args = process.argv.slice(2);
const cmd = args[0];

const getFlag = (name: string, def?: string): string | undefined => {
  const i = args.indexOf('--' + name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
};

const getBool = (name: string, def: boolean = false): boolean => {
  const v = getFlag(name, def ? 'true' : 'false');
  return String(v).toLowerCase() === 'true';
};

const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

/**
 * Simple logger implementation
 */
class SimpleLoggerImpl implements SimpleLogger {
  private debug: boolean;

  constructor(debug: boolean) {
    this.debug = debug;
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
  }
}

/**
 * Load and merge multiple corpus files or folders
 * @param corpusPaths - Comma-separated list of corpus file paths or folder paths
 * @returns Merged corpus array
 */
async function loadMultipleCorpusFiles(corpusPaths: string): Promise<Asset[]> {
  const paths = corpusPaths.split(',').map(p => p.trim());
  const optimizer = new UnityAssetOptimizer([]);
  
  let mergedCorpus: Asset[] = [];
  let totalFilesProcessed = 0;
  
  for (const path of paths) {
    try {
      // Check if path is a directory
      const stat = await fs.stat(path);
      
      if (stat.isDirectory()) {
        console.log(`Processing corpus folder: ${path}`);
        
        // Read all JSON files in the directory
        const files = await fs.readdir(path);
        const jsonFiles = files.filter(file => file.toLowerCase().endsWith('.json'));
        
        if (jsonFiles.length === 0) {
          console.warn(`No JSON files found in folder: ${path}`);
          continue;
        }
        
        for (const file of jsonFiles) {
          const filePath = path.endsWith('/') || path.endsWith('\\') ? path + file : path + '/' + file;
          try {
            console.log(`  Loading corpus file: ${filePath}`);
            const corpus = await optimizer.readJSON(filePath) as Asset[];
            
            if (!Array.isArray(corpus)) {
              console.warn(`  Skipping ${filePath}: not an array of assets`);
              continue;
            }
            
            mergedCorpus = mergedCorpus.concat(corpus);
            totalFilesProcessed++;
            console.log(`  Loaded ${corpus.length} assets from ${filePath}`);
          } catch (error) {
            console.warn(`  Failed to load ${filePath}: ${(error as Error).message}`);
          }
        }
        
        console.log(`Processed ${jsonFiles.length} files from folder ${path}`);
      } else {
        // Single file
        console.log(`Loading corpus file: ${path}`);
        const corpus = await optimizer.readJSON(path) as Asset[];
        
        if (!Array.isArray(corpus)) {
          throw new Error(`Corpus file ${path} must contain an array of assets`);
        }
        
        mergedCorpus = mergedCorpus.concat(corpus);
        totalFilesProcessed++;
        console.log(`Loaded ${corpus.length} assets from ${path}`);
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`Path not found: ${path}`);
      }
      throw new Error(`Failed to process corpus path ${path}: ${(error as Error).message}`);
    }
  }
  
  console.log(`Total corpus size: ${mergedCorpus.length} assets from ${totalFilesProcessed} files`);
  return mergedCorpus;
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`Unity Asset Optimizer v2.0 - AI-Powered CLI Tool

Commands:
  scrape       --url <Unity Asset Store URL> [--out <output.json>] [--method <graphql|fallback>]
               Extract asset data from Unity Asset Store listing
               Methods:
                 graphql: Official GraphQL API (fastest, most reliable)
                 fallback: Try graphql first, then other methods
               
  build-exemplars --corpus <corpus1.json,corpus2.json,...|folder1,folder2,...> --out <exemplars.json> [--top-n 20] [--top-percent 10] [--best-sellers <best_sellers.json>]
               Identify high-quality exemplar assets and extract patterns
               --best-sellers: JSON file containing list of Unity best seller assets (always included as exemplars)
               Use either --top-n (fixed number) or --top-percent (percentage of corpus)
               Supports multiple corpus files/folders separated by commas
               For folders: automatically loads all JSON files within
               
  build-grading-rules --exemplars <exemplars.json> --out <grading-rules.json>
               Generate dynamic grading rules from exemplar patterns
               Creates category-specific weights and thresholds based on successful assets
               
  build-exemplar-vocab --exemplars <exemplars.json> --out <vocab.json>
               Build vocabulary from exemplar patterns only
               
  generate-playbooks --exemplars <exemplars.json> --out <playbooks.json>
               Generate category playbooks from exemplar patterns
               
  categories-web --corpus <corpus1.json,corpus2.json,...|folder1,folder2,...> --exemplars <exemplars.json> --vocabulary <vocab.json> --out <categories-web.json>
               Generate category data optimized for web display (outputs multiple files with 10 categories each)
               Output files will be named: categories-web-1.json, categories-web-2.json, etc.
               Supports multiple corpus files/folders separated by commas
               For folders: automatically loads all JSON files within
               
  build-all    --corpus <corpus1.json,corpus2.json,...|folder1,folder2,...> [--out-dir <directory>] [--top-n 20] [--top-percent 10] [--best-sellers <best_sellers.json>]
               🚀 ONE-STOP COMMAND: Build exemplars, vocab, playbooks, and grading rules from corpus
               --best-sellers: JSON file containing list of Unity best seller assets (always included as exemplars)
               Use either --top-n (fixed number) or --top-percent (percentage of corpus)
               Supports multiple corpus files/folders separated by commas
               For folders: automatically loads all JSON files within
               
  build-all-multi-pass --corpus <corpus1.json,corpus2.json,...|folder1,folder2,...> [--out-dir <directory>] [--top-n 20] [--top-percent 10] [--best-sellers <best_sellers.json>] [--max-passes 5] [--convergence-threshold 0.95]
               🔄 ITERATIVE APPROACH: Multi-pass build that evolves grading rules until exemplar selection stabilizes
               --max-passes: Maximum number of iterations (default: 5, max: 20)
               --convergence-threshold: Stability threshold for exemplar overlap between passes (default: 0.95)
               Each pass uses grading rules from the previous pass to select better exemplars
               Continues until exemplar selection stabilizes or max passes reached
               Ideal for creating highly refined and stable exemplar sets
               
  grade        --input <asset.json> [--vocab <vocab.json>] [--rules <grading-rules.json>]
               Grade an asset using heuristic scoring
               --rules: Use dynamic grading rules (optional, falls back to static rules)
               
  optimize     [--input <asset.json> | --url <URL>] [options]
               Comprehensive optimization analysis
               Options:
                 --vocab <vocab.json>     Category vocabulary file
                 --exemplars <exemplars.json> Use exemplar coaching (recommended)
                 --neighbors <corpus.json> Similar assets corpus (legacy)
                 --ai <true|false>        Use AI suggestions (default: false)
                 --model <model-name>     OpenAI model (default: gpt-4o-mini)
                 --apiKey <key>           OpenAI API key (or use OPENAI_API_KEY env)
                 --out <output.json>      Save results to file
               
  status       Show system status and configuration
  
  help         Show this help message

Global Options:
  --debug              Enable debug logging
  --weights            Custom scoring weights (JSON string)
  --ignore-stop-words  Filter common stop words during text processing (default: true)
                       Set to false to include stop words like "the", "a", "and", etc.

Examples:
  # � ITERATIVE APPROACH: Multi-pass build for highly refined exemplars
  node main.mjs build-all-multi-pass --corpus data/packages.json --out-dir data/ --top-n 15
  node main.mjs build-all-multi-pass --corpus data/corpus-folder/ --out-dir data/ --top-n 15 --max-passes 7 --convergence-threshold 0.98
  node main.mjs build-all-multi-pass --corpus data/packages.json --out-dir data/ --top-n 15 --best-sellers data/unity_best_sellers.json --max-passes 10
  
  # �🚀 RECOMMENDED: One-stop exemplar ecosystem creation (single pass)
  node main.mjs build-all --corpus data/packages.json --out-dir data/ --top-n 15
  node main.mjs build-all --corpus data/corpus-folder/ --out-dir data/ --top-n 15 --best-sellers data/unity_best_sellers.json
  node main.mjs optimize --input asset.json --exemplars data/results/exemplars.json --vocab data/results/exemplar_vocab.json
  
  # Build exemplars with best sellers list
  node main.mjs build-exemplars --corpus data/corpus.json --out data/results/exemplars.json --top-n 25 --best-sellers data/unity_best_sellers.json
  node main.mjs build-exemplars --corpus data/corpus-folder/ --out data/results/exemplars.json --top-n 25
  
  # Generate dynamic grading rules from exemplars
  node main.mjs build-grading-rules --exemplars data/results/exemplars.json --out data/results/grading-rules.json
  
  # Grade with dynamic rules
  node main.mjs grade --input asset.json --vocab vocab.json --rules grading-rules.json
  
  # Multiple corpus files and folders (for large datasets)
  node main.mjs build-all --corpus "data/corpus1.json,data/corpus2.json,data/folder1/" --out-dir data/ --top-n 15
  node main.mjs build-all --corpus "data/corpus-files/,data/additional-data/" --out-dir data/ --top-n 15 --best-sellers data/unity_best_sellers.json
  
  # Traditional approach (individual commands for granular control)
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --out asset.json
  node main.mjs build-exemplars --corpus data/corpus.json --out data/eresults/xemplars.json --top-n 25
  node main.mjs build-exemplars --corpus "data/part1.json,data/part2.json,data/folder/" --out data/results/exemplars.json --top-percent 15
  
  # Best sellers format example (data/unity_best_sellers.json):
  # [
  #   {"title": "Best Asset 1", "url": "https://assetstore.unity.com/packages/...", "id": "12345"},
  #   {"title": "Best Asset 2", "url": "https://assetstore.unity.com/packages/...", "id": "67890"}
  # ]
  node main.mjs optimize --input asset.json --ai true
  
  # Scraping with different methods
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method fallback  # Recommended: try graphql, fallback to others
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method graphql   # Fastest: Official GraphQL API
  
  # Live optimization with AI
  node main.mjs optimize --url "https://assetstore.unity.com/packages/..." --ai true --model gpt-4o-mini
  
  # Disable stop word filtering (include words like "the", "a", "and")
  node main.mjs optimize --input asset.json --vocab vocab.json --ignore-stop-words false

Notes:
  - Corpus format: Array of asset objects with required fields OR folder containing JSON files
  - When using folders: all .json files in the folder will be automatically loaded
  - Asset format: Single asset object (same structure as corpus items)
  - AI features require OpenAI API key (set OPENAI_API_KEY environment variable)
  - Offline mode (heuristic only) works without internet or API keys
`);
}

/**
 * SCRAPE COMMAND: Extract asset data from Unity Asset Store URL
 */
async function cmdScrape(): Promise<void> {
  const url = getFlag('url');
  const outPath = getFlag('out', 'scraped_asset.json');
  
  ensure(!!url, '--url is required (Unity Asset Store URL)');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const asset = await optimizer.scrapeAssetWithGraphQL(url!, outPath);
  
  console.log(JSON.stringify({
    success: true,
    asset: {
      title: asset.title,
      category: asset.category,
      price: asset.price || 'Free',
      tags: (asset.tags || []).slice(0, 3),
      scraping_method: (asset as any).scraping_method || 'graphql',
      output_file: outPath
    }
  }, null, 2));
}

/**
 * BUILD-EXEMPLARS COMMAND: Identify exemplar assets and extract patterns
 */
async function cmdBuildExemplars(): Promise<void> {
  const corpusPaths = getFlag('corpus');
  const outPath = getFlag('out', 'exemplars.json');
  const topN = getFlag('top-n');
  const topPercent = getFlag('top-percent');
  const bestSellersPath = getFlag('best-sellers'); // New parameter
  
  ensure(!!corpusPaths, '--corpus path(s) required (comma-separated for multiple files/folders)');
  ensure(!!outPath, '--out path is required');
  ensure(!(topN && topPercent), 'Cannot specify both --top-n and --top-percent');
  
  // Default to top 20 if neither is specified
  const finalTopN = topN ? parseInt(topN) : (topPercent ? null : 20);
  const finalTopPercent = topPercent ? parseFloat(topPercent) : null;
  
  if (finalTopN !== null) {
    ensure(finalTopN > 0, '--top-n must be a positive number');
  }
  if (finalTopPercent !== null) {
    ensure(finalTopPercent > 0 && finalTopPercent <= 100, '--top-percent must be between 0 and 100');
  }
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  
  // Load corpus files
  const corpus = await loadMultipleCorpusFiles(corpusPaths!);
  
  // Load best sellers if provided
  let bestSellers: BestSellerAsset[] = [];
  if (bestSellersPath) {
    try {
      const bestSellersData = await fs.readFile(bestSellersPath, 'utf8');
      bestSellers = JSON.parse(bestSellersData) as BestSellerAsset[];
      console.log(`📌 Loaded ${bestSellers.length} best sellers from ${bestSellersPath}`);
    } catch (error) {
      console.error(`❌ Failed to load best sellers from ${bestSellersPath}:`, (error as Error).message);
      process.exit(1);
    }
  }
  
  const result = await builder.buildExemplarsFromCorpus(corpus, outPath!, finalTopN, finalTopPercent, bestSellers);
  
  console.log(JSON.stringify({
    success: true,
    exemplars: {
      ...result,
      total_assets_processed: corpus.length,
      best_sellers_provided: bestSellers.length,
      corpus_files: corpusPaths!.split(',').length
    },
    output_file: outPath
  }, null, 2));
}

/**
 * BUILD-GRADING-RULES COMMAND: Generate dynamic grading rules from exemplars
 */
async function cmdBuildGradingRules(): Promise<void> {
  const exemplarsPath = getFlag('exemplars');
  const outPath = getFlag('out', 'grading-rules.json');
  
  ensure(!!exemplarsPath, '--exemplars path is required');
  ensure(!!outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  const result = await builder.buildGradingRules(exemplarsPath!, outPath!);
  
  console.log(JSON.stringify({
    success: true,
    grading_rules: result,
    output_file: outPath
  }, null, 2));
}

/**
 * BUILD-EXEMPLAR-VOCAB COMMAND: Build vocabulary from exemplars only
 */
async function cmdBuildExemplarVocab(): Promise<void> {
  const exemplarsPath = getFlag('exemplars');
  const outPath = getFlag('out', 'exemplar_vocab.json');
  
  ensure(!!exemplarsPath, '--exemplars path is required');
  ensure(!!outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  const result = await builder.buildExemplarVocabulary(exemplarsPath!, outPath!);
  
  console.log(JSON.stringify({
    success: true,
    vocabulary: result,
    output_file: outPath
  }, null, 2));
}

/**
 * GENERATE-PLAYBOOKS COMMAND: Generate category playbooks from exemplars
 */
async function cmdGeneratePlaybooks(): Promise<void> {
  const exemplarsPath = getFlag('exemplars');
  const outPath = getFlag('out', 'playbooks.json');
  
  ensure(!!exemplarsPath, '--exemplars path is required');
  ensure(!!outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  const result = await builder.generatePlaybooks(exemplarsPath!, outPath!);
  
  console.log(JSON.stringify({
    success: true,
    playbooks: result,
    output_file: outPath
  }, null, 2));
}

/**
 * CATEGORIES-WEB COMMAND: Generate category data optimized for web display
 */
async function cmdCategoriesWeb(): Promise<void> {
  const corpusPaths = getFlag('corpus');
  const exemplarsPath = getFlag('exemplars');
  const vocabularyPath = getFlag('vocabulary');
  const outPath = getFlag('out', 'categories-web.json');
  
  ensure(!!corpusPaths, '--corpus path(s) required (comma-separated for multiple files/folders)');
  ensure(!!exemplarsPath, '--exemplars path is required');
  ensure(!!vocabularyPath, '--vocabulary path is required');
  ensure(!!outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  
  // Load corpus files (supports both files and directories)
  const corpus = await loadMultipleCorpusFiles(corpusPaths!);
  
  const result = await builder.generateCategoriesWeb(corpus, exemplarsPath!, vocabularyPath!, outPath!);
  
  console.log(JSON.stringify({
    success: true,
    categories_web: {
      categories: result.categories,
      totalCategories: result.totalCategories,
      filesCreated: result.filesCreated.length
    },
    corpus_assets_processed: corpus.length,
    output_files: result.filesCreated
  }, null, 2));
}

/**
 * BUILD-ALL COMMAND: One-stop command to build complete exemplar ecosystem
 * Creates exemplars, exemplar vocabulary, playbooks, and grading rules from a single corpus
 */
async function cmdBuildAll(): Promise<void> {
  const corpusPaths = getFlag('corpus');
  const outDir = getFlag('out-dir', 'data/');
  const topN = getFlag('top-n');
  const topPercent = getFlag('top-percent');
  const bestSellersPath = getFlag('best-sellers');
  
  ensure(!!corpusPaths, '--corpus path(s) required (comma-separated for multiple files/folders)');
  ensure(!(topN && topPercent), 'Cannot specify both --top-n and --top-percent');
  
  // Default to top 20 if neither is specified
  const finalTopN = topN ? parseInt(topN) : (topPercent ? null : 20);
  const finalTopPercent = topPercent ? parseFloat(topPercent) : null;
  
  if (finalTopN !== null) {
    ensure(finalTopN > 0, '--top-n must be a positive number');
  }
  if (finalTopPercent !== null) {
    ensure(finalTopPercent > 0 && finalTopPercent <= 100, '--top-percent must be between 0 and 100');
  }
  
  // Ensure output directory ends with slash
  const outputDir = outDir!.endsWith('/') || outDir!.endsWith('\\') ? outDir! : outDir! + '/';
  
  // Define output paths
  const exemplarsPath = outputDir + 'exemplars.json';
  const vocabPath = outputDir + 'exemplar_vocab.json';
  const playbooksPath = outputDir + 'playbooks.json';
  const gradingRulesPath = outputDir + 'grading-rules.json';
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  
  console.log('🚀 Building complete exemplar ecosystem...\n');
  
  try {
    // Load corpus files
    console.log('📁 Loading corpus files...');
    const corpus = await loadMultipleCorpusFiles(corpusPaths!);
    
    // Load best sellers if provided
    let bestSellers: BestSellerAsset[] = [];
    if (bestSellersPath) {
      try {
        const bestSellersData = await fs.readFile(bestSellersPath, 'utf8');
        bestSellers = JSON.parse(bestSellersData) as BestSellerAsset[];
        console.log(`📌 Loaded ${bestSellers.length} best sellers from ${bestSellersPath}`);
      } catch (error) {
        console.error(`❌ Failed to load best sellers from ${bestSellersPath}:`, (error as Error).message);
        process.exit(1);
      }
    }
    
    // Step 1: Build exemplars
    console.log('\n📊 Step 1/4: Identifying exemplar assets...');
    const exemplarStats = await builder.buildExemplarsFromCorpus(corpus, exemplarsPath, finalTopN, finalTopPercent, bestSellers);
    console.log(`✅ Exemplars built: ${exemplarStats.totalExemplars} assets across ${exemplarStats.categories} categories\n`);
    
    // Step 2: Build exemplar vocabulary
    console.log('📚 Step 2/4: Building exemplar-based vocabulary...');
    const vocabStats = await builder.buildExemplarVocabulary(exemplarsPath, vocabPath);
    console.log(`✅ Vocabulary built: ${vocabStats.categories} category vocabularies\n`);
    
    // Step 3: Generate playbooks
    console.log('📖 Step 3/4: Generating category playbooks...');
    const playbookStats = await builder.generatePlaybooks(exemplarsPath, playbooksPath);
    console.log(`✅ Playbooks generated: ${playbookStats.categories} category guides\n`);
    
    // Step 4: Build grading rules
    console.log('⚖️ Step 4/4: Building dynamic grading rules...');
    const gradingRulesStats = await builder.buildGradingRules(exemplarsPath, gradingRulesPath);
    console.log(`✅ Grading rules built: ${gradingRulesStats.categories} category-specific rule sets\n`);
    
    // Success summary
    const result = {
      success: true,
      summary: {
        corpus_files_processed: corpusPaths!.split(',').length,
        total_assets_processed: corpus.length,
        exemplars_per_category: finalTopN || `${finalTopPercent}%`,
        total_exemplars: exemplarStats.totalExemplars,
        total_categories: exemplarStats.categories,
        best_sellers_provided: bestSellers.length,
        output_directory: outputDir
      },
      files_created: {
        exemplars: exemplarsPath,
        vocabulary: vocabPath,
        playbooks: playbooksPath,
        grading_rules: gradingRulesPath
      },
      next_steps: [
        `Grade with dynamic rules: node main.mjs grade --input asset.json --vocab ${vocabPath} --rules ${gradingRulesPath}`,
        `Optimize with exemplars: node main.mjs optimize --input asset.json --exemplars ${exemplarsPath} --vocab ${vocabPath}`,
        `View category guidance: cat ${playbooksPath}`
      ]
    };
    
    console.log('🎉 Complete exemplar ecosystem with dynamic grading ready!\n');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(`❌ Build failed at step: ${(error as Error).message}`);
    console.log('\n💡 Try individual commands for debugging:');
    console.log(`  node main.mjs build-exemplars --corpus "${corpusPaths}" --out ${exemplarsPath} --debug true`);
    throw error;
  }
}

/**
 * BUILD-ALL-MULTI-PASS COMMAND: Iterative multi-pass build until convergence
 * Builds exemplars and grading rules iteratively until the exemplar selection stabilizes
 */
async function cmdBuildAllMultiPass(): Promise<void> {
  const corpusPaths = getFlag('corpus');
  const outDir = getFlag('out-dir', 'data/');
  const topN = getFlag('top-n');
  const topPercent = getFlag('top-percent');
  const bestSellersPath = getFlag('best-sellers');
  const maxPasses = parseInt(getFlag('max-passes', '5') || '5');
  const convergenceThreshold = parseFloat(getFlag('convergence-threshold', '0.95') || '0.95');
  
  ensure(!!corpusPaths, '--corpus path(s) required (comma-separated for multiple files/folders)');
  ensure(!(topN && topPercent), 'Cannot specify both --top-n and --top-percent');
  ensure(maxPasses > 0 && maxPasses <= 20, '--max-passes must be between 1 and 20');
  ensure(convergenceThreshold > 0 && convergenceThreshold <= 1, '--convergence-threshold must be between 0 and 1');
  
  // Default to top 20 if neither is specified
  const finalTopN = topN ? parseInt(topN) : (topPercent ? null : 20);
  const finalTopPercent = topPercent ? parseFloat(topPercent) : null;
  
  if (finalTopN !== null) {
    ensure(finalTopN > 0, '--top-n must be a positive number');
  }
  if (finalTopPercent !== null) {
    ensure(finalTopPercent > 0 && finalTopPercent <= 100, '--top-percent must be between 0 and 100');
  }
  
  // Ensure output directory ends with slash
  const outputDir = outDir!.endsWith('/') || outDir!.endsWith('\\') ? outDir! : outDir! + '/';
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const builder = new Builder(optimizer.config);
  
  console.log('🔄 Starting iterative multi-pass build until convergence...\n');
  
  try {
    // Load corpus files
    console.log('📁 Loading corpus files...');
    const corpus = await loadMultipleCorpusFiles(corpusPaths!);
    
    // Load best sellers if provided
    let bestSellers: BestSellerAsset[] = [];
    if (bestSellersPath) {
      try {
        const bestSellersData = await fs.readFile(bestSellersPath, 'utf8');
        bestSellers = JSON.parse(bestSellersData) as BestSellerAsset[];
        console.log(`📌 Loaded ${bestSellers.length} best sellers from ${bestSellersPath}`);
      } catch (error) {
        console.error(`❌ Failed to load best sellers from ${bestSellersPath}:`, (error as Error).message);
        process.exit(1);
      }
    }
    
    // Execute multi-pass build
    const result = await builder.buildAllMultiPass(
      corpus,
      outputDir!,
      finalTopN,
      finalTopPercent,
      bestSellers,
      maxPasses,
      convergenceThreshold
    );
    
    // Success summary
    const finalPass = result.passResults[result.passResults.length - 1];
    if (!finalPass) {
      throw new Error('No passes completed');
    }
    
    const successResult = {
      success: true,
      summary: {
        approach: 'multi-pass-iterative',
        corpus_files_processed: corpusPaths!.split(',').length,
        total_assets_processed: corpus.length,
        exemplars_per_category: finalTopN || `${finalTopPercent}%`,
        best_sellers_provided: bestSellers.length,
        output_directory: outputDir,
        convergence: {
          converged: result.converged,
          passes_completed: result.passes,
          max_passes_allowed: maxPasses,
          final_convergence_metric: result.convergenceMetric.toFixed(3),
          convergence_threshold: convergenceThreshold
        },
        final_results: {
          total_exemplars: finalPass.exemplarStats.totalExemplars,
          total_categories: finalPass.exemplarStats.categories,
          grading_rules_categories: finalPass.gradingRulesStats.categories
        }
      },
      pass_details: result.passResults.map(pass => ({
        pass: pass.pass,
        exemplars: pass.exemplarStats.totalExemplars,
        categories: pass.exemplarStats.categories,
        changes: pass.exemplarChanges ? {
          added: pass.exemplarChanges.added.length,
          removed: pass.exemplarChanges.removed.length,
          stability: `${((pass.exemplarChanges.unchanged.length / (pass.exemplarChanges.unchanged.length + pass.exemplarChanges.added.length + pass.exemplarChanges.removed.length)) * 100).toFixed(1)}%`
        } : 'initial-pass'
      })),
      files_created: result.finalFiles,
      next_steps: [
        `Grade with evolved rules: node main.mjs grade --input asset.json --vocab ${result.finalFiles.vocabulary} --rules ${result.finalFiles.gradingRules}`,
        `Optimize with stable exemplars: node main.mjs optimize --input asset.json --exemplars ${result.finalFiles.exemplars} --vocab ${result.finalFiles.vocabulary}`,
        `View evolved playbooks: cat ${result.finalFiles.playbooks}`
      ]
    };
    
    console.log(`🎯 Multi-pass build completed in ${result.passes} pass${result.passes > 1 ? 'es' : ''}!`);
    if (result.converged) {
      console.log(`✅ System converged with ${(result.convergenceMetric * 100).toFixed(1)}% stability\n`);
    } else {
      console.log(`⚠️ System did not fully converge (${(result.convergenceMetric * 100).toFixed(1)}% stability after ${result.passes} passes)\n`);
    }
    
    console.log(JSON.stringify(successResult, null, 2));
    
  } catch (error) {
    console.error(`❌ Multi-pass build failed: ${(error as Error).message}`);
    console.log('\n💡 Try single-pass build for debugging:');
    console.log(`  node main.mjs build-all --corpus "${corpusPaths}" --out-dir ${outputDir} --debug true`);
    throw error;
  }
}

/**
 * GRADE COMMAND: Score an asset
 */
async function cmdGrade(): Promise<void> {
  const inputPath = getFlag('input');
  const vocabPath = getFlag('vocab');
  const rulesPath = getFlag('rules'); // New parameter for dynamic rules
  
  ensure(!!inputPath, '--input path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const result = await optimizer.gradeAsset(inputPath!, vocabPath, rulesPath);
  
  console.log(JSON.stringify(result, null, 2));
}

/**
 * OPTIMIZE COMMAND: Comprehensive optimization analysis
 */
async function cmdOptimize(): Promise<void> {
  const input = getFlag('input');
  const url = getFlag('url');
  const vocabPath = getFlag('vocab');
  const exemplarsPath = getFlag('exemplars');
  const neighborsPath = getFlag('neighbors');
  const useAI = getBool('ai', false);
  const outPath = getFlag('out');
  
  ensure(!!(input || url), '--input asset json or --url is required');
  ensure(!(input && url), 'Cannot specify both --input and --url');
  
  const optimizer = new UnityAssetOptimizer(args);
  await SetupValidator.validateSetup(optimizer.config, optimizer.aiEngine, optimizer.logger);
  
  const result = await optimizer.optimizeAsset({
    input,
    url,
    vocabPath,
    exemplarsPath,
    neighborsPath,
    useAI
  });
  
  // Save to file if requested
  if (outPath) {
    await optimizer.writeJSON(outPath, result);
    (result as any).output_file = outPath;
  }
  
  console.log(JSON.stringify(result, null, 2));
}

/**
 * STATUS COMMAND: Show system status
 */
async function cmdStatus(): Promise<void> {
  const optimizer = new UnityAssetOptimizer(args);
  const status = await optimizer.getStatus();
  console.log(JSON.stringify(status, null, 2));
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const logger = new SimpleLoggerImpl(getBool('debug', false));
  
  try {
    switch (cmd) {
      case 'scrape':
        await cmdScrape();
        break;
      case 'build-exemplars':
        await cmdBuildExemplars();
        break;
      case 'build-grading-rules':
        await cmdBuildGradingRules();
        break;
      case 'build-exemplar-vocab':
        await cmdBuildExemplarVocab();
        break;
      case 'generate-playbooks':
        await cmdGeneratePlaybooks();
        break;
      case 'categories-web':
        await cmdCategoriesWeb();
        break;
      case 'build-all':
        await cmdBuildAll();
        break;
      case 'build-all-multi-pass':
        await cmdBuildAllMultiPass();
        break;
      case 'grade':
        await cmdGrade();
        break;
      case 'optimize':
        await cmdOptimize();
        break;
      case 'status':
        await cmdStatus();
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        if (!cmd) {
          showHelp();
        } else {
          logger.error(`Unknown command: ${cmd}`);
          console.log('\nRun "node main.mjs help" for usage information.');
          process.exit(1);
        }
    }
  } catch (error) {
    logger.error(`Error: ${(error as Error).message}`);
    if (getBool('debug', false)) {
      console.error((error as Error).stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();
