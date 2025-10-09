'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Zap,
  FileText,
  Tag,
  Hash
} from 'lucide-react';
import { Asset } from '@repo/optimizer/src/types';

interface AssetGeneratorProps {
  currentAssetData: Asset | null;
  onGeneratedDataUpdate?: (generatedData: Partial<Asset>) => void;
}

interface GenerationField {
  key: keyof Asset;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const generationFields: GenerationField[] = [
  {
    key: 'title',
    label: 'Title',
    description: 'Generate an engaging and descriptive title',
    icon: <FileText className="h-4 w-4" />
  },
  {
    key: 'tags',
    label: 'Tags',
    description: 'Generate relevant keywords and tags',
    icon: <Tag className="h-4 w-4" />
  },
  {
    key: 'short_description',
    label: 'Short Description',
    description: 'Create a compelling brief summary',
    icon: <Hash className="h-4 w-4" />
  },
  {
    key: 'long_description',
    label: 'Long Description',
    description: 'Generate detailed educational content',
    icon: <FileText className="h-4 w-4" />
  }
];

export function AssetGenerator({ currentAssetData, onGeneratedDataUpdate }: AssetGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Partial<Asset> | null>(null);

  // Check if we're in development/debug mode
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';

  const generateField = async (fieldKey: keyof Asset) => {
    if (!currentAssetData) {
      setGenerationError('No asset data available. Please import or create an asset first.');
      return;
    }

    setIsGenerating(prev => ({ ...prev, [fieldKey]: true }));
    setGenerationError(null);
    setGenerationSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

      const response = await fetch(`${apiUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetData: currentAssetData,
          generateFields: [fieldKey],
          generateAll: false,
          debug: isDevelopment
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setGenerationError(result.error || `Failed to generate ${fieldKey}`);
        return;
      }

      const generatedData = result.optimizedAsset || result.generated || {};
      
      // Validate and sanitize the generated data
      const sanitizedData: Partial<Asset> = {};
      
      if (generatedData[fieldKey]) {
        if (fieldKey === 'title' && typeof generatedData.title === 'string') {
          sanitizedData.title = generatedData.title.slice(0, 100);
        } else if (fieldKey === 'short_description' && typeof generatedData.short_description === 'string') {
          sanitizedData.short_description = generatedData.short_description.slice(0, 200);
        } else if (fieldKey === 'long_description' && typeof generatedData.long_description === 'string') {
          sanitizedData.long_description = generatedData.long_description.slice(0, 5000);
        } else if (fieldKey === 'tags' && Array.isArray(generatedData.tags)) {
          sanitizedData.tags = generatedData.tags
            .filter((tag: any) => typeof tag === 'string')
            .slice(0, 20);
        }
      }

      console.log('Generated data received:', result);
      console.log('Sanitized data:', sanitizedData);

      setLastGenerated(sanitizedData);
      setGenerationSuccess(`Successfully generated ${fieldKey}!`);
      
      // Update the parent component with generated data
      onGeneratedDataUpdate?.(sanitizedData);
      
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(`Failed to generate ${fieldKey}. Please check your connection and try again.`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const generateAllFields = async () => {
    if (!currentAssetData) {
      setGenerationError('No asset data available. Please import or create an asset first.');
      return;
    }

    setIsGenerating(prev => ({ ...prev, all: true }));
    setGenerationError(null);
    setGenerationSuccess(null);
    setLastGenerated(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const fieldsToGenerate = generationFields.map(field => field.key);

      const response = await fetch(`${apiUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetData: currentAssetData,
          generateFields: fieldsToGenerate,
          generateAll: true,
          debug: isDevelopment
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setGenerationError(result.error || 'Failed to generate asset details');
        return;
      }

      const generatedData = result.optimizedAsset || result.generated || {};
      
      // Validate and sanitize the generated data
      const sanitizedData: Partial<Asset> = {};
      
      if (generatedData.title && typeof generatedData.title === 'string') {
        sanitizedData.title = generatedData.title.slice(0, 100);
      }
      
      if (generatedData.short_description && typeof generatedData.short_description === 'string') {
        sanitizedData.short_description = generatedData.short_description.slice(0, 200);
      }
      
      if (generatedData.long_description && typeof generatedData.long_description === 'string') {
        sanitizedData.long_description = generatedData.long_description.slice(0, 5000);
      }
      
      if (generatedData.tags && Array.isArray(generatedData.tags)) {
        sanitizedData.tags = generatedData.tags
          .filter((tag: any) => typeof tag === 'string')
          .slice(0, 20);
      }

      console.log('Generated data received:', result);
      console.log('Sanitized data:', sanitizedData);

      setLastGenerated(sanitizedData);
      setGenerationSuccess(`Successfully generated ${Object.keys(sanitizedData).length} field(s)!`);
      
      // Update the parent component with generated data
      onGeneratedDataUpdate?.(sanitizedData);
      
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError('Failed to generate asset details. Please check your connection and try again.');
    } finally {
      setIsGenerating(prev => ({ ...prev, all: false }));
    }
  };

  if (!currentAssetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Asset Generator
          </CardTitle>
          <CardDescription>
            Generate and enhance asset details using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Import or create an asset to start generating enhanced details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Asset Generator
        </CardTitle>
        <CardDescription>
          Use AI to generate and enhance your asset details for better discoverability and engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generate All Fields Option */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Option 1: Generate All Fields</h4>
          <p className="text-xs text-muted-foreground">
            Generate all asset details at once using AI optimization
          </p>
          <Button 
            onClick={() => generateAllFields()}
            disabled={Object.values(isGenerating).some(Boolean)}
            className="w-full gap-2"
          >
            {isGenerating.all ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate All Details
          </Button>
        </div>

        <Separator />

        {/* Generate Individual Fields Option */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Option 2: Generate Individual Fields</h4>
            <p className="text-xs text-muted-foreground">
              Generate specific fields one at a time for more control
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {generationFields.map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {field.icon}
                  <div className="flex-1">
                    <span className="text-sm font-medium">{field.label}</span>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => generateField(field.key)}
                  disabled={Object.values(isGenerating).some(Boolean)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isGenerating[field.key] ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Generate
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {generationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}

        {generationSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{generationSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Last Generated Preview */}
        {lastGenerated && Object.keys(lastGenerated).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Last Generated
            </h4>
            <div className="space-y-2">
              {Object.entries(lastGenerated).map(([key, value]) => (
                <div key={key} className="text-xs border rounded p-2 bg-muted/50">
                  <div className="font-medium mb-1 capitalize">{key.replace('_', ' ')}</div>
                  <div className="text-muted-foreground">
                    {Array.isArray(value) 
                      ? value.join(', ')
                      : typeof value === 'string' 
                        ? value.length > 100 
                          ? value.slice(0, 100) + '...'
                          : value
                        : String(value)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {Object.values(isGenerating).some(Boolean) && (
          <div className="text-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">
              Generating enhanced asset details...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}