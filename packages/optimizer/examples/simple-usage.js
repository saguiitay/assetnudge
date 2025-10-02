/**
 * Simple Usage Examples
 * 
 * Basic examples of how to use the Unity Asset Optimizer functions
 */

import { 
  gradeAsset, 
  optimizeAsset, 
  scrapeAsset, 
  buildVocabulary,
  buildExemplars,
  OptimizerConfig 
} from 'unity-asset-optimizer';

// Example asset data
const sampleAsset = {
  title: 'Advanced AI Navigation System',
  description: 'A comprehensive AI-powered navigation system for Unity games. Features pathfinding, obstacle avoidance, and smart NPC behavior. Perfect for creating realistic AI characters in your game.',
  category: 'Scripts',
  tags: ['ai', 'navigation', 'pathfinding', 'npc', 'scripts'],
  price: 49.99,
  url: 'https://assetstore.unity.com/packages/tools/ai/example-123456'
};

// Example vocabulary data
const sampleVocabulary = {
  'Scripts': {
    sample_size: 100,
    title_length: { mean: 35, std: 10 },
    word_count_long: { mean: 150, std: 50 },
    common_words: ['script', 'system', 'tool', 'unity'],
    price_stats: { mean: 25, std: 15 }
  }
};

// 1. Basic Asset Grading
export async function basicGrading() {
  console.log('=== Basic Asset Grading ===');
  
  const result = await gradeAsset(sampleAsset, sampleVocabulary);
  
  if (result.success) {
    console.log('Grade:', result.grade.score);
    console.log('Letter:', result.grade.letter);
    console.log('Breakdown:', result.grade.breakdown);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// 2. Basic Asset Optimization (without AI)
export async function basicOptimization() {
  console.log('=== Basic Asset Optimization ===');
  
  const result = await optimizeAsset({
    asset: sampleAsset,
    vocabulary: sampleVocabulary,
    useAI: false
  });
  
  if (result.success) {
    console.log('Grade:', result.grade.score);
    console.log('Suggestions:', result.analysis.suggestions);
    console.log('Strategy:', result.analysis.coaching_strategy);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// 3. Asset Optimization with AI
export async function aiOptimization() {
  console.log('=== AI-Powered Asset Optimization ===');
  
  // Create config with OpenAI API key
  const config = new OptimizerConfig({
    apiKey: process.env.OPENAI_API_KEY, // or pass directly
    model: 'gpt-4o-mini',
    debug: true
  });
  
  const result = await optimizeAsset({
    asset: sampleAsset,
    vocabulary: sampleVocabulary,
    useAI: true,
    config: config
  });
  
  if (result.success) {
    console.log('Grade:', result.grade.score);
    console.log('AI Suggestions:', result.analysis.ai_suggestions);
    console.log('Heuristic Suggestions:', result.analysis.suggestions);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// 4. Scraping Asset from URL
export async function scrapeAssetExample() {
  console.log('=== Scraping Asset from URL ===');
  
  const url = 'https://assetstore.unity.com/packages/tools/ai/ml-agents-120271';
  
  const result = await scrapeAsset(url);
  
  if (result.success) {
    console.log('Scraped asset:', result.asset.title);
    console.log('Category:', result.asset.category);
    console.log('Tags:', result.asset.tags);
  } else {
    console.error('Scraping error:', result.error);
  }
  
  return result;
}

// 5. Building Vocabulary from Corpus
export async function buildVocabularyExample() {
  console.log('=== Building Vocabulary ===');
  
  // Sample corpus data
  const corpus = [
    {
      title: 'AI Navigation System',
      description: 'Advanced pathfinding for Unity',
      category: 'Scripts',
      tags: ['ai', 'navigation'],
      price: 29.99
    },
    {
      title: 'Shader Pack Pro',
      description: 'Professional shaders for Unity',
      category: 'VFX',
      tags: ['shader', 'vfx', 'graphics'],
      price: 39.99
    }
    // ... more assets
  ];
  
  const result = await buildVocabulary(corpus);
  
  if (result.success) {
    console.log('Vocabulary built successfully');
    console.log('Categories:', result.stats.categories);
    console.log('Sample vocabulary:', Object.keys(result.vocabulary));
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// 6. Building Exemplars from Corpus
export async function buildExemplarsExample() {
  console.log('=== Building Exemplars ===');
  
  // You would normally load this from a file or database
  const corpus = [
    // ... array of asset objects with ratings, reviews, etc.
  ];
  
  const result = await buildExemplars(corpus, 20); // top 20 per category
  
  if (result.success) {
    console.log('Exemplars built successfully');
    console.log('Total exemplars:', result.stats.total_exemplars);
    console.log('Categories:', result.stats.categories);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// 7. Error Handling Example
export async function errorHandlingExample() {
  console.log('=== Error Handling ===');
  
  // Try to grade an invalid asset
  const result = await gradeAsset(null);
  
  if (!result.success) {
    console.log('Expected error:', result.error);
  }
  
  // Try to use AI without API key
  const config = new OptimizerConfig({ apiKey: '' });
  const aiResult = await optimizeAsset({
    asset: sampleAsset,
    useAI: true,
    config: config
  });
  
  if (!aiResult.success) {
    console.log('Expected AI error:', aiResult.error);
  }
}

// 8. Batch Processing Example
export async function batchProcessingExample() {
  console.log('=== Batch Processing ===');
  
  const assets = [
    sampleAsset,
    {
      title: 'Another Asset',
      description: 'Another great Unity asset',
      category: 'Tools',
      tags: ['tool', 'utility'],
      price: 19.99
    }
  ];
  
  const results = [];
  
  for (const asset of assets) {
    const result = await gradeAsset(asset, sampleVocabulary);
    results.push({
      title: asset.title,
      success: result.success,
      score: result.success ? result.grade.score : null,
      error: result.success ? null : result.error
    });
  }
  
  console.log('Batch results:', results);
  return results;
}

// Run all examples
export async function runAllExamples() {
  console.log('🚀 Unity Asset Optimizer - Usage Examples\n');
  
  try {
    await basicGrading();
    console.log('\n');
    
    await basicOptimization();
    console.log('\n');
    
    // Uncomment if you have OpenAI API key
    // await aiOptimization();
    // console.log('\n');
    
    // Uncomment to test scraping (may be slow)
    // await scrapeAssetExample();
    // console.log('\n');
    
    await buildVocabularyExample();
    console.log('\n');
    
    await errorHandlingExample();
    console.log('\n');
    
    await batchProcessingExample();
    console.log('\n');
    
    console.log('✅ All examples completed!');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// For Node.js direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}