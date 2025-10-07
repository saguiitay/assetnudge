'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Separator } from '@workspace/ui/components/separator';
import {
  Search,
  ExternalLink,
  Star,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Heart,
  Eye,
  Download,
  DollarSign,
  Archive,
  Tag
} from 'lucide-react';

interface AssetData {
  title: string;
  short_description: string;
  long_description: string;
  tags: string[];
  category: string;
  price: number;
  size: number;
}

interface SimilarAsset {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  reviews: number;
  downloads: number;
  url: string;
  thumbnail?: string;
  publisher: string;
  relevanceScore: number;
  reasons: string[];
}

interface SimilarAssetsProps {
  currentAssetData: AssetData | null;
}

export function SimilarAssets({ currentAssetData }: SimilarAssetsProps) {
  const [similarAssets, setSimilarAssets] = useState<SimilarAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const searchSimilarAssets = async () => {
    if (!currentAssetData) {
      setError('No asset data available to search for similar assets');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSimilarAssets([]);
    setSearchTriggered(true);

    try {
      // For now, we'll create mock data since the API endpoint doesn't exist yet
      // TODO: Replace with actual API call when backend is implemented
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Mock similar assets based on current asset data
      const mockAssets: SimilarAsset[] = generateMockSimilarAssets(currentAssetData);
      
      setSimilarAssets(mockAssets);
    } catch (error) {
      console.error('Similar assets search error:', error);
      setError('Failed to find similar assets. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when asset data changes
  useEffect(() => {
    if (currentAssetData && !searchTriggered) {
      searchSimilarAssets();
    }
  }, [currentAssetData]);

  // Generate mock similar assets based on current asset data
  const generateMockSimilarAssets = (assetData: AssetData): SimilarAsset[] => {
    const baseAssets = [
      {
        id: '1',
        title: 'Advanced Physics Simulation Kit',
        description: 'Comprehensive physics simulation tools for educational games',
        category: assetData.category || 'Educational',
        tags: ['physics', 'simulation', 'education', 'interactive'],
        price: 49.99,
        rating: 4.8,
        reviews: 127,
        downloads: 2340,
        url: 'https://assetstore.unity.com/packages/example-1',
        publisher: 'EduSoft Studios',
        relevanceScore: 95,
        reasons: ['Same category', 'Similar educational focus', 'High community rating']
      },
      {
        id: '2',
        title: 'Interactive Learning Components',
        description: 'Ready-to-use educational game components and templates',
        category: assetData.category || 'Educational',
        tags: ['education', 'templates', 'components', 'learning'],
        price: 29.99,
        rating: 4.6,
        reviews: 89,
        downloads: 1560,
        url: 'https://assetstore.unity.com/packages/example-2',
        publisher: 'LearnCraft',
        relevanceScore: 88,
        reasons: ['Similar tags', 'Educational focus', 'Compatible price range']
      },
      {
        id: '3',
        title: 'STEM Learning Toolkit',
        description: 'Complete toolkit for creating STEM educational experiences',
        category: assetData.category || 'Educational',
        tags: ['stem', 'education', 'science', 'math'],
        price: 79.99,
        rating: 4.9,
        reviews: 203,
        downloads: 3120,
        url: 'https://assetstore.unity.com/packages/example-3',
        publisher: 'STEM Solutions',
        relevanceScore: 92,
        reasons: ['High rating', 'Popular in category', 'Extensive feature set']
      },
      {
        id: '4',
        title: 'Educational Game Framework',
        description: 'Framework for rapid development of educational games',
        category: assetData.category || 'Educational',
        tags: ['framework', 'education', 'rapid development'],
        price: 19.99,
        rating: 4.4,
        reviews: 156,
        downloads: 980,
        url: 'https://assetstore.unity.com/packages/example-4',
        publisher: 'GameEdu Pro',
        relevanceScore: 85,
        reasons: ['Lower price point', 'Good for beginners', 'Framework approach']
      }
    ];

    // Customize based on current asset data
    return baseAssets.map(asset => ({
      ...asset,
      tags: [...asset.tags, ...assetData.tags.slice(0, 2)]
    }));
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (!currentAssetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Similar Assets
          </CardTitle>
          <CardDescription>
            Discover exemplar assets for reference and inspiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Import or create an asset to find similar examples</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Similar Assets
        </CardTitle>
        <CardDescription>
          Exemplar assets that share characteristics with your asset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {similarAssets.length > 0 
              ? `Found ${similarAssets.length} similar assets`
              : 'No search performed yet'
            }
          </div>
          <Button
            onClick={searchSimilarAssets}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoading ? 'Searching...' : 'Refresh Search'}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={searchSimilarAssets}
                className="ml-2"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Similar Assets List */}
        {similarAssets.length > 0 && !isLoading && (
          <div className="space-y-4">
            {similarAssets.map((asset) => (
              <div key={asset.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                {/* Asset Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                      {asset.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {asset.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      by {asset.publisher}
                    </div>
                  </div>
                  <div className={`text-right ${getRelevanceColor(asset.relevanceScore)}`}>
                    <div className="text-sm font-medium">
                      {asset.relevanceScore}%
                    </div>
                    <div className="text-xs">match</div>
                  </div>
                </div>

                {/* Asset Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {asset.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {asset.tags.length > 4 && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      +{asset.tags.length - 4} more
                    </Badge>
                  )}
                </div>

                {/* Asset Stats */}
                <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{asset.rating}</span>
                    <span className="text-muted-foreground">({asset.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3 text-blue-500" />
                    <span>{asset.downloads.toLocaleString()}</span>
                  </div>
                </div>

                {/* Relevance Reasons */}
                {asset.reasons.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium mb-1">Why it's similar:</div>
                    <div className="flex flex-wrap gap-1">
                      {asset.reasons.map((reason, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="my-3" />

                {/* Asset Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatPrice(asset.price)}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Archive className="h-3 w-3" />
                      {asset.category}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.open(asset.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {similarAssets.length === 0 && !isLoading && !error && searchTriggered && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">No similar assets found</p>
            <p className="text-sm">Try adjusting your asset details or search again</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}