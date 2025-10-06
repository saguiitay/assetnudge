'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Zap,
  FileText,
  Tag,
  Hash,
  DollarSign,
  Archive
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

interface AssetGeneratorProps {
  currentAssetData: AssetData | null;
  onGeneratedDataUpdate?: (generatedData: Partial<AssetData>) => void;
}

interface GenerationOption {
  key: keyof AssetData;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const generationOptions: GenerationOption[] = [
  {
    key: 'title',
    label: 'Title',
    description: 'Generate an engaging and descriptive title',
    icon: <FileText className="h-4 w-4" />
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
  },
  {
    key: 'tags',
    label: 'Tags',
    description: 'Generate relevant keywords and tags',
    icon: <Tag className="h-4 w-4" />
  },
  {
    key: 'category',
    label: 'Category',
    description: 'Suggest the most appropriate category',
    icon: <Archive className="h-4 w-4" />
  },
  {
    key: 'price',
    label: 'Price',
    description: 'Recommend optimal pricing',
    icon: <DollarSign className="h-4 w-4" />
  }
];

export function AssetGenerator({ currentAssetData, onGeneratedDataUpdate }: AssetGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<keyof AssetData>>(new Set());
  const [lastGenerated, setLastGenerated] = useState<Partial<AssetData> | null>(null);

  const toggleField = (field: keyof AssetData) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const selectAllFields = () => {
    setSelectedFields(new Set(generationOptions.map(opt => opt.key)));
  };

  const clearSelection = () => {
    setSelectedFields(new Set());
  };

  const generateAssetDetails = async (generateAll: boolean = false) => {
    if (!currentAssetData) {
      setGenerationError('No asset data available. Please import or create an asset first.');
      return;
    }

    if (!generateAll && selectedFields.size === 0) {
      setGenerationError('Please select at least one field to generate.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);
    setLastGenerated(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const fieldsToGenerate = generateAll ? 
        generationOptions.map(opt => opt.key) : 
        Array.from(selectedFields);

      const response = await fetch(`${apiUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetData: currentAssetData,
          generateFields: fieldsToGenerate,
          generateAll,
          debug: false
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setGenerationError(result.error || 'Failed to generate asset details');
        return;
      }

      const generatedData = result.optimizedAsset || result.generated || {};
      
      // Validate and sanitize the generated data
      const sanitizedData: Partial<AssetData> = {};
      
      if (generatedData.title && typeof generatedData.title === 'string') {
        sanitizedData.title = generatedData.title.slice(0, 100);
      }
      
      if (generatedData.short_description && typeof generatedData.short_description === 'string') {
        sanitizedData.short_description = generatedData.short_description.slice(0, 200);
      }
      
      if (generatedData.long_description && typeof generatedData.long_description === 'string') {
        sanitizedData.long_description = generatedData.long_description.slice(0, 5000);
      }
      
      if (generatedData.category && typeof generatedData.category === 'string') {
        sanitizedData.category = generatedData.category;
      }
      
      if (generatedData.tags && Array.isArray(generatedData.tags)) {
        sanitizedData.tags = generatedData.tags
          .filter((tag: any) => typeof tag === 'string')
          .slice(0, 20);
      }
      
      if (typeof generatedData.price === 'number' && !isNaN(generatedData.price)) {
        sanitizedData.price = Math.max(0, generatedData.price);
      }

      console.log('Generated data received:', result);
      console.log('Sanitized data:', sanitizedData);

      setLastGenerated(sanitizedData);
      setGenerationSuccess(`Successfully generated ${Object.keys(sanitizedData).length} field(s)!`);
      
      // Update the parent component with generated data
      onGeneratedDataUpdate?.(sanitizedData);
      
      // Clear selection after successful generation
      if (!generateAll) {
        setSelectedFields(new Set());
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError('Failed to generate asset details. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
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
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => generateAssetDetails(true)}
            disabled={isGenerating}
            className="flex-1 gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Generate All Details
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={selectAllFields}
              size="sm"
              disabled={isGenerating}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              onClick={clearSelection}
              size="sm"
              disabled={isGenerating}
            >
              Clear
            </Button>
          </div>
        </div>

        <Separator />

        {/* Field Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Generate Specific Fields</h4>
            <Badge variant="outline">
              {selectedFields.size} selected
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {generationOptions.map((option) => (
              <div
                key={option.key}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={`generate-${option.key}`}
                  checked={selectedFields.has(option.key)}
                  onCheckedChange={() => toggleField(option.key)}
                  disabled={isGenerating}
                />
                <div className="flex items-center gap-2 flex-1">
                  {option.icon}
                  <div className="flex-1">
                    <label
                      htmlFor={`generate-${option.key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                {currentAssetData[option.key] && (
                  <Badge variant="secondary" className="text-xs">
                    Has data
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generate Selected Button */}
        {selectedFields.size > 0 && (
          <Button 
            onClick={() => generateAssetDetails(false)}
            disabled={isGenerating}
            variant="outline"
            className="w-full gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Generate Selected Fields ({selectedFields.size})
          </Button>
        )}

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
        {isGenerating && (
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