import {
  buildPhotoAngles,
  getCaptureSequence,
  getSpinAngles,
  getSpinFrames,
  isSpinEnabled,
  spinFrameFromDrag,
  toAngleByPhoto,
  toPhotoAngles,
  withPhotoAngle,
  withPhotoRenamed,
  withoutPhoto,
} from '@/lib/spin360';

// The 360 spin mode turns on only when the seller has tagged the four
// cardinal angles (front, right, rear, left) on real photos. These are pure
// predicates so the viewer/forms stay testable in isolation from Firestore.
describe('isSpinEnabled', () => {
  const fotos = ['f.jpg', 'r.jpg', 't.jpg', 'l.jpg'];

  it('is disabled when no angles were tagged', () => {
    expect(isSpinEnabled(undefined, fotos)).toBe(false);
    expect(isSpinEnabled(null, fotos)).toBe(false);
    expect(isSpinEnabled({}, fotos)).toBe(false);
  });

  it('is enabled once front, right, rear and left are all tagged', () => {
    expect(isSpinEnabled({ front: 0, right: 1, rear: 2, left: 3 }, fotos)).toBe(true);
  });

  it('is disabled while any cardinal angle is missing', () => {
    expect(isSpinEnabled({ front: 0, right: 1, rear: 2 }, fotos)).toBe(false);
    expect(isSpinEnabled({ front: 0, frontRight: 1, rear: 2, left: 3 }, fotos)).toBe(false);
  });

  it('ignores tags whose photo index no longer exists', () => {
    // e.g. the seller tagged 5 photos but later removed some in an edit
    expect(isSpinEnabled({ front: 0, right: 1, rear: 3, left: 2 }, fotos.slice(0, 3))).toBe(false);
    expect(isSpinEnabled({ front: -1, right: 1, rear: 2, left: 3 }, fotos)).toBe(false);
    expect(isSpinEnabled({ front: 0.5, right: 1, rear: 2, left: 3 }, fotos)).toBe(false);
  });

  it('ignores tags pointing at emoji placeholders instead of real photos', () => {
    // Legacy/corrupted data: the tagging UI never offers emojis, but stored
    // maps must not enable a spin whose frame cannot render as an image.
    expect(isSpinEnabled({ front: 0, right: 1, rear: 2, left: 3 }, ['🚗', 'r.jpg', 't.jpg', 'l.jpg'])).toBe(false);
  });
});

describe('getSpinFrames', () => {
  const fotos = ['f.jpg', 'r.jpg', 't.jpg', 'l.jpg', 'fr.jpg', 'interior.jpg'];

  it('returns photos in circular rotation order, not tagging order', () => {
    // clockwise: front → frontRight → right → rear → left
    expect(
      getSpinFrames(fotos, { left: 3, front: 0, rear: 2, right: 1, frontRight: 4 })
    ).toEqual(['f.jpg', 'fr.jpg', 'r.jpg', 't.jpg', 'l.jpg']);
  });

  it('returns no frames while the spin mode is not enabled', () => {
    expect(getSpinFrames(fotos, { front: 0, right: 1 })).toEqual([]);
    expect(getSpinFrames(fotos, undefined)).toEqual([]);
    expect(getSpinFrames(fotos, null)).toEqual([]);
  });

  it('skips optional tags pointing at removed photos but keeps the spin alive', () => {
    expect(getSpinFrames(fotos, { front: 0, right: 1, rear: 2, left: 3, rearLeft: 99 })).toEqual([
      'f.jpg',
      'r.jpg',
      't.jpg',
      'l.jpg',
    ]);
  });
});

describe('getSpinAngles', () => {
  it('lists the angles matching each frame of getSpinFrames', () => {
    const fotos = ['f.jpg', 'r.jpg', 't.jpg', 'l.jpg'];
    const photoAngles = { front: 0, right: 1, rear: 2, left: 3, rearLeft: 99 };
    expect(getSpinAngles(fotos, photoAngles)).toEqual(['front', 'right', 'rear', 'left']);
    expect(getSpinAngles(fotos, { front: 0 })).toEqual([]);
  });
});

// The form-state invariant — each angle belongs to exactly one photo — is
// enforced by these helpers, shared by the web and mobile photo editors.
describe('withPhotoAngle', () => {
  it('tags a photo and steals the angle from any other photo holding it', () => {
    expect(withPhotoAngle({ 'a.jpg': 'front' }, 'b.jpg', 'front')).toEqual({ 'b.jpg': 'front' });
  });

  it('replaces the photo previous angle', () => {
    expect(withPhotoAngle({ 'a.jpg': 'front' }, 'a.jpg', 'rear')).toEqual({ 'a.jpg': 'rear' });
  });

  it('clears the photo tag when angle is null', () => {
    expect(withPhotoAngle({ 'a.jpg': 'front', 'b.jpg': 'rear' }, 'a.jpg', null)).toEqual({
      'b.jpg': 'rear',
    });
  });
});

