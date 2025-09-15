"use client";

import Image from "next/image";
import { useState } from "react";
import { BASE_PATH } from "@/env/basePath";

interface BlogImageProps {
  src: string;
  alt: string;
  fallbackText?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  caption?: string;
  loading?: "lazy" | "eager";
}

export default function BlogImage({ 
  src, 
  alt, 
  fallbackText = "Image",
  className = "",
  fill = false,
  width,
  height,
  priority = false,
  caption,
  loading = "lazy"
}: BlogImageProps) {
  const placeholder = `https://placehold.co/800x600/ff6308/ffffff?text=${encodeURIComponent(fallbackText)}`;
  const normalizedSrc = src.startsWith("/") ? `${BASE_PATH}${src}` : src;
  const [imgSrc, setImgSrc] = useState(normalizedSrc || placeholder);

  const imageElement = fill ? (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={className}
      priority={priority}
      loading={priority ? "eager" : loading}
      onError={() => {
        setImgSrc(placeholder);
      }}
    />
  ) : (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
      loading={priority ? "eager" : loading}
      onError={() => {
        setImgSrc(placeholder);
      }}
    />
  );

  if (caption) {
    return (
      <figure className="w-full">
        {imageElement}
        <figcaption className="text-sm text-stone-600 dark:text-stone-400 text-center mt-2 italic">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return imageElement;
}
