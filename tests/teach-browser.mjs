// The teacher's workspace and a student's course (docs/connector.md, publishing): the
// dashboard, one course's self-check, publish, share link, outline and notes, then the course
// page a student opens from the link, enrolment, and the lesson playing with saved progress;
// listing the course in the marketplace and finding it on the Explore page.
// At 1280px and 390px, against a mocked API.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { buildPackage } from '../apps/platform/server/authoring/format.ts';

const app = 'http://127.0.0.1:5196';
const courseId = '11111111-2222-4333-8444-555555555555';
const lessonA = 'aaaaaaaa-2222-4333-8444-555555555555';
const lessonB = 'bbbbbbbb-2222-4333-8444-555555555555';
const pkg = (id, title) => ({
  ...buildPackage(
    {
      title,
      scenes: [
        { id: 'intro', title: 'مقدمة', steps: [{ text: 'خطوة أولى.' }, { text: 'خطوة تانية.' }] },
      ],
    },
    { lessonId: id, courseId, courseTitle: 'المية', order: 1, revision: 1 },
    {},
  ),
  lessonId: `pub:${id}`,
  curriculumId: `pub-course:${courseId}`,
  contentRevision: `pub-${courseId}-v1`,
});
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5196',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);
let browser;

function api(store) {
  const course = () => ({
    id: courseId,
    title: store.title,
    subject: 'علوم',
    description: 'حالات المية.',
    language: 'ar',
    parts: store.parts,
    lessons: [
      { id: lessonA, courseId, title: 'الغليان', revision: 2 },
      { id: lessonB, courseId, title: 'التجمد', revision: 1 },
    ],
    openNotes: store.notes.filter((n) => n.status === 'open').length,
    published: store.version
      ? {
          version: store.version,
          publishedAt: '2026-10-29T10:00:00Z',
          withdrawn: false,
          students: 1,
          stale: false,
          publicVersion: store.version,
          priceCents: 0,
          currency: 'USD',
          listing: store.listing,
          grade: store.grade,
          review: null,
        }
      : null,
  });
  return async (route) => {
    const request = route.request();
    const path = decodeURIComponent(new URL(request.url()).pathname);
    const method = request.method();
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me')
      return send({ user: { id: 't', name: 'أستاذة منى', email: 't@example.com' } });
    if (path === '/api/teach/courses') return send({ courses: [course()] });
    if (path === `/api/teach/courses/${courseId}` && method === 'GET')
      return send({
        ...course(),
        check: {
          ready: true,
          checks: [
            { ok: true, text: '2 دروس جاهزة' },
            { ok: true, text: 'للكورس عنوان' },
          ],
          warnings: [{ ok: false, text: '1 ملاحظة لسه مفتوحة' }],
        },
        notes: store.notes,
        progress: [{ lessonId: lessonA, started: 1, completed: 0 }],
      });
    if (path === `/api/teach/courses/${courseId}` && method === 'POST') {
      const body = request.postDataJSON();
      store.outline.push(body);
      store.title = body.title;
      store.parts = body.parts;
      return send({ id: courseId, ...body });
    }
    if (path === `/api/teach/courses/${courseId}/publish`) {
      store.version = (store.version ?? 0) + 1;
      return send({ courseId, version: store.version, lessons: 2 }, 201);
    }
    if (path === `/api/teach/courses/${courseId}/listing`) {
      const body = request.postDataJSON();
      store.listing = body.list ? 'requested' : 'private';
      store.grade = body.grade;
      return send({ listing: store.listing });
    }
    // The marketplace: the course once staff approved it, filtered by grade.
    if (path === '/api/courses/market') {
      const q = new URL(request.url()).searchParams;
      store.marketQueries.push(Object.fromEntries(q));
      const card = {
        id: courseId,
        title: store.title,
        subject: 'علوم',
        description: 'حالات المية.',
        language: 'ar',
        grade: 'g4',
        teacher: 'أستاذة منى',
        priceCents: 0,
        currency: 'USD',
        lessons: 2,
      };
      return send({
        courses: !q.get('grade') || q.get('grade') === 'g4' ? [card] : [],
        facets: { subjects: ['علوم'], languages: ['ar'], grades: ['g4', 'g5'] },
      });
    }
    const note = /^\/api\/teach\/notes\/(.+)$/.exec(path);
    if (note) {
      const n = store.notes.find((x) => x.id === note[1]);
      n.status = request.postDataJSON().status;
      return send(n);
    }
    if (path === '/api/courses')
      return send({
        courses: store.enrolled
          ? [
              {
                id: courseId,
                title: store.title,
                subject: 'علوم',
                description: '',
                teacher: 'أستاذة منى',
                lessons: [
                  { id: lessonA, title: 'الغليان', position: 1, status: 'new', updatedAt: null },
                  { id: lessonB, title: 'التجمد', position: 2, status: 'new', updatedAt: null },
                ],
              },
            ]
          : [],
      });
    if (path === `/api/courses/${courseId}` && method === 'GET')
      return send({
        id: courseId,
        title: store.title,
        subject: 'علوم',
        description: 'حالات المية.',
        language: 'ar',
        teacher: 'أستاذة منى',
        version: 1,
        publishedAt: '2026-10-29T10:00:00Z',
        parts: store.parts,
        lessons: [
          {
            id: lessonA,
            title: 'الغليان',
            position: 1,
            goals: [{ id: 'g1', text: 'تعرف درجة الغليان' }],
            scenes: 1,
          },
          { id: lessonB, title: 'التجمد', position: 2, goals: [], scenes: 1 },
        ],
      });
    if (path === `/api/courses/${courseId}` && method === 'POST') {
      store.enrolled = true;
      return send({ ok: true }, 201);
    }
    if (path === `/api/courses/${courseId}/lessons/${lessonA}`)
      return send({ lessonId: lessonA, package: pkg(lessonA, 'الغليان'), boards: {} });
    if (path === `/api/lessons/pub:${lessonA}/progress` && method === 'GET')
      return send({
        contentRevision: `pub-${courseId}-v1`,
        revision: null,
        state: null,
        completed: false,
      });
    if (path === `/api/lessons/pub:${lessonA}/progress` && method === 'PUT') {
      store.saved.push(request.postDataJSON());
      return send({
        revision: store.saved.length - 1,
        state: store.saved.at(-1).state,
        completed: false,
      });
    }
    if (path === '/api/catalog') return send({ curricula: [], resume: null });
    if (path === '/api/authoring/courses') return send([]);
    return send({ error: 'not here' }, 404);
  };
}

