export function encodePcm(samples: Float32Array, rate: number) {
  const ratio = rate / 16000,
    length = Math.max(1, Math.floor(samples.length / ratio));
  const bytes = new Uint8Array(length * 2),
    view = new DataView(bytes.buffer);
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
    const value = Math.max(-1, Math.min(1, sum / Math.max(1, count)));
    view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true);
  }
  return btoa(String.fromCharCode(...bytes));
}
export function decodePcm(base64: string) {
  const binary = atob(base64),
    bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer),
    samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}
