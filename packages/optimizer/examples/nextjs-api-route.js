/**
 * NextJS API Route Example - Asset Grading
 * 
 * This example shows how to create an API route in NextJS that grades Unity assets.
 * Place this file in: pages/api/grade-asset.js or app/api/grade-asset/route.js
 */

import { gradeAsset, OptimizerConfig } from 'unity-asset-optimizer';

// For App Router (app directory)
export async function POST(request) {
  try {
    const { asset, vocabulary, config } = await request.json();
    
    // Validate required data
    if (!asset) {
      return Response.json({ error: 'Asset data is required' }, { status: 400 });
    }
    
    // Create config
    const optimizerConfig = new OptimizerConfig({
      debug: config?.debug || false,
      apiKey: process.env.OPENAI_API_KEY,
      ...config
    });
    
    // Grade the asset
    const result = await gradeAsset(asset, vocabulary || {}, optimizerConfig);
    
    if (result.success) {
      return Response.json({
        success: true,
        grade: result.grade,
        asset: result.asset
      });
    } else {
      return Response.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Grading error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// For Pages Router (pages directory)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { asset, vocabulary, config } = req.body;
    
    // Validate required data
    if (!asset) {
      return res.status(400).json({ error: 'Asset data is required' });
    }
    
    // Create config
    const optimizerConfig = new OptimizerConfig({
      debug: config?.debug || false,
      apiKey: process.env.OPENAI_API_KEY,
      ...config
    });
    
    // Grade the asset
    const result = await gradeAsset(asset, vocabulary || {}, optimizerConfig);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        grade: result.grade,
        asset: result.asset
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Usage from frontend:
// const response = await fetch('/api/grade-asset', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({
//     asset: {
//       title: 'Amazing Unity Tool',
//       description: 'This is a fantastic tool for Unity developers...',
//       category: 'Tools',
//       tags: ['unity', 'tool', 'development'],
//       price: 29.99
//     },
//     vocabulary: {}, // vocabulary data
//     config: {
//       debug: false
//     }
//   })
// });
//
// const result = await response.json();
// if (result.success) {
//   console.log('Asset grade:', result.grade.score);
// } else {
//   console.error('Error:', result.error);
// }