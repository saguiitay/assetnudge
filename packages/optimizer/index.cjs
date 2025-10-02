/**
 * Unity Asset Optimizer - CommonJS Wrapper
 * 
 * This file provides CommonJS compatibility for environments that don't support ES modules.
 * It's a thin wrapper around the main ES module.
 */

const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Dynamic import wrapper for ES modules
async function loadESModule() {
  const module = await import('./index.mjs');
  return module;
}

// CommonJS exports
let modulePromise = null;

function getModule() {
  if (!modulePromise) {
    modulePromise = loadESModule();
  }
  return modulePromise;
}

// Export async wrappers for all main functions
async function gradeAsset(asset, vocabulary, config) {
  const module = await getModule();
  return module.gradeAsset(asset, vocabulary, config);
}

async function optimizeAsset(options) {
  const module = await getModule();
  return module.optimizeAsset(options);
}

async function scrapeAsset(url, config) {
  const module = await getModule();
  return module.scrapeAsset(url, config);
}

async function buildVocabulary(corpus, config) {
  const module = await getModule();
  return module.buildVocabulary(corpus, config);
}

async function buildExemplars(corpus, topN, topPercent, config) {
  const module = await getModule();
  return module.buildExemplars(corpus, topN, topPercent, config);
}

// Export config class (needs to be created synchronously)
class OptimizerConfig {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.model = options.model || 'gpt-4o-mini';
    this.weights = options.weights || {};
    this.ignoreStopWords = options.ignoreStopWords !== false;
  }
}

// For advanced users who need the full class
async function getUnityAssetOptimizer() {
  const module = await getModule();
  return module.UnityAssetOptimizer;
}

module.exports = {
  gradeAsset,
  optimizeAsset,
  scrapeAsset,
  buildVocabulary,
  buildExemplars,
  OptimizerConfig,
  getUnityAssetOptimizer
};