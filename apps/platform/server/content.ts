import { and, eq, asc, inArray, sql } from 'drizzle-orm';
import { curricula, lessons, releases, editions } from './db/content';
import { database } from './db/connection';
import type { AuthUser, Env } from './env';
import { learnerSummaries, resumeTarget } from './progress/summary';
import type { ProgressSummary } from './progress/snapshot';
import { HttpError } from './http';
import { supportedEdition } from './moduleAvailability';
import { availableCurricula } from '../../../content/availability';
export const curriculumVisibility = () =>
  and(
    eq(curricula.visibility, 'published'),
    availableCurricula === null
      ? undefined
      : availableCurricula.length
        ? inArray(curricula.id, availableCurricula)
        : sql`false`,
  );
export async function catalog(env: Env, user?: AuthUser) {
  const summaries = user ? await learnerSummaries(env, user) : new Map<string, ProgressSummary>();
  const rows = await database(env)
    .select({
      curriculum: curricula,
      lesson: lessons,
      release: releases,
      edition: editions,
    })
    .from(curricula)
    .leftJoin(lessons, eq(lessons.curriculumId, curricula.id))
    .leftJoin(releases, eq(releases.lessonId, lessons.id))
    .leftJoin(
      editions,
      and(
        eq(editions.lessonId, releases.lessonId),
        eq(editions.contentRevision, releases.contentRevision),
      ),
    )
    .where(curriculumVisibility())
    .orderBy(asc(curricula.id), asc(lessons.position));
  const groups = new Map<
    string,
    {
      id: string;
      title: string;
      description: string;
      subject: string;
      lessons: {
        id: string;
        title: string;
        subtitle: string;
        position: number;
        availability: 'review' | 'published' | 'coming-soon';
        progress?: ProgressSummary;
      }[];
    }
  >();
  for (const row of rows) {
    let group = groups.get(row.curriculum.id);
    if (!group) {
      group = { ...row.curriculum, lessons: [] };
      groups.set(group.id, group);
    }
    if (row.lesson)
      group.lessons.push({
        ...row.lesson,
        availability:
          supportedEdition(row.edition) &&
          row.release &&
          (row.release.stage === 'published' || env.ALLOW_CONTENT_REVIEW === 'true')
            ? row.release.stage
            : 'coming-soon',
        progress: summaries.get(row.lesson.id),
      });
  }
  const list = [...groups.values()];
  return { curricula: list, resume: resumeTarget(list) };
}
export async function lessonEdition(env: Env, id: string) {
  const [row] = await database(env)
    .select({
      lessonId: releases.lessonId,
      contentRevision: releases.contentRevision,
      moduleId: editions.moduleId,
      manifestHash: editions.manifestHash,
      runtimeVersion: editions.runtimeVersion,
      stage: releases.stage,
    })
    .from(releases)
    .innerJoin(
      editions,
      and(
        eq(editions.lessonId, releases.lessonId),
        eq(editions.contentRevision, releases.contentRevision),
      ),
    )
    .innerJoin(lessons, eq(lessons.id, releases.lessonId))
    .innerJoin(curricula, eq(curricula.id, lessons.curriculumId))
    .where(and(eq(releases.lessonId, id), curriculumVisibility()));
  if (
    !row ||
    !supportedEdition(row) ||
    (row.stage === 'review' && env.ALLOW_CONTENT_REVIEW !== 'true')
  )
    throw new HttpError(404, 'content.lessonNotReady');
  return row;
}
