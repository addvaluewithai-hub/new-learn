import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const lock = JSON.parse(
  await readFile(resolve(root, 'content/chemistry/states-of-matter/data/media-lock.json'), 'utf8'),
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
await Promise.all(
  lock.assets.map(async (asset) => {
    if (!/^(recordings|lesson-assets)\/[\w./-]+$/.test(asset.file) || asset.file.includes('..'))
      throw new Error('Unsafe media path');
    const target = resolve(root, 'apps/platform/public', asset.file);
    const cached = await readFile(target).catch(() => null);
    if (cached && hash(cached) === asset.sha256) return;
    const bytes = await readFile(
      resolve(root, 'content/chemistry/states-of-matter/media', asset.file),
    );
    if (hash(bytes) !== asset.sha256) throw new Error(`Media edition mismatch: ${asset.file}`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }),
);
console.log(`Verified ${lock.assets.length} pinned original review media files. No TTS requests.`);
