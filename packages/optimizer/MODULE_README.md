# Unity Asset Optimizer

A comprehensive AI-powered optimization tool for Unity Asset Store listings that provides both CLI functionality and a reusable module for NextJS applications.

## Features

- **Asset Grading**: Heuristic scoring system (0-100 points) across content, media, trust, findability, and performance
- **AI-Powered Optimization**: OpenAI-based suggestions for titles, descriptions, tags, and content
- **Web Scraping**: Extract asset data directly from Unity Asset Store URLs
- **Similarity Analysis**: Find and learn from similar high-performing assets
- **Exemplar Coaching**: Pattern-based recommendations from top-performing assets
- **Batch Processing**: Efficiently process multiple assets
- **NextJS Integration**: Clean API for web applications

## Installation

```bash
npm install unity-asset-optimizer
# or
yarn add unity-asset-optimizer
```

## Quick Start

### As a Module (NextJS/Node.js)

```javascript
import { gradeAsset, optimizeAsset, OptimizerConfig } from 'unity-asset-optimizer';

// Grade an asset
const gradeResult = await gradeAsset({
  title: 'Advanced AI Navigation System',
  description: 'AI-powered pathfinding for Unity games...',
  category: 'Scripts',
  tags: ['ai', 'navigation', 'pathfinding'],
  price: 49.99
});

console.log(`Grade: ${gradeResult.grade.score}/100 (${gradeResult.grade.letter})`);

// Optimize with AI suggestions
const config = new OptimizerConfig({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini'
});

const optimizationResult = await optimizeAsset({
  asset: assetData,
  useAI: true,
  config: config
});
```

### As a CLI Tool

```bash
# Grade an asset
node main.mjs grade --input asset.json --vocab vocabulary.json

# Optimize an asset with AI
node main.mjs optimize --input asset.json --ai true

# Scrape and optimize from URL
node main.mjs optimize --url "https://assetstore.unity.com/packages/..." --ai true

# Build analysis ecosystem
node main.mjs build-all --corpus packages.json --out-dir data/
```

## API Reference

### Core Functions

#### `gradeAsset(asset, vocabulary?, config?)`

Grades an asset using the heuristic scoring system.

**Parameters:**
- `asset` (Object): Asset data with title, description, category, tags, price
- `vocabulary` (Object, optional): Category-specific vocabulary for enhanced scoring
- `config` (OptimizerConfig, optional): Configuration options

**Returns:** Promise resolving to `{ success: boolean, grade?: Object, error?: string }`

#### `optimizeAsset(options)`

Performs comprehensive optimization analysis.

**Parameters:**
- `options.asset` (Object): Asset data (required if no URL)
- `options.url` (string): Asset Store URL to scrape (required if no asset)
- `options.vocabulary` (Object, optional): Category vocabulary
- `options.exemplars` (Object, optional): Exemplar patterns for coaching
- `options.neighbors` (Array, optional): Similar assets corpus
- `options.useAI` (boolean): Enable AI suggestions (default: false)
- `options.config` (OptimizerConfig): Configuration

**Returns:** Promise resolving to optimization results with grade, suggestions, and analysis

#### `scrapeAsset(url, config?)`

Scrapes asset data from Unity Asset Store URL.

#### `buildVocabulary(corpus, config?)`

Builds category vocabulary from asset corpus.

#### `buildExemplars(corpus, topN?, topPercent?, config?)`

Extracts exemplar patterns from top-performing assets.

### Configuration

```javascript
const config = new OptimizerConfig({
  debug: false,                    // Enable debug logging
  apiKey: 'your-openai-key',      // OpenAI API key
  model: 'gpt-4o-mini',           // AI model to use
  weights: {},                     // Custom scoring weights
  ignoreStopWords: true           // Filter common stop words
});
```

## NextJS Integration Examples

### API Route (App Router)

```javascript
// app/api/grade-asset/route.js
import { gradeAsset, OptimizerConfig } from 'unity-asset-optimizer';

export async function POST(request) {
  const { asset, vocabulary } = await request.json();
  
  const config = new OptimizerConfig({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const result = await gradeAsset(asset, vocabulary, config);
  
  return Response.json(result);
}
```

### Server Component

```javascript
// app/asset/[id]/page.js
import { gradeAsset, optimizeAsset } from 'unity-asset-optimizer';

export default async function AssetPage({ params }) {
  const assetData = await fetchAssetFromDatabase(params.id);
  
  const gradeResult = await gradeAsset(assetData);
  const optimizationResult = await optimizeAsset({
    asset: assetData,
    useAI: false // Set to true for AI suggestions
  });
  
  return (
    <div>
      <h1>{assetData.title}</h1>
      <p>Grade: {gradeResult.grade.score}/100</p>
      {/* Render optimization suggestions */}
    </div>
  );
}
```

### Client Component

```javascript
'use client';
import { useState } from 'react';

export default function OptimizePage() {
  const [result, setResult] = useState(null);
  
  const handleOptimize = async () => {
    const response = await fetch('/api/optimize-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset: assetData, useAI: true })
    });
    
    const data = await response.json();
    setResult(data);
  };
  
  // Render optimization interface...
}
```

## Environment Variables

Add to your `.env.local` file:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

## Project Structure

```
unity-asset-optimizer/
├── index.mjs              # Main module exports
├── index.cjs              # CommonJS compatibility
├── main.mjs               # CLI interface
├── package.json           # Package configuration
├── src/                   # Core modules
│   ├── optimizer.mjs      # Main orchestrator
│   ├── grader.mjs         # Scoring system
│   ├── ai-suggestions.mjs # AI integration
│   ├── similarity.mjs     # Asset similarity
│   └── ...
├── examples/              # Integration examples
│   ├── nextjs-api-route.js
│   ├── nextjs-optimization-page.js
│   ├── simple-usage.js
│   └── batch-processing.js
└── data/                  # Sample data files
```

## Scoring System

The optimizer uses a comprehensive 100-point scoring system:

- **Content (29 pts)**: Title quality, description completeness, messaging clarity
- **Media (20 pts)**: Image quality, video presence, visual demonstrations  
- **Trust (15 pts)**: Ratings, reviews, update recency, publisher reputation
- **Findability (15 pts)**: SEO keywords, tags, category alignment, pricing
- **Performance (21 pts)**: Conversion indicators, traffic quality metrics

## Error Handling

All functions return consistent response objects:

```javascript
{
  success: boolean,
  // On success:
  grade?: Object,
  analysis?: Object,
  // On error:
  error?: string,
  stack?: string  // Only in debug mode
}
```

## Dependencies

- `openai` - AI suggestions (optional)
- `crawlee` - Web scraping
- `puppeteer-extra` - Enhanced scraping capabilities

## License

MIT

## Examples

See the `/examples` directory for complete NextJS integration examples:

- **API Routes**: Both App Router and Pages Router examples
- **Server Components**: SSR with asset optimization
- **Client Components**: Interactive optimization interface
- **Batch Processing**: Handling multiple assets efficiently
- **Simple Usage**: Basic function usage examples

## Support

For issues and questions, please check the examples directory or open an issue on GitHub.