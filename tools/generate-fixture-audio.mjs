import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Deterministic test tones, not TTS, speech alignment or content-review evidence.
const rate = 24000;
const durationMs = 3000;
const frames = (rate * durationMs) / 1000;
const folder = new URL('../apps/platform/public/fixtures/', import.meta.url);
await mkdir(folder, { recursive: true });
const manifest = {};
for (const [index, id] of ['teach', 'question', 'feedback', 'closing'].entries()) {
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(frames * 2, 40);
  for (let frame = 0; frame < frames; frame++) {
    const local = (frame / rate) % 1;
    const amplitude = local < 0.13 ? Math.sin((Math.PI * local) / 0.13) * 700 : 0;
    bytes.writeInt16LE(
      Math.round(Math.sin((2 * Math.PI * (440 + index * 110) * frame) / rate) * amplitude),
      44 + frame * 2,
    );
  }
  await writeFile(new URL(`${id}.wav`, folder), bytes);
  manifest[id] = {
    file: `/fixtures/${id}.wav`,
    durationMs,
    audioHash: createHash('sha256').update(bytes).digest('hex'),
  };
}
await writeFile(
  new URL('../fixtures/runtime-probe/audio-manifest.json', import.meta.url),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log('Generated four synthetic audio fixtures. No TTS request was sent.');
