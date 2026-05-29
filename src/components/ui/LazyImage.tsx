'use client';

import { Image } from '@phosphor-icons/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getCachedLqip, cacheLqip, generateLqipFromImage } from '@/lib/lqip';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  lqip?: string;
}

export default function LazyImage({ src, alt, className = '', lqip }: LazyImageProps) {
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
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400 text-3xl">
          <Image />
        </div>
      )}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          decoding="async"
          onLoad={handleLoad}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
