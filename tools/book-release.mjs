// Pin the reviewed book content, renderer code and served media to immutable editions.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { readingLesson as ch8 } from '../content/book-guided/physics-ch08/reading/package.ts';
import { readingLesson as ch9 } from '../content/book-guided/physics-ch09/reading/package.ts';
const root = resolve(new URL('..', import.meta.url).pathname);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const files = [];
async function walk(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, item.name);
    if (item.isDirectory()) await walk(child);
    else files.push({ path: relative(root, child), sha256: sha(await readFile(child)) });
  }
}
for (const path of [
  'content/book-guided/physics-ch08',
  'content/book-guided/physics-ch09',
  'apps/platform/public/book-ch08',
  'apps/platform/public/book-ch09',
  'apps/platform/public/fonts/book',
])
  await walk(resolve(root, path));
for (const path of [
  'content/book-guided/published.ts',
  'content/book-guided/modules.ts',
  'content/book-guided/packages.ts',
])
  files.push({ path, sha256: sha(await readFile(resolve(root, path))) });
files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
const sourceDigest = sha(JSON.stringify(files));
const runtime = JSON.parse(
  await readFile(resolve(root, 'packages/lesson-runtime/package.json'), 'utf8'),
).version;
const lessons = [ch8, ch9].map((source, index) => {
  const chapter = index + 8;
  const id = `phys1-textbook-ch0${chapter}`;
  const identity = {
    id,
    curriculumId: 'physics-1-book-guided',
    order: index + 1,
    previewRevision: source.contentRevision,
  };
  const manifestHash = sha(JSON.stringify({ identity, sourceDigest, runtime }));
  return {
    ...identity,
    title: source.title,
    subtitle: source.englishTitle,
    previewLessonId: source.lessonId,
    moduleId: `book-reading:${id}`,
    contentRevision: manifestHash,
    manifestHash,
    runtimeVersion: runtime,
    goals: source.goals,
  };
});
const release = {
  sourceDigest,
  fileCount: files.length,
  curricula: [
    {
      id: 'physics-1-book-guided',
      title: 'الفيزياء · شرح مع الكتاب',
      subject: 'الفيزياء',
      description:
        'نقرأ نص الكتاب ونشرحه مع Nova، جزءًا جزءًا وبنفس ترتيب الأمثلة والمسائل. شابتر 8: Solids and Elasticity، وشابتر 9: Sound Waves.',
      parts: [
        {
          title: 'شرح مع الكتاب',
          summary: 'ابدأ بشابتر 8، وبعده كمّل شابتر 9.',
          lessons: lessons.map((l) => l.id),
        },
      ],
      lessons,
    },
  ],
};
const target = resolve(root, 'content/book-guided/release.json');
if (process.argv.includes('--check')) {
  const current = JSON.parse(await readFile(target, 'utf8'));
  if (JSON.stringify(current) !== JSON.stringify(release))
    throw new Error('Book release is stale: npm run book:release');
  console.log(`Verified ${files.length} book source/media files and two pinned editions.`);
} else {
  await writeFile(target, JSON.stringify(release, null, 2) + '\n');
  console.log('Prepared the two reviewed book editions for release.');
}
