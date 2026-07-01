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

function isValidPhotoIndex(index: number | undefined, totalFotos: number): index is number {
  return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < totalFotos;
}

export function isSpinEnabled(photoAngles: PhotoAngles | null | undefined, totalFotos: number): boolean {
  if (!photoAngles) return false;
  return REQUIRED_SPIN_ANGLES.every((angle) => isValidPhotoIndex(photoAngles[angle], totalFotos));
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
  if (!photoAngles || !isSpinEnabled(photoAngles, fotos.length)) return [];
  return SPIN_ANGLE_ORDER.filter((angle) => isValidPhotoIndex(photoAngles[angle], fotos.length));
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
    const index = photoAngles[angle];
    if (isValidPhotoIndex(index, fotos.length)) angleByPhoto[fotos[index]] = angle;
  }
  return angleByPhoto;
}
