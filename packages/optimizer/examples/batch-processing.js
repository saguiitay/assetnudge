/**
 * Batch Processing Example
 * 
 * Shows how to process multiple assets efficiently using the optimizer
 */

import { 
  gradeAsset, 
  optimizeAsset, 
  buildVocabulary, 
  OptimizerConfig 
} from 'unity-asset-optimizer';
import fs from 'fs/promises';

// Configuration for batch processing
const BATCH_CONFIG = new OptimizerConfig({
  debug: false,
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Process multiple assets for grading
 */
export async function batchGradeAssets(assets, vocabulary = {}) {
  console.log(`Starting batch grading for ${assets.length} assets...`);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    console.log(`Processing ${i + 1}/${assets.length}: ${asset.title}`);
    
    try {
      const result = await gradeAsset(asset, vocabulary, BATCH_CONFIG);
      
      results.push({
        index: i,
        title: asset.title,
        success: result.success,
        grade: result.success ? result.grade : null,
        error: result.success ? null : result.error,
        processed_at: new Date().toISOString()
      });
      
    } catch (error) {
      results.push({
        index: i,
        title: asset.title,
        success: false,
        grade: null,
        error: error.message,
        processed_at: new Date().toISOString()
      });
    }
    
    // Add small delay to prevent overwhelming the system
    if (i < assets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const summary = {
    total_assets: assets.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    processing_time_seconds: duration,
    average_time_per_asset: duration / assets.length
  };
  
  console.log('Batch grading completed:', summary);
  
  return {
    results,
    summary
  };
}

/**
 * Process multiple assets for optimization
 */
export async function batchOptimizeAssets(assets, options = {}) {
  const {
    vocabulary = {},
    exemplars = null,
    useAI = false,
    maxConcurrent = 3 // Limit concurrent processing
  } = options;
  
  console.log(`Starting batch optimization for ${assets.length} assets...`);
  console.log(`AI enabled: ${useAI}, Max concurrent: ${maxConcurrent}`);
  
  const results = [];
  const startTime = Date.now();
  
  // Process assets in chunks to control concurrency
  for (let i = 0; i < assets.length; i += maxConcurrent) {
    const chunk = assets.slice(i, i + maxConcurrent);
    console.log(`Processing chunk ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(assets.length / maxConcurrent)}`);
    
    const chunkPromises = chunk.map(async (asset, chunkIndex) => {
      const globalIndex = i + chunkIndex;
      
      try {
        const result = await optimizeAsset({
          asset,
          vocabulary,
          exemplars,
          useAI,
          config: BATCH_CONFIG
        });
        
        return {
          index: globalIndex,
          title: asset.title,
          success: result.success,
          grade: result.success ? result.grade : null,
          suggestions: result.success ? result.analysis?.suggestions : null,
          ai_suggestions: result.success ? result.analysis?.ai_suggestions : null,
          error: result.success ? null : result.error,
          processed_at: new Date().toISOString()
        };
        
      } catch (error) {
        return {
          index: globalIndex,
          title: asset.title,
          success: false,
          grade: null,
          suggestions: null,
          ai_suggestions: null,
          error: error.message,
          processed_at: new Date().toISOString()
        };
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Log progress
    console.log(`Completed ${results.length}/${assets.length} assets`);
    
    // Add delay between chunks to be respectful to APIs
    if (i + maxConcurrent < assets.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const summary = {
    total_assets: assets.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    processing_time_seconds: duration,
    average_time_per_asset: duration / assets.length,
    ai_enabled: useAI,
    max_concurrent: maxConcurrent
  };
  
  console.log('Batch optimization completed:', summary);
  
  return {
    results,
    summary
  };
}

/**
 * Build comprehensive analysis from corpus
 */
export async function buildCompleteAnalysis(corpusFilePath, outputDir = './output') {
  console.log('Building complete analysis from corpus...');
  
  try {
    // Load corpus
    const corpusData = JSON.parse(await fs.readFile(corpusFilePath, 'utf8'));
    console.log(`Loaded corpus with ${corpusData.length} assets`);
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // 1. Build vocabulary
    console.log('Building vocabulary...');
    const vocabResult = await buildVocabulary(corpusData, BATCH_CONFIG);
    if (!vocabResult.success) {
      throw new Error('Failed to build vocabulary: ' + vocabResult.error);
    }
    
    const vocabPath = `${outputDir}/vocabulary.json`;
    await fs.writeFile(vocabPath, JSON.stringify(vocabResult.vocabulary, null, 2));
    console.log(`Vocabulary saved to ${vocabPath}`);
    
    // 2. Sample assets for detailed analysis (first 10)
    const sampleAssets = corpusData.slice(0, 10);
    
    // 3. Grade all sample assets
    console.log('Grading sample assets...');
    const gradingResults = await batchGradeAssets(sampleAssets, vocabResult.vocabulary);
    
    const gradingPath = `${outputDir}/grading_results.json`;
    await fs.writeFile(gradingPath, JSON.stringify(gradingResults, null, 2));
    console.log(`Grading results saved to ${gradingPath}`);
    
    // 4. Optimize sample assets (without AI to keep it fast)
    console.log('Optimizing sample assets...');
    const optimizationResults = await batchOptimizeAssets(sampleAssets, {
      vocabulary: vocabResult.vocabulary,
      useAI: false,
      maxConcurrent: 2
    });
    
    const optimizationPath = `${outputDir}/optimization_results.json`;
    await fs.writeFile(optimizationPath, JSON.stringify(optimizationResults, null, 2));
    console.log(`Optimization results saved to ${optimizationPath}`);
    
    // 5. Generate summary report
    const report = {
      analysis_date: new Date().toISOString(),
      corpus_file: corpusFilePath,
      corpus_size: corpusData.length,
      sample_size: sampleAssets.length,
      vocabulary_stats: vocabResult.stats,
      grading_summary: gradingResults.summary,
      optimization_summary: optimizationResults.summary,
      files_generated: [
        vocabPath,
        gradingPath,
        optimizationPath
      ]
    };
    
    const reportPath = `${outputDir}/analysis_report.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`Analysis report saved to ${reportPath}`);
    
    console.log('✅ Complete analysis finished!');
    return report;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

/**
 * Process assets from CSV file
 */
export async function processAssetsFromCSV(csvFilePath) {
  console.log('Processing assets from CSV...');
  
  // This is a simplified example - you'd need a CSV parser like 'csv-parse'
  // For now, assuming you convert CSV to JSON first
  
  const csvData = await fs.readFile(csvFilePath, 'utf8');
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  const assets = lines.slice(1).map(line => {
    const values = line.split(',');
    const asset = {};
    headers.forEach((header, index) => {
      asset[header.trim()] = values[index]?.trim();
    });
    return asset;
  }).filter(asset => asset.title); // Filter out empty rows
  
  console.log(`Parsed ${assets.length} assets from CSV`);
  
  return await batchGradeAssets(assets);
}

// Example usage for NextJS API route
export async function processBatchAPI(assets, options = {}) {
  const {
    operation = 'grade', // 'grade' or 'optimize'
    vocabulary = {},
    exemplars = null,
    useAI = false,
    maxAssets = 100 // Limit for API usage
  } = options;
  
  // Limit number of assets to prevent timeouts
  const limitedAssets = assets.slice(0, maxAssets);
  
  if (operation === 'grade') {
    return await batchGradeAssets(limitedAssets, vocabulary);
  } else {
    return await batchOptimizeAssets(limitedAssets, {
      vocabulary,
      exemplars,
      useAI,
      maxConcurrent: 2 // Lower concurrency for API
    });
  }
}

// For direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const corpusPath = process.argv[2];
  const outputDir = process.argv[3] || './batch_output';
  
  if (!corpusPath) {
    console.log('Usage: node batch-processing.js <corpus-file.json> [output-dir]');
    process.exit(1);
  }
  
  buildCompleteAnalysis(corpusPath, outputDir).catch(console.error);
}