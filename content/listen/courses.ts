/**
 * Audio-only courses ("listen mode"). Each scene is a reviewed SCRIPT: the live tutor reads
 * `lines` word for word, reads the check question word for word, judges the learner's answer
 * in a sentence or two against the private `answer`, then reads the scripted `feedback`.
 * Only interruption replies and that short verdict are the tutor's own words.
 * These files are server-owned; the student app receives titles plus one scene's script when
 * that scene starts, never the expected answers.
 */
import epistemology from './manhaj-almarifa/course.json';
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
import howAi from './how-ai-works/course.json';
import ai01 from './how-ai-works/lesson-01.json';

export type ListenCheck = {
  /** Read word for word, then the tutor waits silently for as long as it takes. */
  ask: string;
  /** Private: what a right answer must contain, for the tutor's verdict only. */
  answer: string;
  /** Read word for word after the verdict: the scripted explanation of the answer. */
  feedback?: string;
};
export type ListenScene = {
  id: string;
  title: string;
  /** The script, read word for word, one line per turn. */
  lines: string[];
  check?: ListenCheck;
  /** Misconceptions the tutor must never state in its own words (verdicts, replies). */
  avoid?: string[];
};
export type ListenLesson = { id: string; title: string; scenes: ListenScene[] };
export type ListenCourse = {
  id: string;
  title: string;
  englishTitle: string;
  language: string;
  description: string;
  wakeWord: string;
  /** Account emails that may see and study this course; absent means everyone. */
  visibleTo?: string[];
  lessons: ListenLesson[];
};

type CourseFile = Omit<ListenCourse, 'lessons'> & { lessons: string[] };
/** A course header plus its lesson files, in the order the header lists them. */
function course(header: CourseFile, files: ListenLesson[]): ListenCourse {
  const byId = new Map(files.map((lesson) => [lesson.id, lesson]));
  return { ...header, lessons: header.lessons.map((id) => byId.get(id)!) };
}

export const listenCourses: Record<string, ListenCourse> = Object.fromEntries(
  [
    course(epistemology, [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10]),
    course(howAi, [ai01]),
  ].map((c) => [c.id, c]),
);

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
      const check = scene.check;
      if (check && !(text(check.ask, 300) && text(check.answer, 600)))
        problems.push(`${at}: check`);
      if (check?.feedback !== undefined && !text(check.feedback, 700))
        problems.push(`${at}: feedback`);
      if (scene.avoid && !scene.avoid.every((item) => text(item, 300)))
        problems.push(`${at}: avoid`);
      // The wake word interrupts the tutor, so the script must never say it.
      const spoken = [...scene.lines, check?.ask ?? '', check?.feedback ?? ''].join(' ');
      if (spoken.includes(course.wakeWord.replace(/^يا\s*/, '')))
        problems.push(`${at}: says the wake word`);
    });
  });
  return problems;
}

/** Whether this signed-in account may see the course at all. */
export const canSee = (course: ListenCourse, email: string) =>
  !course.visibleTo ||
  course.visibleTo.some((allowed) => allowed.toLowerCase() === email.trim().toLowerCase());

/** One lesson's spoken script (no expected answers): for the tutor's get_lesson tool. */
export const lessonScript = (lesson: ListenLesson) => ({
  title: lesson.title,
  scenes: lesson.scenes.map((scene) => ({
    title: scene.title,
    lines: scene.lines,
    ...(scene.check ? { question: scene.check.ask } : {}),
  })),
});

/** The script one scene's session reads; the expected answer stays on the server. */
export const sceneScript = (scene: ListenScene) => ({
  lines: scene.lines,
  ...(scene.check ? { ask: scene.check.ask } : {}),
  ...(scene.check?.feedback ? { feedback: scene.check.feedback } : {}),
});
export type SceneScript = ReturnType<typeof sceneScript>;

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
