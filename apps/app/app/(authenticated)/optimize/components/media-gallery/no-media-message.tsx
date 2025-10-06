'use client';

import { Image as ImageIcon } from 'lucide-react';

export function NoMediaMessage() {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">No media available</p>
      <p className="text-xs">Import an asset to see screenshots and videos</p>
    </div>
  );
}