// Copy imported lessons' assets (fonts, images) to the served lesson-assets path after
// checking each file against the lesson's own manifest. Runs before dev and build.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const imported = join(root, 'content/imported');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const registry = JSON.parse(
  await readFile(join(imported, 'registry.json'), 'utf8').catch(() => '{"curricula":[]}'),
);
let copied = 0;
for (const course of registry.curricula)
  for (const lesson of course.lessons.filter((item) => item.moduleId)) {
    const folder = join(imported, course.id, lesson.id);
    const meta = JSON.parse(await readFile(join(folder, 'lesson.json'), 'utf8'));
    const served = join(root, 'apps/platform/public', meta.assetBase.replace(/^\//, ''));
    if (!/^\/lesson-assets\/[a-z0-9-]+\/[a-z0-9-]+$/.test(meta.assetBase))
      throw new Error(`${lesson.id}: unexpected asset base ${meta.assetBase}`);
    for (const file of meta.files.filter((item) => item.path.startsWith('assets/'))) {
      const bytes = await readFile(join(folder, file.path));
      if (sha(bytes) !== file.sha256) throw new Error(`${lesson.id}: asset changed ${file.path}`);
      const target = join(served, file.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
      copied++;
    }
  }
console.log(`Verified and served ${copied} imported lesson asset files.`);
