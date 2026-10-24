/**
 * Audio-only courses ("listen mode"). Each scene holds teaching notes, not a script: the live
 * tutor explains them in its own words, then asks the spoken check and corrects the answer.
 * These files are server-owned; the student app only receives titles (no notes or answers).
 */
import course from './manhaj-almarifa/course.json';
import l01 from './manhaj-almarifa/lesson-01.json';
import l02 from './manhaj-almarifa/lesson-02.json';
import l03 from './manhaj-almarifa/lesson-03.json';
import l04 from './manhaj-almarifa/lesson-04.json';
import l05 from './manhaj-almarifa/lesson-05.json';
import l06 from './manhaj-almarifa/lesson-06.json';
import l07 from './manhaj-almarifa/lesson-07.json';
import l08 from './manhaj-almarifa/lesson-08.json';
import l09 from './manhaj-almarifa/lesson-09.json';
import l10 from './manhaj-almarifa/lesson-10.json';

export type ListenCheck = { ask: string; answer: string };
export type ListenScene = { id: string; title: string; lines: string[]; check?: ListenCheck };
export type ListenLesson = { id: string; title: string; scenes: ListenScene[] };
export type ListenCourse = {
  id: string;
  title: string;
  englishTitle: string;
  language: string;
  description: string;
  wakeWord: string;
  lessons: ListenLesson[];
};

const lessons: Record<string, ListenLesson> = Object.fromEntries(
  [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10].map((lesson) => [lesson.id, lesson]),
);

export const listenCourses: Record<string, ListenCourse> = {
  [course.id]: { ...course, lessons: course.lessons.map((id) => lessons[id]) },
};

const text = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

/** Structural checks only: an audio course is not editorially approved by passing them. */
export function listenProblems(course: ListenCourse) {
  const problems: string[] = [];
  if (!text(course.title, 120) || !text(course.wakeWord, 40)) problems.push('course header');
  if (!course.lessons.length) problems.push('no lessons');
  const lessonIds = new Set<string>();
  course.lessons.forEach((lesson, l) => {
    if (!lesson || !text(lesson.id, 60) || lessonIds.has(lesson.id)) {
      problems.push(`lesson ${l + 1}: missing or duplicate id`);
      return;
    }
    lessonIds.add(lesson.id);
    if (!text(lesson.title, 120) || !lesson.scenes.length) problems.push(`${lesson.id}: header`);
    const sceneIds = new Set<string>();
    lesson.scenes.forEach((scene) => {
      const at = `${lesson.id}/${scene.id}`;
      if (!text(scene.id, 60) || sceneIds.has(scene.id)) problems.push(`${at}: id`);
      sceneIds.add(scene.id);
      if (!text(scene.title, 120)) problems.push(`${at}: title`);
      if (!scene.lines.length || !scene.lines.every((line) => text(line, 400)))
        problems.push(`${at}: notes`);
      if (scene.check && !(text(scene.check.ask, 300) && text(scene.check.answer, 600)))
        problems.push(`${at}: check`);
    });
  });
  return problems;
}

/** What the student app may see: titles and which scenes ask something, no notes/answers. */
export const listenOutline = (course: ListenCourse) => ({
  id: course.id,
  title: course.title,
  englishTitle: course.englishTitle,
  description: course.description,
  wakeWord: course.wakeWord,
  lessons: course.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    scenes: lesson.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      asks: Boolean(scene.check),
    })),
  })),
});
export type ListenOutline = ReturnType<typeof listenOutline>;
