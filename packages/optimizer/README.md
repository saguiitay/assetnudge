# Unity Asset Optimizer v2.0 - Exemplar-Driven Intelligence

A revolutionary optimization tool for Unity Asset Store listings that **learns from "what good looks like"** using exemplar-based coaching. Combines quality-driven pattern recognition with AI-powered suggestions, competitive analysis, and live web scraping capabilities.

## 🎯 The Exemplar Advantage

Traditional optimization tools use global rules and heuristics. **This tool learns from success.**

### How It Works
1. **🔍 Quality Detection**: Automatically identifies top-performing assets using composite scores:
   - **Review strength**: rating × log(1 + reviews)
   - **Freshness bonus**: recent updates (≤180 days)
   - **Popularity proxy**: reviews + favorites count
   - **Listing completeness**: media, description richness

2. **📊 Pattern Learning**: Extracts category-specific patterns from exemplars:
   - **Vocabulary**: Most effective words in titles/descriptions
   - **Tag baskets**: Common tag combinations that work
   - **Structure norms**: Optimal lengths, bullet counts, media
   - **Price bands**: What successful assets charge

3. **🎯 Neighbor Coaching**: Finds your 5 nearest high-quality neighbors and explains:
   - *"Top Tools exemplars commonly include 'mobile', 'editor', and 'ready-to-publish' in titles; yours has none"*
   - *"Add 4 more images (5 vs exemplar median of 9)"*
   - *"Price might be low ($4.99 vs category median $35.45)"*

4. **📚 Auto-Playbooks**: Generates living documentation per category:
   - Must-have keywords and optimal structures
   - Media requirements and pricing guidance
   - Examples from top performers

### Why Exemplars Beat Global Rules
- **🎯 Category-Specific**: Tools patterns ≠ Audio patterns ≠ 3D model patterns
- **📈 Quality-Driven**: Learn from winners, not the entire noisy corpus
- **🔄 Self-Updating**: Patterns evolve as new exemplars emerge
- **💡 Explainable**: Every suggestion references real successful examples

## 🚀 New in v2.0 - Exemplar-Driven Revolution

### 🎯 Core Innovation: Learn from Success
- **Exemplar Identification**: Automatically identify top-performing assets per category using composite quality scores
- **Pattern Extraction**: Learn vocabulary, structure, media, and pricing patterns from exemplars
- **Neighbor-Based Coaching**: Get recommendations from your nearest high-quality neighbors
- **Category Playbooks**: Auto-generated guides showing what works in each category
- **Quality-Driven Vocabulary**: Build vocabularies from exemplars only (not entire corpus)

### 🔧 Technical Excellence
- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Robust Error Handling**: Comprehensive validation and graceful fallbacks
- **Performance Optimizations**: Caching, memory management, and batch processing
- **Structured Logging**: JSON-based logging with debug levels and context
- **Enhanced Configuration**: Centralized config management with environment variables
- **Batch Processing**: Process multiple assets efficiently
- **Status Monitoring**: Health checks and system status reporting

## 📋 Features

### Core Capabilities
- **🎯 Exemplar Coaching**: Learn from top performers in your category with evidence-based recommendations
- **📊 Quality-Based Scoring**: Composite scoring using review strength, freshness, popularity, and completeness
- **🤝 Neighbor Analysis**: Find your 5 nearest high-quality exemplars for targeted suggestions
- **📚 Auto-Generated Playbooks**: Category-specific guides extracted from exemplar patterns
- **🧠 Smart Vocabulary**: Category vocabularies built from exemplars only (not noise from poor performers)
- **🤖 AI Suggestions**: OpenAI-powered content optimization with exemplar context (requires API key)
- **🕷️ Dual Web Scraping**: Multiple scraping strategies for reliability and speed
- **⚡ Batch Processing**: Analyze multiple assets in parallel

### 🕷️ Web Scraping Options
Choose the right scraping method for your needs:

#### **HTML Scraping** (Lightweight)
- Fast, lightweight HTML-only parsing
- No JavaScript dependencies
- ~90-95% data extraction accuracy
- Perfect for bulk scraping or resource-constrained environments

#### **Fallback Strategy** (Recommended)
- Tries GraphQL first for complete data
- Automatically falls back to HTML scraping if GraphQL fails
- Best reliability with optimal data quality
- Smart error handling and logging

