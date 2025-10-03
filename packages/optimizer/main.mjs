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
 * SCORING SYSTEM (0-100 points):
 * - Content (29 pts): Title, descriptions, structure, messaging
 * - Media (20 pts): Images, videos, visual demonstrations  
 * - Trust (15 pts): Ratings, reviews, update recency
 * - Findability (15 pts): SEO keywords, tags, pricing
 * - Performance (21 pts): Conversion rates, traffic quality
 * 
 * Requirements:
 *   npm i openai@^4
 *   export OPENAI_API_KEY=... (or pass --apiKey) [optional]
 *
 * Usage examples:
 *   node main.mjs build-vocab --corpus data/corpus.json --out data/vocab.json
 *   node main.mjs grade --input data/asset.json --vocab data/vocab.json
 *   node main.mjs scrape --url https://assetstore.unity.com/packages/... --out data/asset.json
 *   node main.mjs optimize --input data/asset.json --vocab data/vocab.json --neighbors data/corpus.json --ai true
 *   node main.mjs optimize --url https://assetstore.unity.com/packages/... --ai true
 *   node main.mjs status
 */

import UnityAssetOptimizer from './src/optimizer.mjs';
import { SimpleLogger } from './src/logger.mjs';

// CLI helpers
const args = process.argv.slice(2);
const cmd = args[0];

