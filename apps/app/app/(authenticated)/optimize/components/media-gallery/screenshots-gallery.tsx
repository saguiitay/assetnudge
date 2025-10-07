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
                  enableRetry={true}
                  maxRetries={2}
                  onClick={() => {
                    console.log('Opening full image:', image.imageUrl);
                    window.open(image.imageUrl, '_blank');
                  }}
                  placeholder={
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">Screenshot {index + 1}</span>
                    </div>
                  }
                />
              </AspectRatio>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="bg-white/90 rounded-full p-2">
                  <ImageIcon className="h-4 w-4 text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}