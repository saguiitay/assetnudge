# @repo/optimizer - Unity Asset Store Optimizer

A comprehensive AI-powered optimization tool for Unity Asset Store listings. Part of the AssetNudge monorepo, this package provides both CLI and programmatic interfaces for analyzing, grading, and optimizing Unity Asset Store listings using exemplar-driven intelligence.

## 🎯 Core Concept: Exemplar-Driven Optimization

Unlike traditional tools that use global rules, this optimizer **learns from successful assets**:

1. **🔍 Quality Detection**: Identifies top-performing assets using composite scores
2. **📊 Pattern Learning**: Extracts category-specific patterns from high-quality exemplars
3. **🎯 Neighbor Coaching**: Provides recommendations based on your nearest successful neighbors
4. **📚 Smart Playbooks**: Generates category-specific optimization guides

### Key Benefits
- **Category-Specific**: Tools patterns ≠ Audio patterns ≠ 3D model patterns
- **Quality-Driven**: Learn from winners, not the entire noisy corpus  
- **Evidence-Based**: Every suggestion references real successful examples
- **Monorepo Ready**: Designed for integration with larger applications

## ⚡ Quick Start

### Installation
```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build

# Test the CLI
npm run status
```

### One-Command Setup
```bash
# Build complete exemplar ecosystem from single corpus
npm run start build-all -- --corpus data/packages.json --out-dir data/ --top-n 15

# Build from multiple corpus files (for large datasets)
npm run start build-all -- --corpus "data/corpus1.json,data/corpus2.json,data/corpus3.json" --out-dir data/ --top-n 15

# Optimize an asset
npm run optimize -- --input asset.json --exemplars data/exemplars.json --vocab data/exemplar_vocab.json
```

## � Features

### Core Capabilities
- **🎯 Exemplar Coaching**: Learn from top performers with evidence-based recommendations
- **📊 Quality-Based Scoring**: Composite scoring using review strength, freshness, popularity, and completeness
- **🤝 Neighbor Analysis**: Find nearest high-quality exemplars for targeted suggestions
- **📚 Auto-Generated Playbooks**: Category-specific guides extracted from exemplar patterns
- **🧠 Smart Vocabulary**: Category vocabularies built from exemplars only
- **🤖 AI Suggestions**: OpenAI-powered content optimization with exemplar context
- **🕷️ Web Scraping**: GraphQL-based scraping for Unity Asset Store data
- **⚡ Batch Processing**: Analyze multiple assets in parallel
- **� Monorepo Integration**: TypeScript package ready for monorepo use

### 🔬 Technical Architecture
- **Modular Design**: Clean separation with dedicated modules
- **TypeScript Support**: Full type safety and IntelliSense
- **ESM Modules**: Modern ES module architecture
- **Robust Error Handling**: Comprehensive validation and fallbacks
- **Performance Optimized**: Caching, memory management, batch processing
- **Structured Logging**: JSON-based logging with debug levels

## 📋 Installation & Setup

### As a Package Dependency
```bash
npm install @repo/optimizer
```

### Development Setup
```bash
# Clone and install
git clone <repo>
cd packages/optimizer
npm install

# Build TypeScript
npm run build

# Test installation
npm run status
```

### Environment Setup
```bash
# Optional: For AI features
export OPENAI_API_KEY="your-api-key-here"
```

## 🚀 Usage

### CLI Interface

```bash
# Show all available commands
npm run help

# Check system status
npm run status

# Build complete exemplar ecosystem (recommended)
npm run start build-all -- --corpus data/packages.json --out-dir data/ --top-n 15

# Build from multiple corpus files (for large datasets)
npm run start build-all -- --corpus "data/part1.json,data/part2.json,data/part3.json" --out-dir data/ --top-n 15

# Scrape asset data
npm run scrape -- --url "https://assetstore.unity.com/packages/..." --out asset.json

# Grade an asset
npm run grade -- --input asset.json --vocab data/exemplar_vocab.json

# Optimize with exemplar coaching
npm run optimize -- --input asset.json --exemplars data/exemplars.json --vocab data/exemplar_vocab.json --ai true
```

### Programmatic API

