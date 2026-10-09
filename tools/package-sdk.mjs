import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const destination = resolve(root, 'distributions');
await mkdir(destination, { recursive: true });
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--json', '--pack-destination', destination], {
    cwd: resolve(root, 'packages/lesson-runtime'),
    encoding: 'utf8',
  }),
)[0];
const bytes = await readFile(resolve(destination, packed.filename));
const manifest = {
  name: packed.name,
  version: packed.version,
  file: packed.filename,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  integrity: packed.integrity,
};
await writeFile(
  resolve(destination, `lesson-runtime-${packed.version}.json`),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(manifest);
