// WAV (PCM 16-bit mono) encoding for the audio-ad assistant (plan 24).
// Browsers record webm/opus (Chrome) or mp4 (Safari); Gemini's supported audio
// list has neither guaranteed, but WAV always works — so recordings are decoded
// with the Web Audio API and re-encoded here before upload. 16 kHz mono keeps a
// 3-minute recording under ~6 MB, well inside the API's inline limit.

export const WAV_SAMPLE_RATE = 16000;

/** Encodes mono float samples ([-1, 1]) into a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (mono 16-bit)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return buffer;
}

/** Linear-interpolation resampler; returns the input as-is when rates match. */
export function resampleLinear(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(left + 1, samples.length - 1);
    const frac = pos - left;
    out[i] = samples[left] * (1 - frac) + samples[right] * frac;
  }
  return out;
}

/**
 * Decodes any browser-recorded audio blob and re-encodes it as 16 kHz mono WAV.
 * Browser-only (Web Audio API); throws if the blob can't be decoded.
 */
export async function blobToWav(blob: Blob): Promise<Blob> {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    // Downmix to mono by averaging channels.
    const mono = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const data = decoded.getChannelData(channel);
      for (let i = 0; i < decoded.length; i++) mono[i] += data[i] / decoded.numberOfChannels;
    }
    const resampled = resampleLinear(mono, decoded.sampleRate, WAV_SAMPLE_RATE);
    return new Blob([encodeWav(resampled, WAV_SAMPLE_RATE)], { type: 'audio/wav' });
  } finally {
    void context.close();
  }
}
