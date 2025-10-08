'use client';

import { AspectRatio } from '@workspace/ui/components/aspect-ratio';
import { Image as ImageIcon } from 'lucide-react';
import { ImageWithFallback } from './image-with-fallback';
import type { ImageData } from './types';

interface ScreenshotsGalleryProps {
  images: ImageData[];
}

export function ScreenshotsGallery({ images }: ScreenshotsGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-muted-foreground">
          Screenshots ({images.length})
        </h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((image, index) => {
          const displayUrl = image.thumbnailUrl || image.imageUrl;
          
          return (
            <div key={`${image.imageUrl}-${index}`} className="group relative">
              <AspectRatio ratio={16 / 9}>
                <ImageWithFallback
                  key={`screenshot-${displayUrl}-${index}`}
                  src={displayUrl}
                  alt={`Screenshot ${index + 1}`}
                />
              </AspectRatio>
            </div>
          );
        })}
      </div>
    </div>
  );
}