// 360 spin mode: sellers tag listing photos with vehicle angles (front, rear,
// sides, ...). When the four cardinal angles are tagged the detail page can
// offer a drag-to-rotate viewer that cycles through the tagged photos in
// circular order. Everything here is pure so both flows stay unit-testable.

export type SpinAngle =
  | 'front'
  | 'frontRight'
  | 'right'
  | 'rearRight'
  | 'rear'
  | 'rearLeft'
  | 'left'
  | 'frontLeft';

/** Circular order the viewer rotates through (clockwise, seen from above). */
export const SPIN_ANGLE_ORDER: SpinAngle[] = [
  'front',
  'frontRight',
  'right',
  'rearRight',
  'rear',
  'rearLeft',
  'left',
  'frontLeft',
];

/** The minimum set of angles a seller must tag to enable the 360 mode. */
export const REQUIRED_SPIN_ANGLES: SpinAngle[] = ['front', 'right', 'rear', 'left'];

/**
 * Camera bearing per angle in degrees, clockwise from the vehicle's nose
 * (0 = standing in front of the car). Drives the capture-position diagram.
 */
export const SPIN_ANGLE_DEGREES: Record<SpinAngle, number> = {
  front: 0,
  frontRight: 45,
  right: 90,
  rearRight: 135,
  rear: 180,
  rearLeft: 225,
  left: 270,
  frontLeft: 315,
};

/** User-facing labels (UI copy is Portuguese by convention). */
export const SPIN_ANGLE_LABELS: Record<SpinAngle, string> = {
  front: 'Frente',
  frontRight: 'Frente direita',
  right: 'Lateral direita',
  rearRight: 'Traseira direita',
  rear: 'Trás',
  rearLeft: 'Traseira esquerda',
  left: 'Lateral esquerda',
  frontLeft: 'Frente esquerda',
};

/** Angle → index into the listing's `fotos` array, as persisted in Firestore. */
export type PhotoAngles = Record<string, number>;

// Listing photos may also be emoji placeholders; a spin frame must be a real
// image (URL, path or data/blob URI — anything with a dot, slash or scheme).
function isImageFoto(foto: string | undefined): foto is string {
  return typeof foto === 'string' && (/[./]/.test(foto) || foto.startsWith('data:') || foto.startsWith('blob:'));
}

function isValidPhotoTag(photoAngles: PhotoAngles, angle: SpinAngle, fotos: string[]): boolean {
  const index = photoAngles[angle];
  return (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < fotos.length &&
    isImageFoto(fotos[index])
  );
}

export function isSpinEnabled(photoAngles: PhotoAngles | null | undefined, fotos: string[]): boolean {
  if (!photoAngles) return false;
  return REQUIRED_SPIN_ANGLES.every((angle) => isValidPhotoTag(photoAngles, angle, fotos));
}

/** How many pixels of horizontal drag advance the spin by one frame. */
export const SPIN_PX_PER_FRAME = 60;

/**
 * Maps a horizontal drag (in px, relative to where the drag started) to the
 * frame that should be shown. Dragging left spins forward through
 * SPIN_ANGLE_ORDER; the sequence wraps in both directions.
 */
export function spinFrameFromDrag(
  startFrame: number,
  deltaX: number,
  frameCount: number,
  pxPerFrame: number = SPIN_PX_PER_FRAME
): number {
  if (frameCount <= 0) return 0;
  const steps = Math.round(-deltaX / pxPerFrame);
  return (((startFrame + steps) % frameCount) + frameCount) % frameCount;
}

/**
 * The ordered photo sequence the viewer rotates through. Empty unless the
 * spin mode is enabled; optional angles with stale indices are skipped.
 */
export function getSpinFrames(fotos: string[], photoAngles: PhotoAngles | null | undefined): string[] {
  return getSpinAngles(fotos, photoAngles).map((angle) => fotos[photoAngles![angle]]);
}

/** The angle of each frame returned by getSpinFrames, in the same order. */
export function getSpinAngles(fotos: string[], photoAngles: PhotoAngles | null | undefined): SpinAngle[] {
  if (!photoAngles || !isSpinEnabled(photoAngles, fotos)) return [];
  return SPIN_ANGLE_ORDER.filter((angle) => isValidPhotoTag(photoAngles, angle, fotos));
}

