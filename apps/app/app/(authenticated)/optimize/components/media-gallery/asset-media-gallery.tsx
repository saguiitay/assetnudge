'use client';

import { FieldLabel } from '@workspace/ui/components/field';
import { MainImageDisplay } from './main-image-display';
import { ScreenshotsGallery } from './screenshots-gallery';
import { VideosGallery } from './videos-gallery';
import { NoMediaMessage } from './no-media-message';
import type { MediaData } from './types';

interface AssetMediaGalleryProps {
  data: MediaData;
  showIfEmpty?: boolean;
}

export function AssetMediaGallery({ data, showIfEmpty = false }: AssetMediaGalleryProps) {
  const hasMainImage = data.mainImage && (data.mainImage.big || data.mainImage.small);
  const hasImages = data.images && data.images.length > 0;
  const hasVideos = data.videos && data.videos.length > 0;
  const hasAnyMedia = hasMainImage || hasImages || hasVideos;

  // Don't render anything if there's no media and showIfEmpty is false
  if (!hasAnyMedia && !showIfEmpty) {
    return null;
  }

  return (
    <div className="space-y-4">
      <FieldLabel>Asset Media</FieldLabel>
      
      {hasMainImage && (
        <MainImageDisplay 
          mainImage={data.mainImage!} 
          title={data.title} 
        />
      )}
      
      {hasImages && (
        <ScreenshotsGallery images={data.images!} />
      )}
      
      {hasVideos && (
        <VideosGallery videos={data.videos!} />
      )}
      
      {!hasAnyMedia && <NoMediaMessage />}
    </div>
  );
}