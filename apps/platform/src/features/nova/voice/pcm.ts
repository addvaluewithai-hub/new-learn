/** Averages the microphone's samples down to 16 kHz mono floats. */
export function downsample16k(samples: Float32Array, rate: number) {
  const ratio = rate / 16000,
    length = Math.max(1, Math.floor(samples.length / ratio)),
    out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0,
      count = 0;
    for (
      let j = Math.floor(i * ratio);
      j < Math.min(samples.length, Math.floor((i + 1) * ratio));
      j++
    ) {
      sum += samples[j];
      count++;
    }
    out[i] = Math.max(-1, Math.min(1, sum / Math.max(1, count)));
  }
  return out;
}
/** 16 kHz floats as base64 little-endian 16-bit PCM. */
export function pcm16(samples: Float32Array) {
  const bytes = new Uint8Array(samples.length * 2),
    view = new DataView(bytes.buffer);
  samples.forEach((value, i) =>
    view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true),
  );
  return btoa(String.fromCharCode(...bytes));
}
export const encodePcm = (samples: Float32Array, rate: number) =>
  pcm16(downsample16k(samples, rate));
export function decodePcm(base64: string) {
  const binary = atob(base64),
    bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer),
    samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}