const getFlag = (name, def) => {
  const i = args.indexOf('--' + name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
};

const getBool = (name, def = false) => {
  const v = getFlag(name, def ? 'true' : 'false');
  return String(v).toLowerCase() === 'true';
};

const ensure = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

/**
 * Display help information
 */
function showHelp() {
  console.log(`Unity Asset Optimizer v2.0 - AI-Powered CLI Tool

Commands:
  scrape       --url <Unity Asset Store URL> [--out <output.json>] [--method <graphql|html|fallback>]
               Extract asset data from Unity Asset Store listing
               Methods:
                 graphql: Official GraphQL API (fastest, most reliable)
                 html: Lightweight HTML-only scraping (faster, no JavaScript)
                 fallback: Try graphql first, then html (default)
               
  build-vocab  --corpus <corpus.json> --out <vocab.json>
               Build category vocabulary from corpus data
               
  build-exemplars --corpus <corpus.json> --out <exemplars.json> [--top-n 20] [--top-percent 10]
               Identify high-quality exemplar assets and extract patterns
               Use either --top-n (fixed number) or --top-percent (percentage of corpus)
               
  build-exemplar-vocab --exemplars <exemplars.json> --out <vocab.json>
               Build vocabulary from exemplar patterns only
               
  generate-playbooks --exemplars <exemplars.json> --out <playbooks.json>
               Generate category playbooks from exemplar patterns
               
  build-all    --corpus <corpus.json> [--out-dir <directory>] [--top-n 20] [--top-percent 10]
               🚀 ONE-STOP COMMAND: Build exemplars, vocab, and playbooks from corpus
               Use either --top-n (fixed number) or --top-percent (percentage of corpus)
               
  grade        --input <asset.json> [--vocab <vocab.json>]
               Grade an asset using heuristic scoring
               
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
               
  batch        --assets <assets.json> [--vocab <vocab.json>] [--corpus <corpus.json>]
               Process multiple assets in batch
               
  status       Show system status and configuration
  
  help         Show this help message

Global Options:
  --debug              Enable debug logging
  --weights            Custom scoring weights (JSON string)
  --ignore-stop-words  Filter common stop words during text processing (default: true)
                       Set to false to include stop words like "the", "a", "and", etc.

Examples:
  # 🚀 RECOMMENDED: One-stop exemplar ecosystem creation
  node main.mjs build-all --corpus data/packages.json --out-dir data/ --top-n 15
  node main.mjs optimize --input asset.json --exemplars data/exemplars.json --vocab data/exemplar_vocab.json
  
  # Traditional approach (individual commands for granular control)
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --out asset.json
  node main.mjs build-exemplars --corpus data/corpus.json --out data/exemplars.json --top-n 25
  node main.mjs build-exemplars --corpus data/corpus.json --out data/exemplars.json --top-percent 15
  node main.mjs optimize --input asset.json --ai true
  
  # Scraping with different methods
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method fallback  # Recommended: try graphql, fallback to others
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method graphql   # Fastest: Official GraphQL API
  node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method html     # Fast: HTML-only scraping
  
  # Live optimization with AI
  node main.mjs optimize --url "https://assetstore.unity.com/packages/..." --ai true --model gpt-4o-mini
  
  # Disable stop word filtering (include words like "the", "a", "and")
  node main.mjs build-vocab --corpus data/corpus.json --out vocab.json --ignore-stop-words false
  node main.mjs optimize --input asset.json --vocab vocab.json --ignore-stop-words false

Notes:
  - Corpus format: Array of asset objects with required fields
  - Asset format: Single asset object (same structure as corpus items)
  - AI features require OpenAI API key (set OPENAI_API_KEY environment variable)
  - Offline mode (heuristic only) works without internet or API keys
`);
}

/**
 * SCRAPE COMMAND: Extract asset data from Unity Asset Store URL
 */
async function cmdScrape() {
  const url = getFlag('url');
  const outPath = getFlag('out', 'scraped_asset.json');
  const method = getFlag('method', 'fallback'); // Default to fallback for reliability
  
  ensure(url, '--url is required (Unity Asset Store URL)');
  ensure(['graphql', 'html', 'fallback'].includes(method), '--method must be one of: graphql, html, fallback');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  let asset;
  switch (method) {
    case 'graphql':
      asset = await optimizer.scrapeAssetWithGraphQL(url, outPath);
      break;
    case 'html':
      asset = await optimizer.scrapeAssetWithHTML(url, outPath);
      break;
    case 'fallback':
    default:
      asset = await optimizer.scrapeAssetWithFallback(url, outPath);
      break;
  }
  
  console.log(JSON.stringify({
    success: true,
    asset: {
      title: asset.title,
      category: asset.category,
      price: asset.price || 'Free',
      tags: (asset.tags || []).slice(0, 3),
      scraping_method: asset.scraping_method || method,
      output_file: outPath
    }
  }, null, 2));
}

/**
 * BUILD-VOCAB COMMAND: Create vocabulary from corpus
 */
async function cmdBuildVocab() {
  const corpusPath = getFlag('corpus');
  const outPath = getFlag('out', 'vocab.json');
  
  ensure(corpusPath, '--corpus path is required');
  ensure(outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  const vocabulary = await optimizer.buildVocabulary(corpusPath, outPath);
  
  console.log(JSON.stringify({
    success: true,
    vocabulary: {
      categories: Object.keys(vocabulary).length,
      output_file: outPath,
      category_summary: Object.entries(vocabulary).map(([cat, stats]) => ({
        category: cat,
        sample_size: stats.sample_size,
        avg_title_length: Math.round(stats.title_length.mean || 0),
        avg_description_words: Math.round(stats.word_count_long.mean || 0)
      }))
    }
  }, null, 2));
}

/**
 * BUILD-EXEMPLARS COMMAND: Identify exemplar assets and extract patterns
 */
async function cmdBuildExemplars() {
  const corpusPath = getFlag('corpus');
  const outPath = getFlag('out', 'exemplars.json');
  const topN = getFlag('top-n');
  const topPercent = getFlag('top-percent');
  
  ensure(corpusPath, '--corpus path is required');
  ensure(outPath, '--out path is required');
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
  await optimizer.validateSetup();
  
  const result = await optimizer.buildExemplars(corpusPath, outPath, finalTopN, finalTopPercent);
  
  console.log(JSON.stringify({
    success: true,
    exemplars: result,
    output_file: outPath
  }, null, 2));
}

/**
 * BUILD-EXEMPLAR-VOCAB COMMAND: Build vocabulary from exemplars only
 */
async function cmdBuildExemplarVocab() {
  const exemplarsPath = getFlag('exemplars');
  const outPath = getFlag('out', 'exemplar_vocab.json');
  
  ensure(exemplarsPath, '--exemplars path is required');
  ensure(outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  const result = await optimizer.buildExemplarVocabulary(exemplarsPath, outPath);
  
  console.log(JSON.stringify({
    success: true,
    vocabulary: result,
    output_file: outPath
  }, null, 2));
}

/**
 * GENERATE-PLAYBOOKS COMMAND: Generate category playbooks from exemplars
 */
async function cmdGeneratePlaybooks() {
  const exemplarsPath = getFlag('exemplars');
  const outPath = getFlag('out', 'playbooks.json');
  
  ensure(exemplarsPath, '--exemplars path is required');
  ensure(outPath, '--out path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  const result = await optimizer.generatePlaybooks(exemplarsPath, outPath);
  
  console.log(JSON.stringify({
    success: true,
    playbooks: result,
    output_file: outPath
  }, null, 2));
}

/**
 * BUILD-ALL COMMAND: One-stop command to build complete exemplar ecosystem
 * Creates exemplars, exemplar vocabulary, and playbooks from a single corpus
 */
async function cmdBuildAll() {
  const corpusPath = getFlag('corpus');
  const outDir = getFlag('out-dir', 'data/');
  const topN = getFlag('top-n');
  const topPercent = getFlag('top-percent');
  
  ensure(corpusPath, '--corpus path is required');
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
  const outputDir = outDir.endsWith('/') || outDir.endsWith('\\') ? outDir : outDir + '/';
  
  // Define output paths
  const exemplarsPath = outputDir + 'exemplars.json';
  const vocabPath = outputDir + 'exemplar_vocab.json';
  const playbooksPath = outputDir + 'playbooks.json';
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  console.log('🚀 Building complete exemplar ecosystem...\n');
  
  try {
    // Step 1: Build exemplars
    console.log('📊 Step 1/3: Identifying exemplar assets...');
    const exemplarStats = await optimizer.buildExemplars(corpusPath, exemplarsPath, finalTopN, finalTopPercent);
    console.log(`✅ Exemplars built: ${exemplarStats.totalExemplars} assets across ${exemplarStats.totalCategories} categories\n`);
    
    // Step 2: Build exemplar vocabulary
    console.log('📚 Step 2/3: Building exemplar-based vocabulary...');
    const vocabStats = await optimizer.buildExemplarVocabulary(exemplarsPath, vocabPath);
    console.log(`✅ Vocabulary built: ${vocabStats.categories} category vocabularies\n`);
    
    // Step 3: Generate playbooks
    console.log('📖 Step 3/3: Generating category playbooks...');
    const playbookStats = await optimizer.generatePlaybooks(exemplarsPath, playbooksPath);
    console.log(`✅ Playbooks generated: ${playbookStats.categories} category guides\n`);
    
    // Success summary
    const result = {
      success: true,
      summary: {
        corpus_processed: corpusPath,
        exemplars_per_category: finalTopN || `${finalTopPercent}%`,
        total_exemplars: exemplarStats.totalExemplars,
        total_categories: exemplarStats.totalCategories,
        output_directory: outputDir
      },
      files_created: {
        exemplars: exemplarsPath,
        vocabulary: vocabPath,
        playbooks: playbooksPath
      },
      next_steps: [
        `Grade assets: node main.mjs grade --input asset.json --vocab ${vocabPath}`,
        `Optimize with exemplars: node main.mjs optimize --input asset.json --exemplars ${exemplarsPath} --vocab ${vocabPath}`,
        `View category guidance: cat ${playbooksPath}`
      ]
    };
    
    console.log('🎉 Complete exemplar ecosystem ready!\n');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(`❌ Build failed at step: ${error.message}`);
    console.log('\n💡 Try individual commands for debugging:');
    console.log(`  node main.mjs build-exemplars --corpus ${corpusPath} --out ${exemplarsPath} --debug true`);
    throw error;
  }
}

/**
 * GRADE COMMAND: Score an asset
 */
async function cmdGrade() {
  const input = getFlag('input');
  const vocabPath = getFlag('vocab');
  
  ensure(input, '--input asset json is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  const result = await optimizer.gradeAsset(input, vocabPath);
  
  console.log(JSON.stringify(result, null, 2));
}

/**
 * OPTIMIZE COMMAND: Comprehensive optimization analysis
 */
async function cmdOptimize() {
  const input = getFlag('input');
  const url = getFlag('url');
  const vocabPath = getFlag('vocab');
  const exemplarsPath = getFlag('exemplars');
  const neighborsPath = getFlag('neighbors');
  const useAI = getBool('ai', false);
  const outPath = getFlag('out');
  
  ensure(input || url, '--input asset json or --url is required');
  ensure(!(input && url), 'Cannot specify both --input and --url');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
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
    result.output_file = outPath;
  }
  
  console.log(JSON.stringify(result, null, 2));
}

/**
 * BATCH COMMAND: Process multiple assets
 */
async function cmdBatch() {
  const assetsPath = getFlag('assets');
  const vocabPath = getFlag('vocab');
  const corpusPath = getFlag('corpus');
  const outPath = getFlag('out', 'batch_results.json');
  
  ensure(assetsPath, '--assets path is required');
  
  const optimizer = new UnityAssetOptimizer(args);
  await optimizer.validateSetup();
  
  // Load data
  const assets = await optimizer.readJSON(assetsPath);
  const vocabulary = vocabPath ? await optimizer.readJSON(vocabPath) : {};
  const corpus = corpusPath ? await optimizer.readJSON(corpusPath) : [];
  
  const results = await optimizer.batchOptimize(assets, vocabulary, corpus);
  
  // Save results
  await optimizer.writeJSON(outPath, {
    batch_results: results,
    summary: {
      total_assets: assets.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      processed_at: new Date().toISOString()
    }
  });
  
  console.log(JSON.stringify({
    success: true,
    summary: {
      total_assets: assets.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      output_file: outPath
    }
  }, null, 2));
}

/**
 * STATUS COMMAND: Show system status
 */
async function cmdStatus() {
  const optimizer = new UnityAssetOptimizer(args);
  const status = await optimizer.getStatus();
  console.log(JSON.stringify(status, null, 2));
}

/**
 * Main execution
 */
async function main() {
  const logger = new SimpleLogger(getBool('debug', false));
  
  try {
    switch (cmd) {
      case 'scrape':
        await cmdScrape();
        break;
      case 'build-vocab':
        await cmdBuildVocab();
        break;
      case 'build-exemplars':
        await cmdBuildExemplars();
        break;
      case 'build-exemplar-vocab':
        await cmdBuildExemplarVocab();
        break;
      case 'generate-playbooks':
        await cmdGeneratePlaybooks();
        break;
      case 'build-all':
        await cmdBuildAll();
        break;
      case 'grade':
        await cmdGrade();
        break;
      case 'optimize':
        await cmdOptimize();
        break;
      case 'batch':
        await cmdBatch();
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
    logger.error(`Error: ${error.message}`);
    if (getBool('debug', false)) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();