/**
 * Form-state invariant helpers shared by the web and mobile photo editors:
 * each angle belongs to exactly one photo.
 */
export function withPhotoAngle(
  angleByPhoto: Record<string, SpinAngle>,
  foto: string,
  angle: SpinAngle | null
): Record<string, SpinAngle> {
  const next = { ...angleByPhoto };
  // Retagging steals the angle from whichever photo held it.
  for (const [f, a] of Object.entries(next)) {
    if (a === angle || f === foto) delete next[f];
  }
  if (angle) next[foto] = angle;
  return next;
}

/** Drops the tag of a removed photo. */
export function withoutPhoto(
  angleByPhoto: Record<string, SpinAngle>,
  foto: string
): Record<string, SpinAngle> {
  if (!(foto in angleByPhoto)) return angleByPhoto;
  const next = { ...angleByPhoto };
  delete next[foto];
  return next;
}

/** Moves a tag when a photo string changes (re-crop, upload). */
export function withPhotoRenamed(
  angleByPhoto: Record<string, SpinAngle>,
  from: string,
  to: string
): Record<string, SpinAngle> {
  const angle = angleByPhoto[from];
  if (!angle) return angleByPhoto;
  const next = { ...angleByPhoto };
  delete next[from];
  next[to] = angle;
  return next;
}

/**
 * Draft-restore counterpart of withPhotoRenamed: follows saved tags through
 * the blob-URL re-keys reported by restoreDraftPhotos and drops tags whose
 * photo did not survive the restore.
 */
export function restoreAngleByPhoto(
  saved: Record<string, SpinAngle> | null | undefined,
  renames: Array<{ from: string; to: string }>,
  fotos: string[]
): Record<string, SpinAngle> {
  let tags = saved ?? {};
  for (const { from, to } of renames) tags = withPhotoRenamed(tags, from, to);
  const surviving = new Set(fotos);
  return Object.fromEntries(Object.entries(tags).filter(([foto]) => surviving.has(foto)));
}

/**
 * Publish-time freeze: follows tags through upload pairs (photo string
 * changes blob/local URI → storage URL) and converts them to the persisted
 * angle → index map. Returns null when empty so both addDoc and updateDoc
 * callers can store a Firestore-friendly value.
 */
export function buildPhotoAngles(
  pairs: { original: string; final: string }[],
  angleByPhoto: Record<string, SpinAngle>
): PhotoAngles | null {
  let uploaded = angleByPhoto;
  for (const { original, final } of pairs) {
    if (original !== final) uploaded = withPhotoRenamed(uploaded, original, final);
  }
  const photoAngles = toPhotoAngles(
    pairs.map((p) => p.final),
    uploaded
  );
  return Object.keys(photoAngles).length > 0 ? photoAngles : null;
}

/**
 * Freezes form tags (keyed by photo string so they survive reordering) into
 * the persisted angle → index map. Tags of removed photos are dropped.
 */
export function toPhotoAngles(fotos: string[], angleByPhoto: Record<string, SpinAngle>): PhotoAngles {
  const photoAngles: PhotoAngles = {};
  for (const [foto, angle] of Object.entries(angleByPhoto)) {
    const index = fotos.indexOf(foto);
    if (index >= 0) photoAngles[angle] = index;
  }
  return photoAngles;
}

/**
 * The angles guided capture should still photograph (those without a tag),
 * in physical walk-around order.
 */
export function getCaptureSequence(angleByPhoto: Record<string, SpinAngle>): SpinAngle[] {
  const tagged = new Set(Object.values(angleByPhoto));
  return SPIN_ANGLE_ORDER.filter((angle) => !tagged.has(angle));
}

/** Inverse of toPhotoAngles — hydrates form tags from a stored listing. */
export function toAngleByPhoto(
  fotos: string[],
  photoAngles: PhotoAngles | null | undefined
): Record<string, SpinAngle> {
  const angleByPhoto: Record<string, SpinAngle> = {};
  if (!photoAngles) return angleByPhoto;
  for (const angle of SPIN_ANGLE_ORDER) {
    if (isValidPhotoTag(photoAngles, angle, fotos)) angleByPhoto[fotos[photoAngles[angle]]] = angle;
  }
  return angleByPhoto;
}
