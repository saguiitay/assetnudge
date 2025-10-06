export interface ImageData {
  imageUrl: string;
  thumbnailUrl?: string;
}

export interface VideoData {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
}

export interface MainImageData {
  big?: string;
  small?: string;
  icon?: string;
  facebook?: string;
  icon75?: string;
}

export interface MediaData {
  mainImage?: MainImageData;
  images?: ImageData[];
  videos?: VideoData[];
  title?: string;
}