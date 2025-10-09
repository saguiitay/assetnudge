'use client';

import { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@workspace/ui/components/hover-card';
import { Button } from '@workspace/ui/components/button';
import { Info, RefreshCw, Copy } from 'lucide-react';
import { Asset } from '@repo/optimizer/src/types';

interface PromptHoverCardProps {
  fieldType: string;
  fieldName: string;
  getCurrentAssetData: () => Asset;
}

export function PromptHoverCard({
  fieldType,
  fieldName,
  getCurrentAssetData,
}: PromptHoverCardProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if we're in development/debug mode
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';
  
  // Don't render anything if not in development mode
  if (!isDevelopment) {
    return null;
  }

  const copyToClipboard = async (text: string | undefined) => {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const fetchFieldPrompt = async () => {
    if (isLoading) {
      return; // Already loaded or loading
    }

    setIsLoading(true);

    try {
      const currentAssetData = getCurrentAssetData();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/prompts?type=${fieldType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: currentAssetData
        }),
      });

      const result = await response.json();

      if (result.success && result.prompt) {
        setPrompt(result.prompt);
      } else {
        console.error('API response error:', result);
        // Fallback to a basic prompt if API fails
        const fallbackPrompts: Record<string, string> = {
          title: 'Generate a compelling and descriptive title for this digital asset.',
          short_description: 'Create a compelling short description for this digital asset.',
          long_description: 'Generate a comprehensive long description for this digital asset.',
          tags: 'Generate relevant tags and keywords for this digital asset.'
        };
        setPrompt(fallbackPrompts[fieldType] || 'Generate content for this field.');
      }
    } catch (error) {
      console.error('Failed to fetch field prompt:', error);
      // Use fallback prompt
      const fallbackPrompts: Record<string, string> = {
        title: 'Generate a compelling and descriptive title for this digital asset.',
        short_description: 'Create a compelling short description for this digital asset.',
        long_description: 'Generate a comprehensive long description for this digital asset.',
        tags: 'Generate relevant tags and keywords for this digital asset.'
      };
      setPrompt(fallbackPrompts[fieldType] || 'Generate content for this field.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button 
          type="button" 
          className="text-muted-foreground hover:text-foreground" 
          aria-label={`Show AI prompt for ${fieldName.toLowerCase()} generation`}
          onClick={fetchFieldPrompt}
        >
          <Info className="h-3 w-3" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">AI Prompt for {fieldName}</h4>
          {prompt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(prompt)}
              className="w-full gap-2 h-6 text-xs"
            >
              <Copy className="h-3 w-3" />
              Copy Prompt
            </Button>
          )}
          {isLoading ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading prompt...
            </div>
          ) : (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {prompt || 'Click to load prompt...'}
            </p>
          )}
          {prompt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(prompt)}
              className="w-full gap-2 h-6 text-xs"
            >
              <Copy className="h-3 w-3" />
              Copy Prompt
            </Button>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}