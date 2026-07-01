import { rotatedSize, coverScale, clampOffset } from '@/lib/cropImage';

// Geometry behind the listing photo cropper: every photo is positioned (zoom +
// 90° rotation + pan) inside a fixed-aspect frame and exported at that crop. The
// preview (CSS transform) and the canvas export share these pure helpers, so the
// two stay pixel-consistent only as long as the maths below holds. The canvas
// export itself (`cropImageToBlob`) and `loadImage` are thin DOM/canvas wrappers
// and are exercised manually, not here.

describe('rotatedSize', () => {
  it('keeps dimensions for 0° and 180° (no axis swap)', () => {
    expect(rotatedSize(800, 600, 0)).toEqual({ width: 800, height: 600 });
    expect(rotatedSize(800, 600, 180)).toEqual({ width: 800, height: 600 });
  });

  it('swaps width and height for 90° and 270°', () => {
    expect(rotatedSize(800, 600, 90)).toEqual({ width: 600, height: 800 });
    expect(rotatedSize(800, 600, 270)).toEqual({ width: 600, height: 800 });
  });

  it('normalizes 360° back to 0° (no swap)', () => {
    expect(rotatedSize(800, 600, 360)).toEqual({ width: 800, height: 600 });
  });

  it('normalizes negative and over-full-turn angles', () => {
    // -90° ≡ 270° → swap; 450° ≡ 90° → swap.
    expect(rotatedSize(800, 600, -90)).toEqual({ width: 600, height: 800 });
    expect(rotatedSize(800, 600, 450)).toEqual({ width: 600, height: 800 });
  });
});

describe('coverScale', () => {
  it('picks the larger ratio so the image covers the frame', () => {
    // 4:3 image into a 4:3 frame — both axes scale by the same factor.
    expect(coverScale(800, 600, 400, 300, 0)).toBeCloseTo(0.5);
    // Square image into a 4:3 frame — width drives the cover scale.
    expect(coverScale(1000, 1000, 400, 300, 0)).toBeCloseTo(0.4);
    // Very wide image into a 4:3 frame — height drives the cover scale.
    expect(coverScale(800, 200, 400, 300, 0)).toBeCloseTo(1.5);
  });

  it('accounts for a 90° rotation by swapping the effective axes', () => {
    // 800×200 rotated 90° behaves as 200×800: now height is the long side.
    expect(coverScale(800, 200, 400, 300, 90)).toBeCloseTo(2);
  });

  it('returns a scale that fully covers the frame (cover invariant)', () => {
    const cases: Array<[number, number, number, number, number]> = [
      [4000, 3000, 400, 300, 0],
      [4000, 2000, 400, 300, 0],
      [2000, 4000, 400, 300, 0],
      [4000, 2000, 400, 300, 90],
      [1234, 5678, 360, 270, 270],
    ];
    for (const [iw, ih, fw, fh, rot] of cases) {
      const scale = coverScale(iw, ih, fw, fh, rot);
      const { width, height } = rotatedSize(iw, ih, rot);
      // Both frame edges must be covered, and at least one must touch exactly.
      expect(width * scale).toBeGreaterThanOrEqual(fw - 1e-6);
      expect(height * scale).toBeGreaterThanOrEqual(fh - 1e-6);
      const touchesWidth = Math.abs(width * scale - fw) < 1e-6;
      const touchesHeight = Math.abs(height * scale - fh) < 1e-6;
      expect(touchesWidth || touchesHeight).toBe(true);
    }
  });
});

describe('clampOffset', () => {
  // 1000×1000 image, 400×300 frame, scale 0.5 → displayed 500×500.
  // x: max = (500-400)/2 = 50 ; y: max = (500-300)/2 = 100.
  const clampX = (o: number) => clampOffset(o, 'x', 1000, 1000, 400, 300, 0.5, 0);
  const clampY = (o: number) => clampOffset(o, 'y', 1000, 1000, 400, 300, 0.5, 0);

  it('leaves an offset within bounds untouched', () => {
    expect(clampX(30)).toBe(30);
    expect(clampY(-80)).toBe(-80);
  });

  it('clamps to the positive and negative maximum per axis', () => {
    expect(clampX(80)).toBe(50);
    expect(clampX(-80)).toBe(-50);
    expect(clampY(150)).toBe(100);
    expect(clampY(-150)).toBe(-100);
  });

  it('pins to 0 when the scaled image is not larger than the frame', () => {
    // scale 0.3 → displayed 300 < frame 400 on x, so there is nothing to pan.
    // (toBeCloseTo ignores signed-zero; -0 and 0 are interchangeable here.)
    expect(clampOffset(50, 'x', 1000, 1000, 400, 300, 0.3, 0)).toBeCloseTo(0);
    expect(clampOffset(-50, 'x', 1000, 1000, 400, 300, 0.3, 0)).toBeCloseTo(0);
  });

  it('uses the rotated dimension for the clamped axis', () => {
    // 1000×500 image. Without rotation, x uses width 1000 → max (1000-400)/2 = 300.
    expect(clampOffset(250, 'x', 1000, 500, 400, 300, 1, 0)).toBe(250);
    // Rotated 90°, x uses the (swapped) width 500 → max (500-400)/2 = 50.
    expect(clampOffset(250, 'x', 1000, 500, 400, 300, 1, 90)).toBe(50);
  });

  it('keeps zoomed-in offsets bounded by the displayed size', () => {
    // Larger zoom → larger displayed size → wider pan range.
    const tight = clampOffset(1000, 'x', 1000, 1000, 400, 300, 0.5, 0); // max 50
    const loose = clampOffset(1000, 'x', 1000, 1000, 400, 300, 1, 0); // displayed 1000, max 300
    expect(tight).toBe(50);
    expect(loose).toBe(300);
  });
});
