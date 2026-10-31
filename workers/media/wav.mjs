// PCM 16-bit mono from the speech model, as a WAV file, and back.

/** A WAV file (bytes) from little-endian 16-bit PCM samples. */
export function wavFromPcm16(pcm, rate = 24000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Seconds of audio in 16-bit mono PCM. */
export const pcmSeconds = (pcm, rate = 24000) => pcm.length / 2 / rate;

/** The sample rate a Gemini audio mime type declares (`audio/L16;codec=pcm;rate=24000`). */
export function rateOf(mime, fallback = 24000) {
  const m = /rate=(\d+)/.exec(mime ?? '');
  return m ? Number(m[1]) : fallback;
}

/**
 * The RMS loudness of the PCM in short windows (0..1, normalised to its loud parts), so a
 * long silence inside a clip can be told from speech (used to gate word timings).
 */
export function envelope(pcm, rate = 24000, hopMs = 20) {
  const hop = Math.max(1, Math.round((rate * hopMs) / 1000));
  const n = Math.floor(pcm.length / 2);
  const out = [];
  for (let i = 0; i < n; i += hop) {
    let sum = 0;
    const end = Math.min(n, i + hop);
    for (let j = i; j < end; j++) {
      const s = pcm.readInt16LE(j * 2) / 32768;
      sum += s * s;
    }
    out.push(Math.sqrt(sum / (end - i)));
  }
  const sorted = [...out].sort((a, b) => a - b);
  const ref = sorted[Math.floor(sorted.length * 0.97)] || 1;
  return { values: out.map((v) => v / ref), hopMs };
}