```bash
# Full-featured scraping (default)
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method GraphQL

# Fast HTML-only scraping
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method html

# Smart fallback strategy (recommended)
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method fallback
```

### Scoring Dimensions (100 points total)
- **Content (29 pts)**: Title, descriptions, structure, messaging
- **Media (20 pts)**: Images, videos, visual demonstrations
- **Trust (15 pts)**: Ratings, reviews, update recency
- **Findability (15 pts)**: SEO keywords, tags, pricing
- **Performance (21 pts)**: Conversion rates, traffic quality

## 🛠 Installation

```bash
# Install dependencies
npm install

# Set up OpenAI API key (optional, for AI features)
export OPENAI_API_KEY="your-api-key-here"

# Test the installation
node main.mjs status
```

## ⚡ Quick Start (Exemplar Coaching)

### 1. Get Some Asset Data
```bash
# Option A: Use existing corpus (if you have scraped data)
# Corpus should be an array of Unity Asset Store listings

# Option B: Scrape fresh data (choose your method)
# Fast HTML scraping for quick analysis
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method html --out asset.json

# Full GraphQL scraping for complete data
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method graphql --out asset.json

# Smart fallback (recommended - tries GraphQL, falls back to HTML)
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --method fallback --out asset.json
```

### 2. Build Your Exemplar Intelligence
```bash
# Identify top performers and extract patterns (one-time setup)
node main.mjs build-exemplars --corpus packages.json --out exemplars.json --top-n 15
node main.mjs build-exemplar-vocab --exemplars exemplars.json --out exemplar_vocab.json
```

### 3. Get Exemplar-Based Recommendations
```bash
# Analyze your asset using exemplar coaching
node main.mjs optimize \
  --input your_asset.json \
  --exemplars exemplars.json \
  --vocab exemplar_vocab.json

# Or analyze directly from URL
node main.mjs optimize \
  --url "https://assetstore.unity.com/packages/your-asset" \
  --exemplars exemplars.json \
  --vocab exemplar_vocab.json
```

**Result**: Get specific, evidence-based recommendations like *"Top Tools exemplars average 7 images; you have 2"* and *"Consider adding 'editor' tag - appears in 80% of exemplars"*.

## 📖 Usage

### Basic Commands

```bash
# Show help and available commands
node main.mjs help

# Check system status
node main.mjs status

# Scrape asset data from Unity Asset Store
node main.mjs scrape --url "https://assetstore.unity.com/packages/..." --out asset.json

# Grade an asset (heuristic scoring only)
node main.mjs grade --input asset.json

# 🎯 NEW: Exemplar-based optimization (RECOMMENDED)
node main.mjs optimize --input asset.json --exemplars exemplars.json --vocab exemplar_vocab.json

# Traditional optimization with AI
node main.mjs optimize --input asset.json --ai true
```

### 🎯 Exemplar-Driven Workflows (Recommended)

#### 1. Build Exemplar Database
```bash
# Identify top-performing assets as exemplars (15 per category)
node main.mjs build-exemplars \
  --corpus data/packages.json \
  --out data/exemplars.json \
  --top-n 15
```

#### 2. Build Quality-Focused Vocabulary
```bash
# Create vocabulary from exemplars only (not entire corpus)
node main.mjs build-exemplar-vocab \
  --exemplars data/exemplars.json \
  --out data/exemplar_vocab.json
```

#### 3. Generate Category Playbooks
```bash
# Auto-generate category-specific optimization guides
node main.mjs generate-playbooks \
  --exemplars data/exemplars.json \
  --out data/playbooks.json
```

#### 4. Exemplar-Based Optimization
```bash
# Get recommendations from your category's top performers
node main.mjs optimize \
  --input data/asset.json \
  --exemplars data/exemplars.json \
  --vocab data/exemplar_vocab.json \
  --ai true \
  --out results.json
```

#### 5. Live URL Analysis with Exemplars
```bash
# Scrape and analyze directly from URL using exemplar coaching
node main.mjs optimize \
  --url "https://assetstore.unity.com/packages/..." \
  --exemplars data/exemplars.json \
  --vocab data/exemplar_vocab.json \
  --out analysis.json
```

## 🎯 Example: Exemplar Coaching in Action

### Input Asset
```json
{
  "title": "Simple Memory Game Template",
  "category": "Tools", 
  "price": 4.99,
  "images_count": 5,
  "tags": ["Memory game", "2D", "Template", "Complete Project"]
}
```

