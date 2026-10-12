// Write the imported catalog to the database: curricula, lessons, immutable editions and
// release pointers for every imported reading lesson. Idempotent; one transaction.
//   DATABASE_URL=<admin/direct URL> npm run content:sync            # apply
//   npm run content:sync -- --print                                 # show SQL only
// Lessons not ready yet are listed (catalog shows them as coming soon) without a release.
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const root = resolve(new URL('..', import.meta.url).pathname);
const registry = JSON.parse(await readFile(join(root, 'content/imported/registry.json'), 'utf8'));
const statements = [];
const q = (text, params) => statements.push({ text, params });
for (const course of registry.curricula) {
  q(
    `INSERT INTO learn_app.curricula(id,title,description,subject,visibility)
     VALUES ($1,$2,$3,$4,'published')
     ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description,
       subject=EXCLUDED.subject, visibility='published'`,
    [course.id, course.title, course.description, course.subject],
  );
  // Positions are unique per curriculum: park existing ones first, then set the final order.
  q(
    `UPDATE learn_app.lessons SET position = position + 10000
     WHERE curriculum_id=$1 AND position < 10000`,
    [course.id],
  );
  for (const lesson of course.lessons) {
    q(
      `INSERT INTO learn_app.lessons(id,curriculum_id,position,title,subtitle)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET position=EXCLUDED.position, title=EXCLUDED.title,
         subtitle=EXCLUDED.subtitle`,
      [lesson.id, course.id, lesson.order, lesson.title, lesson.subtitle ?? ''],
    );
    if (!lesson.moduleId) continue;
    q(
      `INSERT INTO learn_app.lesson_editions(lesson_id,content_revision,module_id,manifest_hash,runtime_version)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [
        lesson.id,
        lesson.contentRevision,
        lesson.moduleId,
        lesson.manifestHash,
        lesson.runtimeVersion,
      ],
    );
    q(
      `INSERT INTO learn_app.lesson_releases(lesson_id,content_revision,stage)
       VALUES ($1,$2,'published')
       ON CONFLICT (lesson_id) DO UPDATE SET content_revision=EXCLUDED.content_revision,
         stage='published', released_at=now()
       WHERE learn_app.lesson_releases.content_revision IS DISTINCT FROM EXCLUDED.content_revision
          OR learn_app.lesson_releases.stage <> 'published'`,
      [lesson.id, lesson.contentRevision],
    );
  }
}
if (process.argv.includes('--print')) {
  for (const { text, params } of statements)
    console.log(
      text.replace(/\$(\d+)/g, (_, n) => `'${String(params[n - 1]).replace(/'/g, "''")}'`) + ';',
    );
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to an admin/direct connection.');
const sql = neon(process.env.DATABASE_URL);
await sql.transaction(statements.map(({ text, params }) => sql.query(text, params)));
const lessons = registry.curricula.flatMap((c) => c.lessons);
console.log(
  `Synced ${registry.curricula.length} curricula, ${lessons.length} lessons, ` +
    `${lessons.filter((l) => l.moduleId).length} released reading lessons.`,
);
