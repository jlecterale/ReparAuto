import 'server-only';
import { randomUUID } from 'crypto';
import { getAdminBucket } from '@/lib/firebase.admin';
import { MAX_FOTOS_CARRO, MAX_FOTO_SIZE_BYTES } from '@/lib/listingOptions';
import { isAllowedPhotoUrl } from '@/lib/importers/photoUrl';

const DOWNLOAD_TIMEOUT_MS = 20_000;

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export interface RehostedPhotos {
  /** Firebase Storage download URLs, in the advert's photo order. */
  fotos: string[];
  /** Photos that could not be downloaded/re-hosted (import proceeds anyway). */
  failedCount: number;
}

async function downloadPhoto(url: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!isAllowedPhotoUrl(url)) return null;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      headers: { Accept: 'image/*' },
    });
    if (!response.ok) return null;
    const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim();
    if (!contentType.startsWith('image/')) return null;
    const data = Buffer.from(await response.arrayBuffer());
    if (data.byteLength === 0 || data.byteLength > MAX_FOTO_SIZE_BYTES) return null;
    return { data, contentType };
  } catch {
    return null;
  }
}

/**
 * Downloads advert photos from the OLX CDN and re-hosts them in Firebase
 * Storage under the owner's ads/ folder (next/image only optimizes
 * firebasestorage URLs, and the source CDN URLs are not under our control).
 * Sequential on purpose — the batch flow is already serial; this keeps the
 * per-advert burst small. A failed photo is skipped, never fatal.
 */
export async function rehostAdvertPhotos(
  urls: string[],
  opts: { uid: string; adId: string },
): Promise<RehostedPhotos> {
  const bucket = getAdminBucket();
  if (!bucket) return { fotos: [], failedCount: urls.length };

  const fotos: string[] = [];
  let failedCount = 0;
  for (const [index, url] of urls.slice(0, MAX_FOTOS_CARRO).entries()) {
    const photo = await downloadPhoto(url);
    if (!photo) {
      failedCount++;
      continue;
    }
    const extension = EXTENSION_BY_CONTENT_TYPE[photo.contentType] ?? 'jpg';
    const path = `ads/${opts.uid}/imported/${opts.adId}_${index}.${extension}`;
    const token = randomUUID();
    try {
      await bucket.file(path).save(photo.data, {
        resumable: false,
        metadata: {
          contentType: photo.contentType,
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      fotos.push(
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
      );
    } catch {
      failedCount++;
    }
  }
  return { fotos, failedCount };
}