### Exemplar Analysis Output
```json
{
  "grade": {"score": 27, "letter": "F"},
  "exemplar_coaching": {
    "neighbors": [
      {
        "title": "Character Selection Menu",
        "similarity": "0.150",
        "qualityScore": "433.8"
      }
    ],
    "recommendations": [
      {
        "category": "media",
        "suggestions": [{
          "type": "images",
          "content": "Add 4 more images (5 vs median 9)",
          "impact": "high",
          "explanation": "Exemplars average 7 images"
        }]
      },
      {
        "category": "price",
        "suggestions": [{
          "type": "pricing", 
          "content": "Price might be too low (4.99 vs median 35.45)",
          "impact": "low",
          "explanation": "Could potentially charge more given category norms"
        }]
      }
    ],
    "categoryAlignment": {"score": 45},
    "metadata": {
      "category": "Tools",
      "exemplarsUsed": 5,
      "totalCategoryExemplars": 15
    }
  }
}
```

### What This Tells You
- **🎯 Specific Gaps**: Your asset needs 4 more images to match exemplar medians
- **💰 Pricing Insight**: You're underpricing compared to successful Tools
- **📊 Performance Context**: 45% aligned with category exemplars  
- **🤝 Learning Source**: Recommendations from 5 nearest high-quality neighbors
- **📈 Improvement Path**: Clear, data-driven optimization strategy

### Legacy Workflows (Still Supported)

#### Traditional Vocabulary Building
```bash
# Create vocabulary from entire corpus (includes poor performers)
node main.mjs build-vocab --corpus data/corpus.json --out data/vocab.json
```

#### Similarity-Based Analysis
```bash
# Traditional similarity analysis (less precise than exemplars)
node main.mjs optimize \
  --input data/asset.json \
  --vocab data/vocab.json \
  --neighbors data/corpus.json \
  --ai true
```

#### Batch Processing
```bash
# Process multiple assets in batch
node main.mjs batch \
  --assets data/assets.json \
  --vocab data/vocab.json \
  --corpus data/corpus.json \
  --out batch_results.json
```

## 📁 Project Structure

```
optimizer/
├── main.mjs                    # CLI entry point
├── package.json               # Project configuration
├── utils.mjs                  # Utility functions
├── puppeteer-scraper.mjs      # Web scraping module
└── src/                       # Core modules
    ├── config.ts             # Configuration management
    ├── logger.mjs             # Structured logging
    ├── validation.mjs         # Input validation
    ├── vocabulary.mjs         # Vocabulary building (enhanced with exemplar support)
    ├── grader.mjs             # Asset scoring
    ├── similarity.mjs         # TF-IDF similarity
    ├── 🎯 exemplars.mjs       # NEW: Exemplar identification & quality scoring
    ├── 🎯 pattern-extraction.mjs # NEW: Pattern extraction from exemplars
    ├── 🎯 exemplar-coaching.mjs # NEW: Neighbor-based recommendations
    ├── ai-suggestions.mjs     # OpenAI integration (enhanced with exemplar context)
    ├── heuristic-suggestions.mjs # Fallback suggestions
    ├── performance.mjs        # Performance optimization
    └── optimizer.mjs          # Main orchestrator (enhanced with exemplar workflows)
```

## 🔧 Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...          # OpenAI API key for AI features
```

### Command Line Options
```bash
--debug                        # Enable debug logging
--model gpt-4o-mini           # OpenAI model selection
--apiKey sk-...               # OpenAI API key override
--weights '{"content":{"title":8}}' # Custom scoring weights

