import { encodeWav, resampleLinear } from '@/lib/audioWav';

const ascii = (view: DataView, offset: number, length: number): string =>
  Array.from({ length }, (_, i) => String.fromCharCode(view.getUint8(offset + i))).join('');

describe('encodeWav', () => {
  it('produces a mono 16-bit PCM RIFF/WAVE header for the given sample rate', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1]);
    const wav = encodeWav(samples, 16000);
    const view = new DataView(wav);

    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(ascii(view, 8, 4)).toBe('WAVE');
    expect(ascii(view, 12, 4)).toBe('fmt ');
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16000); // sample rate
    expect(view.getUint32(28, true)).toBe(16000 * 2); // byte rate
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(ascii(view, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(samples.length * 2);
    expect(wav.byteLength).toBe(44 + samples.length * 2);
    expect(view.getUint32(4, true)).toBe(wav.byteLength - 8);
  });

  it('converts float samples to little-endian 16-bit PCM, clipping out-of-range values', () => {
    const wav = encodeWav(new Float32Array([0, 1, -1, 2, -2]), 8000);
    const view = new DataView(wav);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
    expect(view.getInt16(50, true)).toBe(32767); // clipped
    expect(view.getInt16(52, true)).toBe(-32768); // clipped
  });
});

describe('resampleLinear', () => {
  it('returns the input untouched when rates match', () => {
    const samples = new Float32Array([0.1, 0.2, 0.3]);
    expect(resampleLinear(samples, 16000, 16000)).toBe(samples);
  });

  it('halves the sample count when downsampling to half the rate', () => {
    const samples = new Float32Array(1000).fill(0.25);
    const out = resampleLinear(samples, 32000, 16000);
    expect(out).toHaveLength(500);
    expect(out[0]).toBeCloseTo(0.25);
    expect(out[499]).toBeCloseTo(0.25);
  });
});
