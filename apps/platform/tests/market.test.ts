import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { addLesson, createCourse } from '../server/authoring/store';
import { publishCourse, withdrawCourse } from '../server/publish/store';
import { parsePrice } from '../server/publish/paid';
import { decide, reviewQueue } from '../server/review/store';
import { marketCourses, marketFacets, setListing } from '../server/market/store';
import { teacherCourses } from '../server/publish/teach';
import type { Db } from '../server/db/connection';

const teacher = { id: 't1', name: 'أستاذة منى', email: 't@example.com' };
const staff = { id: 'x1', name: 'Reviewer', email: 'review@example.com' };
const PAID = parsePrice({ priceCents: 1500, currency: 'USD' });
const lesson = (title: string) => ({
  title,
  scenes: [{ id: 'one', title: 'الأول', steps: [{ text: 'المية بتغلي عند 100 درجة.' }] }],
});

async function published(db: Db, title: string, subject = 'علوم') {
  const { id } = await createCourse(db, teacher.id, { title, subject });
  await addLesson(db, teacher.id, id, lesson('الغليان'));
  await publishCourse(db, teacher, id);
  return id;
}
const listed = async (db: Db) => (await marketCourses(db, {})).map((c) => c.id);

test('a free course is listed only after review, and each new version is reviewed again', async () => {
  const db = await testDb();
  const id = await published(db, 'المية');
  assert.deepEqual(await setListing(db, teacher.id, id, { list: true, grade: 'g4' }), {
    listing: 'requested',
  });
  assert.deepEqual(await listed(db), [], 'not listed before review');
  const [queued] = await reviewQueue(db);
  assert.deepEqual([queued.courseId, queued.version, queued.priceCents], [id, 1, 0]);
  await decide(db, staff, id, 1, { status: 'approved', notes: '' });
  const [card] = await marketCourses(db, {});
  assert.deepEqual(
    [card.id, card.title, card.grade, card.lessons, card.priceCents],
    [id, 'المية', 'g4', 1, 0],
  );
  // A new version goes back to review and leaves the catalog until approved.
  await addLesson(db, teacher.id, id, lesson('التجمد'));
  assert.deepEqual((await publishCourse(db, teacher, id)).review, {
    status: 'pending',
    version: 2,
  });
  assert.deepEqual(await listed(db), []);
  const [work] = await teacherCourses(db, teacher.id);
  assert.deepEqual([work.published?.listing, work.published?.grade], ['requested', 'g4']);
  await decide(db, staff, id, 2, { status: 'approved', notes: '' });
  assert.equal((await marketCourses(db, {}))[0].lessons, 2);
});

test('sent back: unlisted until a fixed version; the teacher can unlist any time', async () => {
  const db = await testDb();
  const id = await published(db, 'المية');
  await setListing(db, teacher.id, id, { list: true });
  await decide(db, staff, id, 1, { status: 'changes', notes: 'الرقم محتاج مصدر.' });
  assert.equal((await teacherCourses(db, teacher.id))[0].published?.listing, 'private');
  await assert.rejects(setListing(db, teacher.id, id, { list: true }), { key: 'market.fixFirst' });
  await publishCourse(db, teacher, id);
  await setListing(db, teacher.id, id, { list: true });
  // Unlisting while it waits takes it out of the queue; asking again reopens it.
  await setListing(db, teacher.id, id, { list: false });
  assert.equal((await reviewQueue(db)).length, 0);
  await setListing(db, teacher.id, id, { list: true });
  assert.equal((await reviewQueue(db)).length, 1);
  await decide(db, staff, id, 2, { status: 'approved', notes: '' });
  await setListing(db, teacher.id, id, { list: false });
  assert.deepEqual(await listed(db), []);
  assert.deepEqual(
    await setListing(db, teacher.id, id, { list: true }),
    { listing: 'listed' },
    'an approved version lists again without a new review',
  );
  await withdrawCourse(db, teacher.id, id);
  assert.deepEqual(await listed(db), [], 'a withdrawn course is never listed');
  await assert.rejects(setListing(db, 'someone-else', id, { list: true }), {
    key: 'publish.notPublished',
  });
});

test('a paid course lists with its approved version; filters and search', async () => {
  const db = await testDb();
  const { id } = await createCourse(db, teacher.id, { title: 'الكيمياء', subject: 'كيمياء' });
  await addLesson(db, teacher.id, id, lesson('الذرة'));
  await publishCourse(db, teacher, id, PAID);
  assert.deepEqual(await setListing(db, teacher.id, id, { list: true, grade: 'g10' }), {
    listing: 'requested',
  });
  await decide(db, staff, id, 1, { status: 'approved', notes: '' });
  assert.deepEqual(await listed(db), [id], 'listed once its sale is approved');
  // A later paid version waits for its own review; the approved one stays listed.
  await publishCourse(db, teacher, id, PAID);
  assert.deepEqual(await listed(db), [id]);
  const free = await published(db, 'المية', 'علوم');
  await setListing(db, teacher.id, free, { list: true, grade: 'g4' });
  await decide(db, staff, free, 1, { status: 'approved', notes: '' });
  assert.equal((await listed(db)).length, 2);
  assert.deepEqual(
    (await marketCourses(db, { subject: 'كيمياء' })).map((c) => c.id),
    [id],
  );
  assert.deepEqual(
    (await marketCourses(db, { grade: 'g4' })).map((c) => c.id),
    [free],
  );
  assert.deepEqual(
    (await marketCourses(db, { q: 'كيم' })).map((c) => c.id),
    [id],
  );
  assert.deepEqual(
    (await marketCourses(db, { q: 'منى' })).length,
    2,
    'search finds the teacher too',
  );
  assert.deepEqual(await marketFacets(db), {
    subjects: ['علوم', 'كيمياء'],
    languages: ['ar'],
    grades: ['g10', 'g4'],
  });
  await assert.rejects(setListing(db, teacher.id, id, { list: true, grade: 'g99' }), {
    key: 'market.badGrade',
  });
});
