'use client';

import { AspectRatio } from '@workspace/ui/components/aspect-ratio';
import { Video, Play } from 'lucide-react';
import { ImageWithFallback } from './image-with-fallback';
import type { VideoData } from './types';

interface VideosGalleryProps {
  videos: VideoData[];
}

export function VideosGallery({ videos }: VideosGalleryProps) {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-muted-foreground">
          Videos ({videos.length})
        </h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {videos.map((video, index) => (
          <div key={index} className="group relative">
            <AspectRatio ratio={16 / 9}>
              {video.thumbnailUrl ? (
                <ImageWithFallback
                  src={video.thumbnailUrl}
                  alt={video.title || `Video ${index + 1}`}
                  enableRetry={true}
                  maxRetries={2}
                  onClick={() => {
                    console.log('Opening video:', video.videoUrl);
                    window.open(video.videoUrl, '_blank');
                  }}
                  placeholder={
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Video className="h-6 w-6" />
                      <span className="text-xs">Video {index + 1}</span>
                    </div>
                  }
                />
              ) : (
                <div 
                  className="rounded-lg border bg-muted flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => {
                    console.log('Opening video:', video.videoUrl);
                    window.open(video.videoUrl, '_blank');
                  }}
                >
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Video className="h-6 w-6" />
                    <span className="text-xs">Video {index + 1}</span>
                  </div>
                </div>
              )}
            </AspectRatio>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-5 w-5 text-gray-700 fill-gray-700" />
              </div>
            </div>
            {video.title && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {video.title}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}