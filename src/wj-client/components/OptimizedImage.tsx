"use client";

import React, { useState } from "react";
import Image from "next/image";

/**
 * OptimizedImage Component
 *
 * A wrapper around Next.js Image component with:
 * - Blur placeholders during loading
 * - Responsive sizing
 * - WebP format support
 * - Lazy loading
 * - Error handling with fallback
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/avatar.jpg"
 *   alt="User avatar"
 *   width={40}
 *   height={40}
 *   priority={false}
 *   fallback="/default-avatar.png"
 * />
 * ```
 */

export interface OptimizedImageProps {
  /** Image source URL */
  src: string;

  /** Alt text for accessibility */
  alt: string;

  /** Width of the image */
  width?: number;

  /** Height of the image */
  height?: number;

  /** Priority loading (above the fold images) */
  priority?: boolean;

  /** Fallback image URL on error */
  fallback?: string;

  /** CSS class name */
  className?: string;

  /** Additional styles */
  style?: React.CSSProperties;

  /** Fill container (ignores width/height) */
  fill?: boolean;

  /** Object fit for fill mode */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";

  /** Blur placeholder URL */
  blurPlaceholder?: string;

  /** Quality (1-100) */
  quality?: number;

  /** Sizes attribute for responsive images */
  sizes?: string;

  /** Custom loader function */
  loader?: ({ src, width, quality }: { src: string; width: number; quality?: number }) => string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fallback,
  className = "",
  style = {},
  fill = false,
  objectFit = "cover",
  blurPlaceholder,
  quality = 75,
  sizes,
  loader,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Default fallback avatar
  const defaultFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23E5E7EB'/%3E%3Ccircle cx='20' cy='15' r='6' fill='%239CA3AF'/%3E%3Cpath d='M10 35c0-6 4-10 10-10s10 4 10 10' fill='%239CA3AF'/%3E%3C/svg%3E";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: fill ? "100%" : width,
        height: fill ? "100%" : height,
        minHeight: height || 40,
        minWidth: width || 40,
        backgroundColor: isLoading ? "#F3F4F6" : "transparent",
        ...style,
      }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-200"
          style={{
            backgroundImage: blurPlaceholder
              ? `url(${blurPlaceholder})`
              : "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: blurPlaceholder ? "cover" : "200% 100%",
          }}
        />
      )}

      <Image
        src={hasError ? (fallback || defaultFallback) : imgSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        loader={loader}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${fill ? "!w-full !h-full" : ""}`}
        style={{
          objectFit: objectFit,
        }}
      />
    </div>
  );
}

/**
 * Avatar Component
 *
 * Pre-configured OptimizedImage for user avatars
 */
export interface AvatarProps extends Omit<OptimizedImageProps, "width" | "height" | "objectFit"> {
  /** Avatar size */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";

  /** Border radius */
  rounded?: boolean;
}

const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  full: 100,
};

export function Avatar({ size = "md", rounded = true, className = "", ...props }: AvatarProps) {
  const sizeValue = typeof size === "number" ? size : avatarSizes[size];

  return (
    <OptimizedImage
      {...props}
      width={sizeValue}
      height={sizeValue}
      className={`rounded-${rounded ? "full" : "md"} ${className}`}
      objectFit="cover"
      quality={85}
    />
  );
}

/**
 * ImageWithBlur Component
 *
 * Image with automatic blur placeholder generation
 */
export interface ImageWithBlurProps extends Omit<OptimizedImageProps, "blurPlaceholder"> {
  /** Enable blur placeholder */
  enableBlur?: boolean;
}

export function ImageWithBlur({ enableBlur = true, ...props }: ImageWithBlurProps) {
  return <OptimizedImage {...props} blurPlaceholder={enableBlur ? props.src : undefined} />;
}

export default OptimizedImage;
