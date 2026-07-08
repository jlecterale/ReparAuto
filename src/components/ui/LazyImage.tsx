'use client';

import { Image } from '@phosphor-icons/react';
import NextImage from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getCachedLqip, cacheLqip, generateLqipFromImage } from '@/lib/lqip';
import { canOptimizeImage } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  lqip?: string;
  /** Responsive hint forwarded to next/image (defaults to a card-grid layout). */
  sizes?: string;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  lqip,
  sizes = '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw',
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const [blurSrc, setBlurSrc] = useState<string | null>(() => lqip || getCachedLqip(src));
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setBlurSrc(lqip || getCachedLqip(src));
  }, [src, lqip]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    if (!getCachedLqip(src)) {
      const result = generateLqipFromImage(e.currentTarget);
      if (result) cacheLqip(src, result);
    }
  }, [src]);

  const imgClassName = `w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && blurSrc && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: 'blur(20px)' }}
        />
      )}
      {!loaded && !error && !blurSrc && (
        <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
      )}
      {error && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-fg-subtle text-3xl">
          <Image />
        </div>
      )}
      {inView && !error && (
        canOptimizeImage(src) ? (
          <NextImage
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={imgClassName}
            onLoad={handleLoad}
            onError={() => setError(true)}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className={imgClassName}
            decoding="async"
            onLoad={handleLoad}
            onError={() => setError(true)}
          />
        )
      )}
    </div>
  );
}
