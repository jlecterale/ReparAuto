/** YouTube link helpers, aligned with the web app (src/lib/utils.ts). */

/** Extracts the 11-char video id from the common YouTube URL forms. */
export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidYoutubeUrl(url: string | null | undefined): boolean {
  return getYoutubeId(url) !== null;
}

/** Canonical watch URL — opens the YouTube app when installed, else the browser. */
export function getYoutubeWatchUrl(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

/** Poster frame for the preview card (hqdefault always exists). */
export function getYoutubeThumbnail(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
