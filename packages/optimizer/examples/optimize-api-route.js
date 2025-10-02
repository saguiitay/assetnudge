/**
 * NextJS API Route Example - Asset Optimization
 * 
 * This example shows how to create an API route for comprehensive asset optimization.
 * Place this file in: pages/api/optimize-asset.js or app/api/optimize-asset/route.js
 */

import { optimizeAsset, OptimizerConfig } from 'unity-asset-optimizer';

// For App Router (app directory)
export async function POST(request) {
  try {
    const { 
      asset, 
      url, 
      vocabulary, 
      exemplars, 
      neighbors, 
      useAI = false, 
      config 
    } = await request.json();
    
    // Validate required data
    if (!asset && !url) {
      return Response.json({ 
        error: 'Either asset data or URL is required' 
      }, { status: 400 });
    }
    
    // Create config
    const optimizerConfig = new OptimizerConfig({
      debug: config?.debug || false,
      apiKey: process.env.OPENAI_API_KEY,
      model: config?.model || 'gpt-4o-mini',
      ...config
    });
    
    // Optimize the asset
    const result = await optimizeAsset({
      asset,
      url,
      vocabulary: vocabulary || {},
      exemplars: exemplars || null,
      neighbors: neighbors || null,
      useAI,
      config: optimizerConfig
    });
    
    if (result.success) {
      return Response.json({
        success: true,
        asset: result.asset,
        grade: result.grade,
        analysis: result.analysis,
        meta: result.meta
      });
    } else {
      return Response.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Optimization error:', error);
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
    const { 
      asset, 
      url, 
      vocabulary, 
      exemplars, 
      neighbors, 
      useAI = false, 
      config 
    } = req.body;
    
    // Validate required data
    if (!asset && !url) {
      return res.status(400).json({ 
        error: 'Either asset data or URL is required' 
      });
    }
    
    // Create config
    const optimizerConfig = new OptimizerConfig({
      debug: config?.debug || false,
      apiKey: process.env.OPENAI_API_KEY,
      model: config?.model || 'gpt-4o-mini',
      ...config
    });
    
    // Optimize the asset
    const result = await optimizeAsset({
      asset,
      url,
      vocabulary: vocabulary || {},
      exemplars: exemplars || null,
      neighbors: neighbors || null,
      useAI,
      config: optimizerConfig
    });
    
    if (result.success) {
      res.status(200).json({
        success: true,
        asset: result.asset,
        grade: result.grade,
        analysis: result.analysis,
        meta: result.meta
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}