import type { ReadingPackage } from '@learn/lesson-runtime/core';
import { database, type Db } from '../db/connection';
import type { Env } from '../env';
import { HttpError, json } from '../http';
import { ipOf, rateLimit } from '../ops/limits';
import { boardKeys, publicCourse, publishedLesson } from '../publish/store';

// A course's free preview (M7, docs/marketplace.md): anyone with its link, signed in or not,
// sees what the course is and plays the first scene of its first lesson. The rest asks for an
// account. Nothing is saved; the course must be published and not withdrawn.

/** The first scene of a lesson, with only its goals and the boards it draws with. */
export function firstScene(pkg: ReadingPackage, boards: Record<string, unknown>) {
  const scene = pkg.scenes[0];
  const question = scene.question?.id;
  const cut: ReadingPackage = {
    ...pkg,
    scenes: [scene],
    goals: (pkg.goals ?? [])
      .filter((g) => g.sceneIds.includes(scene.id))
      .map((g) => ({
        ...g,
        sceneIds: [scene.id],
        questionIds: g.questionIds.filter((q) => q === question),
      })),
  };
  const used = boardKeys(cut);
  return {
    package: cut,
    boards: Object.fromEntries(Object.entries(boards).filter(([key]) => used.includes(key))),
  };
}

/** What a visitor sees of a course: its card, and the first lesson's first scene to try. */
export async function coursePreview(db: Db, courseId: string) {
  const course = await publicCourse(db, courseId);
  if (!course || !course.lessons.length) throw new HttpError(404, 'publish.courseGone');
  const first = course.lessons[0];
  const lesson = await publishedLesson(db, courseId, first.id);
  const pkg = lesson.package as ReadingPackage;
  return {
    course,
    lesson: {
      id: first.id,
      title: lesson.title,
      scenes: pkg.scenes.length,
      ...firstScene(pkg, lesson.boards as Record<string, unknown>),
    },
  };
}

/** `/api/public/…`: read without an account, limited per IP. */
export async function publicApi(request: Request, env: Env, path: string, deps: { db?: Db } = {}) {
  if (request.method !== 'GET') throw new HttpError(405, 'http.notAllowed');
  const db = deps.db ?? database(env);
  await rateLimit(db, 'pages.public', ipOf(request) || 'unknown');
  const m = /^\/api\/public\/courses\/([0-9a-f-]{36})(\/preview)?$/.exec(path);
  if (!m) throw new HttpError(404, 'http.notFound');
  const preview = await coursePreview(db, m[1]);
  return json(
    m[2]
      ? preview
      : {
          course: preview.course,
          lesson: {
            id: preview.lesson.id,
            title: preview.lesson.title,
            scenes: preview.lesson.scenes,
          },
        },
  );
}
