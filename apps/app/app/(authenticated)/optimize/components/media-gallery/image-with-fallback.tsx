'use client';

import { ProxyImage } from '@repo/design-system';
import { Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  placeholder?: React.ReactNode;
  showOpenButton?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = "", 
  onClick, 
  placeholder,
  showOpenButton = true,
  enableRetry = true,
  maxRetries = 2
}: ImageWithFallbackProps) {
  
  // Default placeholder if none provided
  const defaultPlaceholder = (
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <ImageIcon className="h-8 w-8" />
      <span className="text-xs">Loading...</span>
    </div>
  );

  return (
    <div className={`relative w-full h-full ${className}`}>
      <ProxyImage
        src={src}
        alt={alt}
        enableRetry={enableRetry}
        maxRetries={maxRetries}
        className="w-full h-full rounded-lg border"
        containerClassName="w-full h-full"
        loadingComponent={placeholder || defaultPlaceholder}
        onClick={onClick}
      />
    </div>
  );
}