# 🎯 NEW: Exemplar-specific options
--exemplars exemplars.json     # Use exemplar coaching (recommended)
--top-n 20                     # Number of exemplars per category (default: 20)
--neighbors corpus.json        # Legacy similarity analysis
```

### Custom Scoring Weights
```javascript
{
  "content": { "title": 6, "short": 6, "long": 8, "bullets": 7, "cta": 3, "uvp": 5 },
  "media": { "images": 8, "video": 8, "gif": 4 },
  "trust": { "rating": 5, "reviews": 5, "freshness": 5 },
  "find": { "tagcov": 7, "titlekw": 5, "pricez": 3 },
  "perf": { "cvr": 10, "hv_lc_penalty": 5 }
}
```

## 📊 Data Formats

### Asset Object
```javascript
{
  "title": "Amazing Unity Template",
  "short_description": "Quick description...",
  "long_description": "Detailed description...",
  "tags": ["unity", "template", "game"],
  "category": "Templates",
  "price": 29.99,
  "images_count": 8,
  "videos_count": 2,
  "rating": 4.5,
  "reviews_count": 25,
  "last_update": "2024-01-15",
  "stats": {
    "pageviews": 1500,
    "conversion": 0.008
  }
}
```

### Corpus Format
```javascript
[
  { /* asset object 1 */ },
  { /* asset object 2 */ },
  // ... more assets
]
```

### 🎯 Exemplar Database Format
```javascript
{
  "exemplars": {
    "Tools": [
      {
        "title": "Advanced Tool",
        "qualityScore": 285.3,
        "rating": 4.8,
        "reviews_count": 247,
        "images_count": 8,
        // ... full asset data
      }
    ]
  },
  "patterns": {
    "Tools": {
      "vocabulary": {
        "titleWords": [{"item": "unity", "frequency": 12}],
        "titleBigrams": [{"item": "unity tool", "frequency": 8}]
      },
      "tags": {
        "commonTags": [{"item": "editor", "frequency": 10}],
        "averageTagCount": 6.2
      },
      "media": {
        "images": {"median": 7, "avg": 6.8},
        "videos": {"median": 1, "hasVideo": 0.73}
      },
      "price": {
        "median": 35.45,
        "iqr": {"q1": 29.99, "q3": 180}
      }
    }
  },
  "metadata": {
    "createdAt": "2025-09-29T20:08:22.042Z",
    "stats": {
      "totalExemplars": 91,
      "totalCategories": 7
    }
  }
}
```

### Category Playbook Format
```javascript
{
  "playbooks": {
    "Tools": {
      "category": "Tools",
      "summary": {
        "exemplarCount": 15,
        "averageQualityScore": 285.3
      },
      "recommendations": {
        "title": {
          "optimalLength": "28 characters (range: 15-45)",
          "mustHaveKeywords": ["unity", "tool", "editor"],
          "commonPhrases": ["unity tool", "editor extension"]
        },
        "media": {
          "images": "7 images (range: 4-12)",
          "videos": "Include demo video",
          "videoAdoption": "73% of exemplars include videos"
        },
        "pricing": {
          "median": "$35.45",
          "sweetSpot": "$29.99 - $180.00 (middle 50%)"
        }
      },
      "topExemplars": [
        {
          "title": "Advanced Unity Tool",
          "qualityScore": "298.5",
          "keyStrengths": ["High review count", "Excellent rating"]
        }
      ]
    }
  }
}
```

## 🤖 AI Features

### Requirements
- OpenAI API key (set `OPENAI_API_KEY` environment variable)
- OpenAI account with sufficient credits

### Capabilities
- **🎯 Exemplar-Grounded AI**: AI suggestions informed by top performers in your category
- **Structured Suggestions**: JSON-formatted optimization recommendations with exemplar evidence
- **Category Analysis**: AI-powered category classification using exemplar patterns
- **Content Generation**: Title and description alternatives based on successful exemplars
- **Tag Optimization**: Smart tag suggestions from exemplar tag baskets
- **Neighbor Coaching**: "Top 5 Tools exemplars commonly use X, yours has none"
- **Quality Context**: AI understands what high-quality assets look like in each category

### Fallback Behavior
If AI is unavailable, the system automatically falls back to heuristic methods:
- Vocabulary-based tag suggestions
- Template-driven content recommendations
- Statistical category classification

## 🔍 Performance Features

### Caching
- **TF-IDF Vectors**: Cached for expensive similarity calculations
- **Memory Management**: Automatic cache eviction and TTL
- **Hit Rate Monitoring**: Performance metrics and cache statistics

### Batch Processing
- **Configurable Batch Size**: Optimize for memory vs. speed
- **Progress Tracking**: Real-time progress reporting
- **Error Resilience**: Continue processing on individual failures

### Memory Optimization
- **Memory Snapshots**: Track memory usage across operations
- **Garbage Collection**: Optional forced GC for long-running processes
- **Resource Monitoring**: Heap and external memory tracking

## 🧪 Development

### Debug Mode
```bash
# Enable detailed logging
node main.mjs optimize --input asset.json --debug true
```

### Performance Monitoring
```bash
# Run with memory tracking
node --expose-gc main.mjs optimize --input asset.json --debug true
```

### Testing
```bash
# Run tests (when available)
npm test
```

## 📄 API Reference

### Core Classes

#### `UnityAssetOptimizer`
Main orchestrator class that coordinates all modules.

```javascript
import UnityAssetOptimizer from './src/optimizer.mjs';