```typescript
import { UnityAssetOptimizer, scrapeAsset, gradeAsset, optimizeAsset } from '@repo/optimizer';

// Initialize optimizer
const optimizer = new UnityAssetOptimizer([]);
await optimizer.validateSetup();

// Scrape asset data
const { success, asset } = await scrapeAsset('https://assetstore.unity.com/packages/...');

// Grade an asset
const { grade } = await gradeAsset(assetData, 'data/exemplar_vocab.json');

// Full optimization
const result = await optimizeAsset({
  input: 'asset.json',
  exemplars: 'data/exemplars.json',
  vocab: 'data/exemplar_vocab.json',
  useAI: true
});
```

### Integration Example

```typescript
// In your application
import { UnityAssetOptimizer, Asset, GradeResult } from '@repo/optimizer';

class AssetAnalyzer {
  private optimizer: UnityAssetOptimizer;
  
  constructor() {
    this.optimizer = new UnityAssetOptimizer([]);
  }
  
  async analyzeAsset(url: string): Promise<GradeResult> {
    const { asset } = await scrapeAsset(url);
    const { grade } = await gradeAsset(asset);
    return grade;
  }
}
```

## � Scoring System

The optimizer uses a comprehensive 100-point scoring system:

- **Content (29 pts)**: Title, descriptions, structure, messaging
- **Media (20 pts)**: Images, videos, visual demonstrations  
- **Trust (15 pts)**: Ratings, reviews, update recency
- **Findability (15 pts)**: SEO keywords, tags, pricing
- **Performance (21 pts)**: Conversion rates, traffic quality

## 🎯 Exemplar-Driven Workflows

### 1. Build Exemplar Database
```bash
# Single corpus file
npm run start build-exemplars -- --corpus data/packages.json --out data/exemplars.json --top-n 15

# Multiple corpus files (for large datasets)
npm run start build-exemplars -- --corpus "data/corpus1.json,data/corpus2.json,data/corpus3.json" --out data/exemplars.json --top-n 15
```

### 2. Build Quality-Focused Vocabulary
```bash
# Build exemplar-based vocabulary (recommended)
npm run start build-exemplar-vocab -- --exemplars data/exemplars.json --out data/exemplar_vocab.json
```

### 3. Generate Category Playbooks
```bash
npm run start generate-playbooks -- --exemplars data/exemplars.json --out data/playbooks.json
```

### 4. One-Command Setup (Recommended)
```bash
# Single corpus file
npm run start build-all -- --corpus data/packages.json --out-dir data/ --top-n 15

# Multiple corpus files (for large datasets split across files)
npm run start build-all -- --corpus "data/corpus1.json,data/corpus2.json,data/corpus3.json" --out-dir data/ --top-n 15
```

## 📁 Project Structure

```
@repo/optimizer/
├── main.mjs                    # CLI entry point
├── package.json               # Package configuration
├── tsconfig.json              # TypeScript configuration
├── dist/                      # Compiled output (auto-generated)
└── src/                       # Source code
    ├── config.ts              # Configuration management
    ├── index.ts               # Main package exports
    ├── optimizer.mjs          # Main orchestrator
    ├── grader.ts              # Asset scoring engine
    ├── similarity.ts          # TF-IDF similarity matching
    ├── vocabulary.ts          # Vocabulary building
    ├── types.ts               # TypeScript type definitions
    ├── exemplars.mjs          # Exemplar identification
    ├── pattern-extraction.ts  # Pattern extraction from exemplars
    ├── exemplar-coaching.mjs  # Neighbor-based recommendations
    ├── ai-suggestions.ts     # OpenAI integration
    ├── heuristic-suggestions.mjs # Fallback suggestions
    ├── scrappers/             # Web scraping modules
    │   └── graphql-scraper.ts
    └── utils/                 # Utility modules
        ├── logger.ts          # Structured logging
        ├── utils.ts           # Helper functions
        └── validation.ts      # Input validation
```

## 🔧 Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...          # Optional: For AI features
```

### Command Line Options
```bash
--debug                        # Enable debug logging
--model gpt-4o-mini           # OpenAI model selection
--apiKey sk-...               # OpenAI API key override
--weights '{"content":{"title":8}}' # Custom scoring weights
--exemplars exemplars.json     # Use exemplar coaching (recommended)
--top-n 20                     # Number of exemplars per category
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
```typescript
interface Asset {
  title: string;
  short_description: string;
  long_description: string;
  tags: string[];
  category: string;
  price: number;
  images_count: number;
  videos_count: number;
  rating: number;
  reviews_count: number;
  last_update: string;
  stats?: {
    pageviews: number;
    conversion: number;
  };
}
```

