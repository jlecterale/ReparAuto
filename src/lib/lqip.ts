const LQIP_SIZE = 16;
const LQIP_QUALITY = 0.3;
const CACHE_KEY = 'lqip_cache';
const MAX_CACHE = 200;

let cache: Record<string, string> | null = null;

function getCache(): Record<string, string> {
  if (cache) return cache;
  if (typeof window === 'undefined') return {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    cache = {};
  }
  return cache!;
}

function saveCache() {
  if (!cache) return;
  const keys = Object.keys(cache);
  if (keys.length > MAX_CACHE) {
    const toRemove = keys.slice(0, keys.length - MAX_CACHE);
    for (const k of toRemove) delete cache[k];
  }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

export function getCachedLqip(src: string): string | null {
  return getCache()[src] || null;
}

export function cacheLqip(src: string, lqip: string) {
  getCache()[src] = lqip;
  saveCache();
}

export function generateLqipFromImage(img: HTMLImageElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = LQIP_SIZE;
    canvas.height = LQIP_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, LQIP_SIZE, LQIP_SIZE);
    return canvas.toDataURL('image/jpeg', LQIP_QUALITY);
  } catch {
    return null;
  }
}

export function generateLqipFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = LQIP_SIZE;
        canvas.height = LQIP_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no canvas')); return; }
        ctx.drawImage(img, 0, 0, LQIP_SIZE, LQIP_SIZE);
        resolve(canvas.toDataURL('image/jpeg', LQIP_QUALITY));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
