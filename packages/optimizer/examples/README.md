# Unity Asset Optimizer - NextJS Integration Examples

This directory contains examples of how to use the Unity Asset Optimizer module in NextJS applications.

## Installation

```bash
npm install unity-asset-optimizer
# or
yarn add unity-asset-optimizer
```

## Basic Usage

### ES Modules (Recommended)
```javascript
import { gradeAsset, optimizeAsset, scrapeAsset, OptimizerConfig } from 'unity-asset-optimizer';
```

### CommonJS (Legacy Support)
```javascript
const { gradeAsset, optimizeAsset, scrapeAsset, OptimizerConfig } = require('unity-asset-optimizer');
```

## Examples

1. **nextjs-api-route.js** - API route for grading assets
2. **nextjs-optimization-page.js** - Full page component for asset optimization
3. **nextjs-server-component.js** - Server component example
4. **simple-usage.js** - Basic usage examples
5. **batch-processing.js** - Processing multiple assets

## Environment Variables

Add these to your `.env.local` file:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

## NextJS Configuration

No special configuration is required. The module works with both:
- NextJS App Router (app directory)
- NextJS Pages Router (pages directory)
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes

## Error Handling

All functions return objects with `success` boolean and either `error` message or result data:

```javascript
const result = await gradeAsset(assetData);
if (result.success) {
  console.log('Grade:', result.grade);
} else {
  console.error('Error:', result.error);
}
```