const optimizer = new UnityAssetOptimizer(process.argv.slice(2));
await optimizer.validateSetup();

const result = await optimizer.optimizeAsset({
  input: 'asset.json',
  vocabPath: 'vocab.json',
  useAI: true
});
```

#### `AssetGrader`
Heuristic scoring engine.

```javascript
import AssetGrader from './src/grader.mjs';
import Config from './src/config';

const config = Config.fromEnvironment();
const grader = new AssetGrader(config);
const grade = await grader.gradeAsset(asset, vocabulary);
```

#### `SimilarityEngine`
TF-IDF similarity calculations.

```javascript
import SimilarityEngine from './src/similarity.mjs';

const engine = new SimilarityEngine(config);
const similar = await engine.findSimilarAssets(asset, corpus, 5);
```

### 🎯 New Exemplar API Reference

#### Exemplar Identification
```javascript
import { identifyExemplars, calculateQualityScore } from './src/exemplars.mjs';

// Calculate quality score for an asset
const score = calculateQualityScore(asset);
// Factors: review strength, freshness, popularity, completeness

// Identify top exemplars per category
const exemplars = identifyExemplars(corpus, 15); // Top 15 per category
```

#### Pattern Extraction
```javascript
import { extractCategoryPatterns } from './src/pattern-extraction.mjs';

// Extract patterns from exemplars
const patterns = extractCategoryPatterns(exemplars);
// Returns: vocabulary, tags, structure, media, price patterns
```

#### Exemplar Coaching
```javascript
import { generateExemplarRecommendations, generateCategoryPlaybook } from './src/exemplar-coaching.mjs';

// Get neighbor-based recommendations
const coaching = generateExemplarRecommendations(asset, exemplarsData, 5);
// Returns: specific suggestions with exemplar evidence

// Generate category playbook
const playbook = generateCategoryPlaybook(category, patterns, exemplars);
// Returns: auto-generated optimization guide
```

#### Exemplar-Enhanced Vocabulary
```javascript
import VocabularyBuilder from './src/vocabulary.mjs';

const builder = new VocabularyBuilder(config);

// Build vocabulary from exemplars only (quality-focused)
const exemplarVocab = await builder.buildExemplarVocabulary(exemplarsData);

// Traditional vocabulary from entire corpus
const fullVocab = await builder.buildVocabAndMedians(corpus);
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Clear messages for invalid input data
- **Network Errors**: Graceful handling of scraping failures
- **AI Errors**: Automatic fallback to heuristic methods
- **File Errors**: Detailed messages for file access issues
- **Configuration Errors**: Validation of settings and dependencies

## 📈 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   ```bash
   # Check API key
   node main.mjs status
   
   # Test with fallback
   node main.mjs optimize --input asset.json --ai false
   ```

2. **Memory Issues**
   ```bash
   # Reduce batch size
   # Enable garbage collection
   node --expose-gc main.mjs batch --assets large_corpus.json
   ```

3. **Scraping Issues**
   ```bash
   # Check URL format
   # Verify Unity Asset Store accessibility
   node main.mjs scrape --url "..." --debug true
   ```

4. **🎯 Exemplar-Specific Issues**
   ```bash
   # Insufficient exemplars for a category
   # Solution: Lower --top-n or combine related categories
   node main.mjs build-exemplars --corpus corpus.json --top-n 10
   
   # No high-quality assets found
   # Check corpus quality and scoring thresholds
   node main.mjs build-exemplars --corpus corpus.json --debug true
   
   # Vocabulary format errors
   # Rebuild exemplar vocabulary after updating exemplars
   node main.mjs build-exemplar-vocab --exemplars exemplars.json --out vocab.json
   ```

5. **Quality Score Issues**
   ```bash
   # Debug quality scoring
   node -e "import('./src/exemplars.mjs').then(m => console.log(m.calculateQualityScore(asset)))"
   
   # Check exemplar statistics
   node main.mjs build-exemplars --corpus corpus.json --debug true
   ```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: This README and inline code comments
- **Debug Mode**: Use `--debug true` for detailed logging