async function run(width, height) {
  const store = {
    title: 'المية',
    parts: [{ title: 'الأساس', lessonIds: [lessonA, lessonB] }],
    notes: [
      {
        id: 'n1',
        lessonId: lessonA,
        position: { sceneId: 'intro', phase: 'narration', step: 0 },
        kind: 'text',
        note: 'وضّح بمثال',
        status: 'review',
        resolution: 'ضفت مثال البيت',
        currentText: 'خطوة أولى.',
        createdAt: '2026-10-29T09:00:00Z',
      },
    ],
    version: null,
    listing: 'private',
    grade: '',
    marketQueries: [],
    outline: [],
    enrolled: false,
    saved: [],
  };
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', api(store));
  await page
    .context()
    .grantPermissions(['clipboard-read', 'clipboard-write'])
    .catch(() => {});
  // The dashboard: one course, a draft, with its counts.
  await page.goto(`${app}/?teach`);
  await page.getByRole('heading', { name: 'كورساتك', level: 1 }).waitFor({ timeout: 20000 });
  assert.equal(await page.locator('.teach-course').count(), 1);
  // «Connect your AI»: the connector address, copied with one click.
  await page.locator('.teach-connect').getByRole('button').click();
  if (width === 1280)
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\/mcp$/);
  await page.screenshot({ path: `test-results/teach-${width}.png`, fullPage: true });
  await page.getByRole('link', { name: 'افتح' }).click();
  await page.getByRole('heading', { name: 'المية', level: 1 }).waitFor();
  // Publish: the self-check shows, the warning does not block, and the link appears after.
  await page.getByRole('radio', { name: 'النشر' }).click();
  assert.equal(await page.locator('.teach-checklist li').count(), 3);
  await page.getByRole('button', { name: 'انشر لطلابك' }).click();
  await page.getByRole('status').filter({ hasText: 'اتنشر' }).waitFor();
  assert.equal(store.version, 1);
  await page.getByLabel('لينك الكورس').waitFor();
  assert.equal(await page.getByLabel('لينك الكورس').inputValue(), `${app}/?course=${courseId}`);
  // The marketplace: a free course asks to be listed, for a grade, and waits for review.
  await page.locator('.teach-listing select').selectOption('g4');
  await page.getByRole('button', { name: 'اعرضه في السوق' }).click();
  await page.locator('.teach-listing').getByText('مستني المراجعة قبل ما يتعرض').waitFor();
  assert.deepEqual([store.listing, store.grade], ['requested', 'g4']);
  await page.screenshot({ path: `test-results/teach-publish-${width}.png`, fullPage: true });
  // The outline: move a lesson up and rename, then the saved parts carry the new order.
  await page.getByRole('radio', { name: 'الترتيب' }).click();
  await page.getByLabel('اسم الكورس').fill('المية وحالاتها');
  // The course's own voice and character for Nova.
  await page.getByLabel('صوت خاص بالكورس').check();
  await page.getByLabel('الصوت', { exact: true }).selectOption('Algenib');
  await page.getByLabel('الشخصية', { exact: true }).fill('عالم فلك صوته عميق');
  await page.getByRole('button', { name: 'تحت' }).first().click();
  await page.getByRole('button', { name: 'احفظ الترتيب' }).click();
  await page.getByRole('status').filter({ hasText: 'اتحفظ' }).waitFor();
  assert.deepEqual(store.outline.at(-1).parts, [
    { title: 'الأساس', lessonIds: [lessonB, lessonA] },
  ]);
  assert.equal(store.outline.at(-1).title, 'المية وحالاتها');
  assert.deepEqual(store.outline.at(-1).voice, {
    voice: 'Algenib',
    pace: 'normal',
    persona: 'عالم فلك صوته عميق',
  });
  // Notes: a fixed note is confirmed from the inbox.
  await page.getByRole('radio', { name: /الملاحظات/ }).click();
  await page.locator('.teach-note-item').waitFor();
  await page.getByRole('button', { name: 'تمام', exact: true }).click();
  // Confirmed notes leave the open list; their chip shows them again.
  await page.getByRole('button', { name: 'تمام (1)' }).waitFor();
  await page.getByRole('button', { name: 'تمام (1)' }).click();
  await page.locator('.teach-note-item .nl-badge', { hasText: 'تمام' }).waitFor();
  await page.screenshot({ path: `test-results/teach-notes-${width}.png`, fullPage: true });
  // A student opens the link, starts, and the lesson plays and saves under its pub: id.
  await page.goto(`${app}/?course=${courseId}`);
  await page.getByRole('heading', { name: 'المية وحالاتها', level: 1 }).waitFor();
  assert.equal(await page.locator('.course-lessons li').count(), 2);
  await page.screenshot({ path: `test-results/course-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'ابدأ الكورس' }).click();
  await page.waitForURL(`${app}/?course=${courseId}&lesson=${lessonA}`);
  assert.equal(store.enrolled, true);
  await page.locator('.rl').waitFor({ timeout: 20000 });
  await page.locator('.rl-dock .rl-next').click();
  await page.waitForTimeout(1500);
  assert.ok(store.saved.length >= 1, 'progress is saved');
  assert.equal(store.saved[0].contentRevision, `pub-${courseId}-v1`);
  await page.screenshot({ path: `test-results/course-lesson-${width}.png` });
  // Explore: the listed course, a grade filter that hides it, and its card opening the course.
  await page.goto(`${app}/?explore`);
  await page.getByRole('heading', { name: 'استكشف', level: 1 }).waitFor({ timeout: 20000 });
  await page.locator('.market-card').getByText('الصف 4').waitFor();
  await page.getByLabel('الصف').selectOption('g5');
  await page.getByText('مفيش كورسات بالاختيارات دي.').waitFor();
  assert.equal(store.marketQueries.at(-1).grade, 'g5');
  await page.getByLabel('الصف').selectOption('');
  await page.getByLabel('دوّر').fill('مية');
  await page.locator('.market-card').waitFor();
  assert.equal(store.marketQueries.at(-1).q, 'مية');
  await page.screenshot({ path: `test-results/explore-${width}.png`, fullPage: true });
  await page.locator('.market-card h2 a').click();
  await page.waitForURL(`${app}/?course=${courseId}`);
  // Back home, the course is in the library.
  await page.goto(`${app}/`);
  await page.locator('.my-course').waitFor({ timeout: 20000 });
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await mkdir('test-results', { recursive: true });
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (
      await fetch(app).then(
        (r) => r.ok,
        () => false,
      )
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  browser = await chromium.launch();
  await run(1280, 900);
  await run(390, 844);
  console.log(
    'Teacher workspace, publishing, marketplace listing, Explore and a student course passed at 1280px and 390px.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
