'use client';

import ProxyImage from '@workspace/ui/components/proxy-image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  width = 400,
  height = 300,
  className = "", 
  onClick
}: ImageWithFallbackProps) {
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <ProxyImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full rounded-lg border"
        containerClassName="w-full h-full"
        onClick={onClick}
      />
    </div>
  );
}