'use client';

import React, { useState, useCallback } from 'react';
import { X, ImageOff, Maximize2 } from 'lucide-react';

interface ImageHandlerProps {
  src?: string;
  alt?: string;
  title?: string;
  className?: string;
  basePath?: string;
  enableLightbox?: boolean;
}

interface LightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Resolve image src to absolute path if needed.
 */
function resolveImageSrc(src: string | undefined, basePath: string): string {
  if (!src) return '';

  // Already absolute URL
  if (/^https?:\/\//.test(src) || src.startsWith('data:')) {
    return src;
  }

  // Handle relative paths
  if (src.startsWith('./')) {
    return `${basePath}/${src.slice(2)}`;
  }

  if (src.startsWith('../')) {
    const baseSegments = basePath.split('/').filter(Boolean);
    let upCount = 0;
    let remaining = src;

    while (remaining.startsWith('../')) {
      upCount++;
      remaining = remaining.slice(3);
    }

    const newBase = baseSegments.slice(0, -upCount).join('/');
    return newBase ? `/${newBase}/${remaining}` : `/${remaining}`;
  }

  // Absolute path within site
  if (src.startsWith('/')) {
    return src;
  }

  // Relative path without prefix
  return `${basePath}/${src}`;
}

/**
 * Lightbox modal for viewing images in full size.
 */
function Lightbox({ src, alt, onClose }: LightboxProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Image: ${alt}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Alt text caption */}
      {alt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-center text-sm text-white">
          {alt}
        </div>
      )}
    </div>
  );
}

/**
 * Fallback component for missing or broken images.
 */
function ImageFallback({ alt, className = '' }: { alt?: string; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 p-8 text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 ${className}`}
    >
      <ImageOff className="h-12 w-12" />
      <span className="mt-2 text-sm">Image not found</span>
      {alt && (
        <span className="mt-1 text-xs italic">
          {alt}
        </span>
      )}
    </div>
  );
}

/**
 * ImageHandler component for custom image rendering in markdown.
 * Features:
 * - Responsive images with aspect ratio preservation
 * - Lightbox option for full-size viewing
 * - Fallback for missing images
 * - Path resolution for relative image paths
 */
export function ImageHandler({
  src,
  alt = '',
  title,
  className = '',
  basePath = '',
  enableLightbox = true,
}: ImageHandlerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const resolvedSrc = resolveImageSrc(src, basePath);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  const handleOpenLightbox = useCallback(() => {
    if (enableLightbox && !hasError) {
      setShowLightbox(true);
    }
  }, [enableLightbox, hasError]);

  const handleCloseLightbox = useCallback(() => {
    setShowLightbox(false);
  }, []);

  // Show fallback for missing images
  if (hasError) {
    return <ImageFallback alt={alt} className={className} />;
  }

  return (
    <>
      <figure className={`my-4 ${className}`}>
        {/* Image container */}
        <div className="group relative overflow-hidden rounded-lg">
          {/* Loading skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-700" />
          )}

          {/* Main image */}
          <img
            src={resolvedSrc}
            alt={alt}
            title={title}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${enableLightbox ? 'cursor-zoom-in' : ''}`}
            onClick={handleOpenLightbox}
            loading="lazy"
          />

          {/* Zoom indicator */}
          {enableLightbox && isLoaded && (
            <button
              onClick={handleOpenLightbox}
              className="absolute bottom-2 right-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="View full size"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Caption */}
        {(alt || title) && (
          <figcaption className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {title || alt}
          </figcaption>
        )}
      </figure>

      {/* Lightbox modal */}
      {showLightbox && (
        <Lightbox src={resolvedSrc} alt={alt} onClose={handleCloseLightbox} />
      )}
    </>
  );
}

export default ImageHandler;
