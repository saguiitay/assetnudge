/**
 * NextJS Page Component Example - Asset Optimization Dashboard
 * 
 * This example shows how to create a full page component that optimizes Unity assets.
 * Place this file in: pages/optimize.js or app/optimize/page.js
 */

'use client'; // For App Router components that use state

import { useState } from 'react';

export default function OptimizePage() {
  const [assetData, setAssetData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    price: 0
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/optimize-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: assetData,
          useAI: true,
          config: {
            debug: false
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to optimize asset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/grade-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: assetData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult({ grade: data.grade, asset: data.asset });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to grade asset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Unity Asset Optimizer</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={assetData.title}
                onChange={(e) => setAssetData({...assetData, title: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={assetData.description}
                onChange={(e) => setAssetData({...assetData, description: e.target.value})}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={assetData.category}
                onChange={(e) => setAssetData({...assetData, category: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select Category</option>
                <option value="Tools">Tools</option>
                <option value="Scripts">Scripts</option>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="Audio">Audio</option>
                <option value="Animation">Animation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
              <input
                type="text"
                value={assetData.tags.join(', ')}
                onChange={(e) => setAssetData({...assetData, tags: e.target.value.split(',').map(t => t.trim())})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input
                type="number"
                value={assetData.price}
                onChange={(e) => setAssetData({...assetData, price: parseFloat(e.target.value) || 0})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleGrade}
              disabled={loading || !assetData.title}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Grade Asset'}
            </button>
            
            <button
              onClick={handleOptimize}
              disabled={loading || !assetData.title}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Optimize Asset'}
            </button>
          </div>
        </div>
        
        {/* Results */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {result && (
            <div className="space-y-4">
              {result.grade && (
                <div>
                  <h3 className="text-lg font-medium">Grade</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-2xl font-bold">
                      {result.grade.score}/100 ({result.grade.letter})
                    </p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(result.grade.breakdown || {}).map(([category, score]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}:</span>
                          <span>{score.toFixed(1)}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {result.analysis && (
                <div>
                  <h3 className="text-lg font-medium">Optimization Suggestions</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    {result.analysis.suggestions && (
                      <div className="space-y-2">
                        {result.analysis.suggestions.suggested_title && (
                          <div>
                            <strong>Suggested Title:</strong>
                            <p className="text-sm">{result.analysis.suggestions.suggested_title}</p>
                          </div>
                        )}
                        {result.analysis.suggestions.suggested_tags && result.analysis.suggestions.suggested_tags.length > 0 && (
                          <div>
                            <strong>Suggested Tags:</strong>
                            <p className="text-sm">{result.analysis.suggestions.suggested_tags.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {result.analysis.ai_suggestions && (
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <strong>AI Suggestions:</strong>
                        <pre className="text-sm whitespace-pre-wrap mt-2">
                          {JSON.stringify(result.analysis.ai_suggestions, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}