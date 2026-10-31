import { t } from '../../i18n';
import type { Note } from '../authoring/FeedbackPanel';

export type Part = { title: string; lessonIds: string[] };
export type TeachLesson = { id: string; courseId: string; title: string; revision: number };
export type Published = {
  version: number;
  publishedAt: string;
  withdrawn: boolean;
  students: number;
  /** The draft changed after this version was published. */
  stale: boolean;
  /** The version students see and its price; a paid version waits for review first. */
  publicVersion: number | null;
  priceCents: number;
  currency: string;
  review: {
    version: number;
    status: 'pending' | 'approved' | 'changes';
    notes: string;
    priceCents: number;
    currency: string;
    decidedAt: string | null;
  } | null;
};
export type TeachCourse = {
  id: string;
  title: string;
  subject: string;
  description: string;
  language: string;
  parts: Part[];
  lessons: TeachLesson[];
  openNotes: number;
  published: Published | null;
};
export type Check = { ok: boolean; text: string };
export type Workspace = TeachCourse & {
  check: { ready: boolean; checks: Check[]; warnings: Check[] };
  notes: Array<Note & { lessonId: string; currentText: string | null; createdAt: string }>;
  progress: Array<{ lessonId: string; started: number; completed: number }>;
};

export const shareLink = (courseId: string) => `${location.origin}/?course=${courseId}`;
export const previewHref = (course: { lessons: TeachLesson[] }) =>
  course.lessons[0] ? `/?draft=${course.lessons[0].id}` : null;

/** One line on where a course stands, for its card and its page. Call it while rendering. */
export function statusOf(course: TeachCourse): {
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  text: string;
} {
  const p = course.published;
  if (!p) return { tone: 'neutral', text: t('teach.status.draft') };
  if (p.withdrawn) return { tone: 'danger', text: t('teach.status.withdrawn') };
  if (p.review?.status === 'pending')
    return {
      tone: 'warning',
      text: t('teach.price.status.pending', { version: p.review.version }),
    };
  if (p.review?.status === 'changes' && p.review.version === p.version)
    return { tone: 'danger', text: t('teach.price.status.changes', { version: p.review.version }) };
  if (p.stale) return { tone: 'warning', text: t('teach.status.stale') };
  return { tone: 'success', text: t('teach.status.live', { version: p.version }) };
}
