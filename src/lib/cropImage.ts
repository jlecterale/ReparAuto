// ============ IMAGE CROP (CLIENT-SIDE) ============
// Renders a user-positioned crop (zoom + 90° rotation + pan) into a canvas of a
// fixed aspect ratio and exports a compressed JPEG. The transform model is shared
// with the preview in <ImageCropper>: the source image is drawn centred in the
// crop frame, then translated by `offset` (frame px, applied after rotation),
// rotated, and scaled — so the exported pixels match exactly what the user sees.

const OUTPUT_WIDTH = 1600;
const JPEG_QUALITY = 0.85;

export interface CropTransform {
  /** Zoom factor relative to the cover-fit baseline (>= 1). */
  zoom: number;
  /** Rotation in degrees, constrained to multiples of 90. */
  rotation: number;
  /** Pan offset in frame CSS pixels, applied after rotation. */
  offsetX: number;
  offsetY: number;
}

/** Effective source dimensions after a 0/90/180/270° rotation (axes swap on odd quarters). */
export function rotatedSize(width: number, height: number, rotation: number) {
  const r = ((rotation % 360) + 360) % 360;
  const swapped = r === 90 || r === 270;
  return { width: swapped ? height : width, height: swapped ? width : height };
}

/** Cover-fit scale so the (rotated) image fully covers the crop frame. */
export function coverScale(
  imgWidth: number,
  imgHeight: number,
  frameWidth: number,
  frameHeight: number,
  rotation: number,
): number {
  const { width, height } = rotatedSize(imgWidth, imgHeight, rotation);
  return Math.max(frameWidth / width, frameHeight / height);
}

/** Clamp a pan offset so the rotated, scaled image never reveals an edge inside the frame. */
export function clampOffset(
  offset: number,
  axis: 'x' | 'y',
  imgWidth: number,
  imgHeight: number,
  frameWidth: number,
  frameHeight: number,
  scale: number,
  rotation: number,
): number {
  const { width, height } = rotatedSize(imgWidth, imgHeight, rotation);
  const displayed = (axis === 'x' ? width : height) * scale;
  const frame = axis === 'x' ? frameWidth : frameHeight;
  const max = Math.max(0, (displayed - frame) / 2);
  return Math.min(max, Math.max(-max, offset));
}

export function cropImageToBlob(
  img: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  transform: CropTransform,
  aspect: number,
): Promise<Blob> {
  const baseScale = coverScale(img.naturalWidth, img.naturalHeight, frameWidth, frameHeight, transform.rotation);
  const scale = baseScale * transform.zoom;

  const outW = OUTPUT_WIDTH;
  const outH = Math.round(outW / aspect);
  // Frame px -> output px. Replicates the preview transform at higher resolution.
  const k = outW / frameWidth;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Falha ao criar contexto de canvas'));

  ctx.imageSmoothingQuality = 'high';
  ctx.translate(outW / 2, outH / 2);
  ctx.translate(transform.offsetX * k, transform.offsetY * k);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(scale * k, scale * k);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao recortar imagem'));
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

/** Load a source URL into an <img>, requesting CORS so remote (Storage) images stay canvas-exportable. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}
