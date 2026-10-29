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

/** One line on where a course stands, for its card and its page. */
export function statusOf(course: TeachCourse): {
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  text: string;
} {
  const p = course.published;
  if (!p) return { tone: 'neutral', text: 'مسودة' };
  if (p.withdrawn) return { tone: 'danger', text: 'مسحوب' };
  if (p.stale) return { tone: 'warning', text: `منشور، وفيه تعديلات بعد النشر` };
  return { tone: 'success', text: `منشور · نسخة ${p.version}` };
}
