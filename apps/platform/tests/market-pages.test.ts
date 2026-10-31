import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { addLesson, createCourse } from '../server/authoring/store';
import { publishCourse } from '../server/publish/store';
import { decide } from '../server/review/store';
import { setListing } from '../server/market/store';
import { handlePublic } from '../server/market/public';
import type { Env } from '../server/env';
import type { Db } from '../server/db/connection';

const teacher = { id: 't1', name: 'أستاذة منى', email: 't@example.com' };
const staff = { id: 'x1', name: 'Reviewer', email: 'review@example.com' };
const env = {} as Env;
const lesson = (title: string) => ({
  title,
  goals: [{ text: 'تعرف درجة الغليان', sceneIds: ['one'] }],
  scenes: [{ id: 'one', title: 'الأول', steps: [{ text: 'المية بتغلي عند 100 درجة.' }] }],
});

async function course(db: Db, title: string, list: boolean) {
  const { id } = await createCourse(db, teacher.id, {
    title,
    subject: 'علوم',
    description: 'حالات المية <script>alert(1)</script>',
  });
  await addLesson(db, teacher.id, id, lesson('الغليان'));
  await publishCourse(db, teacher, id);
  if (list) {
    await setListing(db, teacher.id, id, { list: true, grade: 'g4' });
    await decide(db, staff, id, 1, { status: 'approved', notes: '' });
  }
  return id;
}
const get = (db: Db, path: string, lang = 'ar') =>
  handlePublic(
    new Request(`https://learn.test${path}`, { headers: { 'accept-language': lang } }),
    env,
    { db },
  );

test('the public catalogue and course page: listed courses only, escaped, for search engines', async () => {
  const db = await testDb();
  const listed = await course(db, 'المية', true);
  const hidden = await course(db, 'سري', false);
  const page = await get(db, '/courses');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy') ?? '', /default-src 'none'/);
  const html = await page.text();
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, new RegExp(`href="/courses/${listed}"`));
  assert.doesNotMatch(html, /سري/, 'a course not listed never shows');
  assert.doesNotMatch(html, /<script>alert/, 'teacher text is escaped');
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<link rel="canonical" href="https:\/\/learn.test\/courses">/);
  assert.match(html, /الصف 4/);
  // A filtered list is not indexed; a grade with nothing in it says so.
  const none = await (await get(db, '/courses?grade=g9')).text();
  assert.match(none, /<meta name="robots" content="noindex">/);
  assert.match(none, /مفيش كورسات بالاختيارات دي/);

  const one = await get(db, `/courses/${listed}`);
  assert.equal(one.status, 200);
  const body = await one.text();
  const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(body)![1]);
  assert.deepEqual(
    [ld['@type'], ld.name, ld.offers.category, ld.offers.priceCurrency, ld.author.name],
    ['Course', 'المية', 'Free', 'USD', 'أستاذة منى'],
  );
  assert.match(body, new RegExp(`href="/\\?course=${listed}"`), 'the way into the app');
  assert.match(body, /تعرف درجة الغليان/, 'lesson goals');
  assert.match(
    body,
    new RegExp(`href="/\\?course=${listed}&amp;preview=play"`),
    'the free first part',
  );
  assert.doesNotMatch(body, /<script>alert/);
  assert.equal((await get(db, `/courses/${hidden}`)).status, 404);
  assert.match(await (await get(db, `/courses/${hidden}`)).text(), /noindex/);

  const english = await (await get(db, `/courses/${listed}?lang=en`, 'ar')).text();
  assert.match(english, /<html lang="en" dir="ltr">/);
  assert.match(english, /Start the course/);
  assert.match(english, /Grade 4/);
});

test('the sitemap lists the site and each listed course; robots points at it', async () => {
  const db = await testDb();
  const listed = await course(db, 'المية', true);
  await course(db, 'سري', false);
  const map = await (await get(db, '/sitemap.xml')).text();
  assert.match(map, /<loc>https:\/\/learn.test\/courses<\/loc>/);
  assert.match(map, new RegExp(`<loc>https://learn.test/courses/${listed}</loc><lastmod>`));
  assert.equal(map.match(/\/courses\/[0-9a-f-]{36}/g)?.length, 1);
  const robots = await (await get(db, '/robots.txt')).text();
  assert.match(robots, /Sitemap: https:\/\/learn.test\/sitemap.xml/);
  assert.match(robots, /Disallow: \/api\//);
  assert.equal(
    (await handlePublic(new Request('https://learn.test/courses', { method: 'POST' }), env, { db }))
      .status,
    405,
  );
});