describe('withoutPhoto', () => {
  it('drops the tag of a removed photo and keeps the rest', () => {
    expect(withoutPhoto({ 'a.jpg': 'front', 'b.jpg': 'rear' }, 'a.jpg')).toEqual({ 'b.jpg': 'rear' });
    expect(withoutPhoto({ 'a.jpg': 'front' }, 'unknown.jpg')).toEqual({ 'a.jpg': 'front' });
  });
});

describe('withPhotoRenamed', () => {
  it('moves a tag when a photo string changes (re-crop, upload)', () => {
    expect(withPhotoRenamed({ 'blob:x': 'front' }, 'blob:x', 'https://a.jpg')).toEqual({
      'https://a.jpg': 'front',
    });
    expect(withPhotoRenamed({ 'a.jpg': 'front' }, 'other.jpg', 'new.jpg')).toEqual({ 'a.jpg': 'front' });
  });
});

// Publishing uploads photos (string changes blob/local → storage URL) and then
// freezes the tags into the persisted map in one step.
describe('buildPhotoAngles', () => {
  it('follows tags through upload pairs and freezes them to final indices', () => {
    const pairs = [
      { original: 'blob:1', final: 'https://f.jpg' },
      { original: '🚗', final: '🚗' },
      { original: 'blob:2', final: 'https://r.jpg' },
    ];
    expect(buildPhotoAngles(pairs, { 'blob:1': 'front', 'blob:2': 'right' })).toEqual({
      front: 0,
      right: 2,
    });
  });

  it('returns null when nothing is tagged (Firestore-friendly empty)', () => {
    expect(buildPhotoAngles([{ original: 'a.jpg', final: 'a.jpg' }], {})).toBeNull();
    expect(buildPhotoAngles([], { 'gone.jpg': 'front' })).toBeNull();
  });
});

// Guided capture walks the seller around the vehicle, offering each angle
// still missing a photo, in physical walk-around order.
describe('getCaptureSequence', () => {
  it('offers all angles in walk-around order when nothing is tagged yet', () => {
    expect(getCaptureSequence({})).toEqual([
      'front',
      'frontRight',
      'right',
      'rearRight',
      'rear',
      'rearLeft',
      'left',
      'frontLeft',
    ]);
  });

  it('skips angles that already have a photo', () => {
    expect(getCaptureSequence({ 'a.jpg': 'front', 'b.jpg': 'rear' })).toEqual([
      'frontRight',
      'right',
      'rearRight',
      'rearLeft',
      'left',
      'frontLeft',
    ]);
  });
});

describe('spinFrameFromDrag', () => {
  it('advances one frame per step of horizontal drag to the left', () => {
    expect(spinFrameFromDrag(0, -60, 8, 60)).toBe(1);
    expect(spinFrameFromDrag(0, -120, 8, 60)).toBe(2);
  });

  it('rotates the other way when dragging right', () => {
    expect(spinFrameFromDrag(2, 60, 8, 60)).toBe(1);
  });

  it('keeps the current frame for drags smaller than half a step', () => {
    expect(spinFrameFromDrag(3, -20, 8, 60)).toBe(3);
  });

  it('wraps around the sequence in both directions', () => {
    expect(spinFrameFromDrag(7, -60, 8, 60)).toBe(0);
    expect(spinFrameFromDrag(0, 60, 8, 60)).toBe(7);
    expect(spinFrameFromDrag(0, 60 * 17, 8, 60)).toBe(7); // multiple laps
  });

  it('never crashes on an empty sequence', () => {
    expect(spinFrameFromDrag(0, -60, 0, 60)).toBe(0);
  });
});

// Forms keep the seller's tags keyed by the photo string itself so tags
// survive drag-reordering; only at save time are they frozen into indices.
describe('toPhotoAngles', () => {
  it('freezes photo-keyed tags into the persisted angle → index map', () => {
    expect(toPhotoAngles(['a.jpg', 'b.jpg', 'c.jpg'], { 'c.jpg': 'front', 'a.jpg': 'rear' })).toEqual({
      front: 2,
      rear: 0,
    });
  });

  it('drops tags for photos that were removed from the listing', () => {
    expect(toPhotoAngles(['a.jpg'], { 'a.jpg': 'front', 'gone.jpg': 'rear' })).toEqual({ front: 0 });
  });
});

describe('toAngleByPhoto', () => {
  it('hydrates photo-keyed tags from a stored listing for editing', () => {
    expect(toAngleByPhoto(['a.jpg', 'b.jpg', 'c.jpg'], { front: 2, rear: 0 })).toEqual({
      'c.jpg': 'front',
      'a.jpg': 'rear',
    });
  });

  it('ignores stored tags that are stale or unknown', () => {
    expect(toAngleByPhoto(['a.jpg'], { front: 0, rear: 5, sunroof: 0 } as never)).toEqual({
      'a.jpg': 'front',
    });
  });

  it('returns no tags for listings without the field', () => {
    expect(toAngleByPhoto(['a.jpg'], undefined)).toEqual({});
    expect(toAngleByPhoto(['a.jpg'], null)).toEqual({});
  });
});
