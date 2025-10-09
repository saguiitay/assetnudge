'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Progress } from '@workspace/ui/components/progress';
import { Button } from '@workspace/ui/components/button';
import { 
  GraduationCap, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Asset } from '@repo/optimizer/src/types';

interface GradeResult {
  score: number;
  letter: string;
  reasons?: string[];
  breakdown?: {
    content?: number;
    media?: number;
    trust?: number;
    findability?: number;
  };
  weights?: {
    content?: Record<string, number>;
    media?: Record<string, number>;
    trust?: Record<string, number>;
    find?: Record<string, number>;
  };
  [key: string]: any;
}

interface AssetGradeProps {
  assetData: Asset | null;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
  autoGrade?: boolean;
}

export function AssetGrade({ assetData, onRefresh, isLoading = false, error = null, autoGrade = true }: AssetGradeProps) {
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradedAt, setGradedAt] = useState<string | null>(null);

  const gradeAsset = useCallback(async () => {
    if (!assetData) {
      setGradeError('No asset data available to grade');
      return;
    }

    setGrading(true);
    setGradeError(null);
    setGradeResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetData,
          debug: false
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setGradeError(result.error || 'Failed to grade asset');
        return;
      }

      // Validate and sanitize the grade result - handle nested structure
      const gradeData = result.grade?.grade || result.grade || {};
      const sanitizedGrade = {
        score: typeof gradeData.score === 'number' && !isNaN(gradeData.score) ? gradeData.score : 0,
        letter: typeof gradeData.letter === 'string' ? gradeData.letter : 'F',
        reasons: Array.isArray(gradeData.reasons) ? gradeData.reasons : [],
        breakdown: {
          content: typeof gradeData.breakdown?.content === 'number' && !isNaN(gradeData.breakdown.content) ? gradeData.breakdown.content : 0,
          media: typeof gradeData.breakdown?.media === 'number' && !isNaN(gradeData.breakdown.media) ? gradeData.breakdown.media : 0,
          trust: typeof gradeData.breakdown?.trust === 'number' && !isNaN(gradeData.breakdown.trust) ? gradeData.breakdown.trust : 0,
          findability: typeof gradeData.breakdown?.findability === 'number' && !isNaN(gradeData.breakdown.findability) ? gradeData.breakdown.findability : 0,
        },
      };

      console.log('Grade result received:', result);
      console.log('Sanitized grade:', sanitizedGrade);

      setGradeResult(sanitizedGrade);
      setGradedAt(result.graded_at);
    } catch (error) {
      console.error('Grade error:', error);
      setGradeError('Failed to grade asset. Please check your connection and try again.');
    } finally {
      setGrading(false);
    }
  }, [assetData]);

  // Auto-grade when asset data is available and autoGrade is enabled
  useEffect(() => {
    if (assetData && autoGrade && !gradeResult && !grading) {
      gradeAsset();
    }
  }, [assetData, autoGrade, gradeResult, grading, gradeAsset]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  // Helper function to safely get numeric score with fallback
  const getSafeScore = (score: number | undefined | null): number => {
    if (typeof score !== 'number' || isNaN(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
  };

  // Helper function to normalize breakdown scores to percentage based on their max possible scores
  const getNormalizedBreakdownScore = (score: number | undefined | null, category: 'content' | 'media' | 'trust' | 'findability'): number => {
    const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;
    
    // Get maximum possible scores from the API response weights, or fall back to defaults
    let maxScore: number;
    
    if (gradeResult?.weights) {
      // Calculate max score from actual weights used in grading
      switch (category) {
        case 'content':
          maxScore = gradeResult.weights.content ? Object.values(gradeResult.weights.content).reduce((a, b) => a + b, 0) : 35;
          break;
        case 'media':
          maxScore = gradeResult.weights.media ? Object.values(gradeResult.weights.media).reduce((a, b) => a + b, 0) : 20;
          break;
        case 'trust':
          maxScore = gradeResult.weights.trust ? Object.values(gradeResult.weights.trust).reduce((a, b) => a + b, 0) : 19;
          break;
        case 'findability':
          maxScore = gradeResult.weights.find ? Object.values(gradeResult.weights.find).reduce((a, b) => a + b, 0) : 15;
          break;
        default:
          maxScore = 35;
      }
    } else {
      // Fallback to default maximum scores if weights are not available
      const defaultMaxScores = {
        content: 35,    // title: 6, short: 6, long: 8, bullets: 7, cta: 3, uvp: 5
        media: 20,      // images: 8, video: 8, gif: 4  
        trust: 19,      // freshness: 6, documentation: 3, completeness: 2, publishNotes: 1, rating: 4, reviews: 3
        findability: 15 // tagcov: 7, titlekw: 5, pricez: 3
      };
      maxScore = defaultMaxScores[category];
    }

    const normalizedScore = (safeScore / maxScore) * 100;
    return Math.max(0, Math.min(100, normalizedScore));
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Asset Grade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!assetData && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Asset Grade
          </CardTitle>
          <CardDescription>
            Import or create an asset to see its educational grade and recommendations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Asset Grade
        </CardTitle>
        <CardDescription>
          Educational assessment and recommendations for your asset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {grading && (
          <div className="text-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Grading asset...</p>
          </div>
        )}

        {gradeError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{gradeError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={gradeAsset}
                className="ml-2"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {gradeResult && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(getSafeScore(gradeResult.score))}`}>
                {Math.round(getSafeScore(gradeResult.score))}
              </div>
              <Badge variant={getScoreBadgeVariant(getSafeScore(gradeResult.score))} className="mb-2">
                Grade {gradeResult.letter || 'F'}
              </Badge>
              {gradedAt && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Graded {new Date(gradedAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Score Breakdown */}
            {gradeResult.breakdown && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Score Breakdown</h4>
                
                {(() => {
                  // Calculate normalized scores once to avoid duplicate calls
                  const normalizedScores = {
                    content: getNormalizedBreakdownScore(gradeResult.breakdown.content, 'content'),
                    media: getNormalizedBreakdownScore(gradeResult.breakdown.media, 'media'),
                    trust: getNormalizedBreakdownScore(gradeResult.breakdown.trust, 'trust'),
                    findability: getNormalizedBreakdownScore(gradeResult.breakdown.findability, 'findability')
                  };

                  return (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Content</span>
                          <span className={getScoreColor(normalizedScores.content)}>
                            {Math.round(normalizedScores.content)}%
                          </span>
                        </div>
                        <Progress value={normalizedScores.content} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Media</span>
                          <span className={getScoreColor(normalizedScores.media)}>
                            {Math.round(normalizedScores.media)}%
                          </span>
                        </div>
                        <Progress value={normalizedScores.media} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Trust</span>
                          <span className={getScoreColor(normalizedScores.trust)}>
                            {Math.round(normalizedScores.trust)}%
                          </span>
                        </div>
                        <Progress value={normalizedScores.trust} className="h-2" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Findability</span>
                          <span className={getScoreColor(normalizedScores.findability)}>
                            {Math.round(normalizedScores.findability)}%
                          </span>
                        </div>
                        <Progress value={normalizedScores.findability} className="h-2" />
                      </div>
                    </>
                  );
                })()}

              </div>
            )}

            {/* Improvement Areas / Reasons */}
            {gradeResult.reasons && gradeResult.reasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {gradeResult.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Refresh Button */}
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={gradeAsset}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Re-grade Asset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}