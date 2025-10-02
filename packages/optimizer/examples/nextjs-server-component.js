/**
 * NextJS Server Component Example
 * 
 * This example shows how to use the optimizer in a server component for SSR.
 * Place this file in: app/asset/[id]/page.js (App Router)
 */

import { gradeAsset, optimizeAsset, OptimizerConfig } from 'unity-asset-optimizer';

// This is a server component - it runs on the server side
export default async function AssetPage({ params }) {
  const { id } = params;
  
  // In a real app, you'd fetch asset data from your database
  const assetData = await fetchAssetFromDatabase(id);
  
  if (!assetData) {
    return <div>Asset not found</div>;
  }
  
  // Create config for server-side processing
  const config = new OptimizerConfig({
    debug: process.env.NODE_ENV === 'development',
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // Grade the asset on the server
  const gradeResult = await gradeAsset(assetData, {}, config);
  
  // Optimize the asset (without AI for faster SSR)
  const optimizationResult = await optimizeAsset({
    asset: assetData,
    useAI: false, // Set to true if you want AI suggestions in SSR
    config
  });
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{assetData.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Details</h2>
          <div className="space-y-2">
            <p><strong>Category:</strong> {assetData.category}</p>
            <p><strong>Price:</strong> ${assetData.price}</p>
            <p><strong>Tags:</strong> {assetData.tags?.join(', ') || 'None'}</p>
            <p><strong>Description:</strong></p>
            <p className="text-gray-700">{assetData.description}</p>
          </div>
        </div>
        
        {/* Grade Display */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Grade</h2>
          {gradeResult.success ? (
            <div>
              <div className="text-4xl font-bold text-center mb-4">
                <span className={getGradeColor(gradeResult.grade.letter)}>
                  {gradeResult.grade.score}/100
                </span>
                <div className="text-lg">({gradeResult.grade.letter})</div>
              </div>
              
              {gradeResult.grade.breakdown && (
                <div className="space-y-2">
                  <h3 className="font-medium">Score Breakdown:</h3>
                  {Object.entries(gradeResult.grade.breakdown).map(([category, score]) => (
                    <div key={category} className="flex justify-between">
                      <span className="capitalize">{category.replace('_', ' ')}:</span>
                      <span>{score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">
              Error grading asset: {gradeResult.error}
            </div>
          )}
        </div>
      </div>
      
      {/* Optimization Suggestions */}
      {optimizationResult.success && (
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Optimization Suggestions</h2>
          
          {optimizationResult.analysis?.suggestions && (
            <div className="space-y-4">
              {optimizationResult.analysis.suggestions.suggested_title && (
                <div>
                  <h3 className="font-medium">Suggested Title Improvements:</h3>
                  <p className="text-gray-700 italic">
                    "{optimizationResult.analysis.suggestions.suggested_title}"
                  </p>
                </div>
              )}
              
              {optimizationResult.analysis.suggestions.suggested_tags?.length > 0 && (
                <div>
                  <h3 className="font-medium">Suggested Tags:</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {optimizationResult.analysis.suggestions.suggested_tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {optimizationResult.analysis.suggestions.suggested_description && (
                <div>
                  <h3 className="font-medium">Suggested Description Improvements:</h3>
                  <p className="text-gray-700 text-sm">
                    {optimizationResult.analysis.suggestions.suggested_description}
                  </p>
                </div>
              )}
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Coaching Strategy:</strong> {optimizationResult.analysis.coaching_strategy}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Analysis Time:</strong> {optimizationResult.meta.analyzed_at}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get grade color
function getGradeColor(letter) {
  switch (letter) {
    case 'A': return 'text-green-600';
    case 'B': return 'text-blue-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

// Mock function - replace with your actual database query
async function fetchAssetFromDatabase(id) {
  // This would normally fetch from your database
  // For demo purposes, returning mock data
  return {
    id,
    title: 'Example Unity Asset',
    description: 'This is a sample Unity asset for demonstration purposes...',
    category: 'Tools',
    tags: ['unity', 'tool', 'development'],
    price: 29.99,
    url: `https://assetstore.unity.com/packages/tools/example-${id}`
  };
}

// Metadata for SEO
export async function generateMetadata({ params }) {
  const assetData = await fetchAssetFromDatabase(params.id);
  
  return {
    title: assetData ? `${assetData.title} - Unity Asset Analysis` : 'Asset Not Found',
    description: assetData ? `Analysis and optimization suggestions for ${assetData.title}` : 'Asset not found'
  };
}