### Corpus Format
The corpus can be provided as a single file or multiple files (comma-separated):

```bash
# Single file
--corpus data/packages.json

# Multiple files (for large datasets)
--corpus "data/part1.json,data/part2.json,data/part3.json"
```

Each corpus file should contain an array of asset objects:
```json
[
  { /* asset object 1 */ },
  { /* asset object 2 */ },
  // ... more assets
]
```

**Benefits of Multiple Files:**
- **Memory Management**: Process large datasets without memory issues
- **Organization**: Split by category, date, or source
- **Incremental Updates**: Add new data without rebuilding entire corpus
- **Parallel Processing**: Future support for parallel processing of file chunks

### Exemplar Database Format
```typescript
interface ExemplarDatabase {
  exemplars: Record<string, Asset[]>;
  patterns: Record<string, CategoryPatterns>;
  metadata: {
    createdAt: string;
    stats: {
      totalExemplars: number;
      totalCategories: number;
    };
  };
}
```

## 🤖 AI Features

### Requirements
- OpenAI API key (set `OPENAI_API_KEY` environment variable)
- OpenAI account with sufficient credits

### Capabilities
- **🎯 Exemplar-Grounded AI**: AI suggestions informed by top performers
- **Structured Suggestions**: JSON-formatted optimization recommendations
- **Category Analysis**: AI-powered category classification
- **Content Generation**: Title and description alternatives
- **Tag Optimization**: Smart tag suggestions from exemplar patterns
- **Quality Context**: AI understands category-specific quality patterns

### Fallback Behavior
Without AI, the system uses heuristic methods:
- Vocabulary-based tag suggestions
- Template-driven content recommendations
- Statistical category classification

## 🔍 Performance Features

### Caching & Memory Management
- **TF-IDF Vectors**: Cached similarity calculations
- **Memory Monitoring**: Automatic cache eviction and TTL
- **Batch Processing**: Configurable batch sizes

### Error Handling
- **Validation Errors**: Clear messages for invalid input
- **Network Errors**: Graceful scraping failure handling  
- **AI Errors**: Automatic fallback to heuristic methods
- **File Errors**: Detailed file access error messages

## � API Reference

### Core Classes

#### `UnityAssetOptimizer`
Main orchestrator class:

```typescript
import UnityAssetOptimizer from '@repo/optimizer';

const optimizer = new UnityAssetOptimizer([]);
await optimizer.validateSetup();

const result = await optimizer.optimizeAsset({
  input: 'asset.json',
  exemplarsPath: 'exemplars.json',
  vocabPath: 'exemplar_vocab.json',
  useAI: true
});
```

#### Programmatic Functions

```typescript
import { scrapeAsset, gradeAsset, optimizeAsset } from '@repo/optimizer';

// Scrape asset data
const { success, asset } = await scrapeAsset(url);

// Grade an asset  
const { grade } = await gradeAsset(assetData, vocabPath);

// Full optimization
const result = await optimizeAsset(options);
```

## 🔧 Development

### Building
```bash
npm run build          # Compile TypeScript
npm run type-check     # Type checking only
```

### Testing
```bash
npm run start status   # Test CLI functionality
npm run start help     # View all commands
```

### Debug Mode
```bash
npm run start optimize -- --input asset.json --debug true
```

## 📄 Package Integration

### As a Dependency
```json
{
  "dependencies": {
    "@repo/optimizer": "^2.0.0"
  }
}
```

### TypeScript Support
Full TypeScript support with exported types:

```typescript
import { Asset, GradeResult, Vocabulary, UnityAssetOptimizer } from '@repo/optimizer';
```

## 🚨 Troubleshooting

### Common Issues

1. **Missing TypeScript Build**
   ```bash
   npm run build
   ```

2. **OpenAI API Errors**
   ```bash
   npm run status  # Check API key
   # Use without AI: --ai false
   ```

3. **Memory Issues**
   ```bash
   # Enable garbage collection
   node --expose-gc main.mjs
   ```

4. **Import Errors**
   ```bash
   # Ensure build is current
   npm run build
   ```

## 📝 License

MIT License - Part of the AssetNudge monorepo.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch  
3. Make changes with TypeScript support
4. Add tests if applicable
5. Submit a pull request

---

*Part of the @repo monorepo ecosystem. For integration examples and additional documentation, see the main repository.*