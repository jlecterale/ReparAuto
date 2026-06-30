'use client';

import { getYoutubeEmbedUrl } from '@/lib/utils';

interface YoutubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

/**
 * Responsive 16:9 YouTube player using the privacy-friendly nocookie domain.
 * Renders nothing when the URL is not a recognizable YouTube link.
 */
export default function YoutubeEmbed({ url, title = 'Vídeo', className = '' }: YoutubeEmbedProps) {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
