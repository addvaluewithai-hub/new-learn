import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { addLesson, createCourse } from '../server/authoring/store';
import { publicCourse, publishCourse } from '../server/publish/store';
import { canStudy, parsePrice, requireStudy } from '../server/publish/paid';
import { decide, reviewDetail, reviewQueue } from '../server/review/store';
import { courseText, readReport } from '../server/review/ai';
import { teacherCourses } from '../server/publish/teach';
import type { Env } from '../server/env';

const teacher = { id: 't1', name: 'أستاذة منى', email: 't@example.com' };
const student = { id: 's1', name: 'Ali', email: 's@example.com' };
const staff = { id: 'x1', name: 'Reviewer', email: 'review@example.com' };
const env = { STAFF_EMAILS: 'review@example.com' } as Env;
const lesson = (title: string) => ({
  title,
  scenes: [
    {
      id: 'one',
      title: 'الأول',
      steps: [{ text: 'المية بتغلي عند ١٠٠ درجة.' }],
      question: {
        kind: 'choice' as const,
        arabic: 'المية بتغلي عند كام؟',
        options: ['١٠٠', 'صفر'],
        answer: { arabic: '١٠٠' },
        feedback: [{ text: 'أيوه.' }],
      },
    },
  ],
});
const PAID = parsePrice({ priceCents: 1500, currency: 'USD' });

test('a free version is public at once; a paid one waits for review', async () => {
  const db = await testDb();
  const { id } = await createCourse(db, teacher.id, { title: 'المية' });
  await addLesson(db, teacher.id, id, lesson('الغليان'));
  assert.equal((await publishCourse(db, teacher, id)).review, null);
  assert.equal((await publicCourse(db, id))?.priceCents, 0);
  assert.equal(await canStudy(db, env, student, id), true, 'anyone may study a free course');
  // The teacher prices the next version: students keep version 1, free, until it is approved.
  await addLesson(db, teacher.id, id, lesson('التجمد'));
  assert.deepEqual((await publishCourse(db, teacher, id, PAID)).review, {
    status: 'pending',
    version: 2,
  });
  const seen = await publicCourse(db, id);
  assert.equal(seen?.version, 1);
  assert.equal(seen?.lessons.length, 1);
  const [queued] = await reviewQueue(db);
  assert.deepEqual([queued.courseId, queued.version, queued.priceCents], [id, 2, 1500]);
  const [work] = await teacherCourses(db, teacher.id);
  assert.equal(work.published?.review?.status, 'pending');
  // Sent back: notes are required, and version 1 stays public.
  await assert.rejects(decide(db, staff, id, 2, { status: 'changes', notes: ' ' }), {
    key: 'review.needNotes',
  });
  await decide(db, staff, id, 2, { status: 'changes', notes: 'السؤال الأول محتاج مصدر.' });
  assert.equal((await publicCourse(db, id))?.version, 1);
  await assert.rejects(decide(db, staff, id, 2, { status: 'approved', notes: '' }), {
    key: 'review.decided',
  });
  // Fixed and sent again: approved, version 3 is public at its price.
  await publishCourse(db, teacher, id, PAID);
  await decide(db, staff, id, 3, { status: 'approved', notes: '' });
  const now = await publicCourse(db, id);
  assert.deepEqual([now?.version, now?.priceCents, now?.currency], [3, 1500, 'USD']);
  assert.equal((await reviewQueue(db)).length, 0);
});

test('a paid course is studied by buyers, its teacher and staff only', async () => {
  const db = await testDb();
  const { id } = await createCourse(db, teacher.id, { title: 'المية' });
  await addLesson(db, teacher.id, id, lesson('الغليان'));
  await publishCourse(db, teacher, id, PAID);
  assert.equal(await publicCourse(db, id), null, 'not public before its first approval');
  await decide(db, staff, id, 1, { status: 'approved', notes: '' });
  assert.equal(await canStudy(db, env, teacher, id), true);
  assert.equal(await canStudy(db, env, staff, id), true);
  await assert.rejects(requireStudy(db, env, student, id), {
    status: 402,
    key: 'publish.paidCourse',
  });
  assert.throws(() => parsePrice({ priceCents: 10, currency: 'USD' }), { key: 'publish.badPrice' });
});

test('the AI pass reads every step, question and marked answer, and keeps only sound findings', async () => {
  const db = await testDb();
  const { id } = await createCourse(db, teacher.id, { title: 'المية' });
  await addLesson(db, teacher.id, id, lesson('الغليان'));
  await publishCourse(db, teacher, id, PAID);
  const detail = await reviewDetail(db, id, 1);
  const text = courseText(detail.lessons);
  for (const part of [
    '# LESSON: الغليان',
    'step 1: المية بتغلي',
    'marked answer: ١٠٠',
    'feedback: أيوه.',
  ])
    assert.ok(text.includes(part), part);
  const report = readReport(
    JSON.stringify({
      summary: 'One issue.',
      findings: [
        {
          severity: 'high',
          kind: 'accuracy',
          lesson: 'الغليان',
          where: 'one',
          note: 'At sea level.',
        },
        { severity: 'urgent', kind: 'accuracy', lesson: 'x', where: 'y', note: 'bad severity' },
        { severity: 'low', kind: 'vibes', lesson: 'x', where: 'y', note: 'bad kind' },
      ],
    }),
  );
  assert.equal(report.summary, 'One issue.');
  assert.deepEqual(
    report.findings.map((f) => f.note),
    ['At sea level.'],
  );
});
