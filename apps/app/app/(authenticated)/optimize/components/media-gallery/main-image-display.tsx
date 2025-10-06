'use client';

import { AspectRatio } from '@repo/design-system/components/ui/aspect-ratio';
import { Image as ImageIcon } from 'lucide-react';
import { ImageWithFallback } from './image-with-fallback';
import type { MainImageData } from './types';

interface MainImageDisplayProps {
  mainImage: MainImageData;
  title?: string;
}

export function MainImageDisplay({ mainImage, title }: MainImageDisplayProps) {
  if (!mainImage?.big && !mainImage?.small) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Main Image</h4>
        <div className="max-w-md p-4 border rounded-lg text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
          <span className="text-xs">No main image available</span>
        </div>
      </div>
    );
  }

  const imageUrl = mainImage.big || mainImage.small;
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Main Image</h4>
      <div className="max-w-md">
          <ImageWithFallback
            src={imageUrl!}
            alt={title || 'Asset main image'}
            enableRetry={true}
            maxRetries={2}
            placeholder={
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs">Main Image</span>
              </div>
            }
          />
      </div>
    </div>
  );
}