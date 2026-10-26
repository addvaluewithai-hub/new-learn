import {
  validateLessonBoards,
  validateReadingPackage,
  type BoardCheck,
  type BoardManifest,
  type BoardValues,
  type ReadingPackage,
  type ReadingQuestion,
  type ReadingScene,
  type StepBoard,
  type VisualSpec,
} from '@learn/lesson-runtime/core';

// The lesson format a teacher's AI writes through the connector: plain scenes, steps and
// questions. The server turns it into a reading package and validates it with the runtime.

export type AuthorStep = { text: string; board?: StepBoard };
export type AuthorQuestion = {
  kind: 'choice' | 'written' | 'choice-and-written' | 'board';
  english?: string;
  arabic?: string;
  options?: string[];
  answer: { english?: string; arabic?: string };
  board?: { state?: BoardValues; check: BoardCheck };
  feedback: AuthorStep[];
};
export type AuthorScene = {
  id: string;
  title: string;
  board?: string;
  steps: AuthorStep[];
  question?: AuthorQuestion;
};
export type AuthorLesson = {
  title: string;
  englishTitle?: string;
  scenes: AuthorScene[];
  goals?: Array<{ text: string; sceneIds: string[] }>;
  glossary?: Array<{ term: string; meaning: string }>;
};
/** A teacher board the lesson can use: its key in the package and its manifest. */
export type BoardRef = { key: string; manifest: BoardManifest };
export type LessonContext = {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  order: number;
  revision: number;
};

export const TEXT_BOARD = 'text-board';
export const HTML_BOARD = 'html-board';
const LIMITS = { scenes: 40, steps: 20, text: 800, options: 6, bytes: 200_000 };
const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

export class LessonProblems extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join('\n'));
  }
}

const str = (v: unknown, max = LIMITS.text) =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Shape checks a model can act on; the runtime validator then checks the whole package. */
function shape(lesson: AuthorLesson): string[] {
  const out: string[] = [];
  if (!lesson || typeof lesson !== 'object') return ['lesson must be an object'];
  if (JSON.stringify(lesson).length > LIMITS.bytes)
    out.push(`lesson is over ${LIMITS.bytes} bytes`);
  if (!str(lesson.title, 120)) out.push('title: 1-120 characters');
  const scenes = Array.isArray(lesson.scenes) ? lesson.scenes : [];
  if (!scenes.length || scenes.length > LIMITS.scenes) out.push(`scenes: 1-${LIMITS.scenes}`);
  const ids = new Set<string>();
  scenes.forEach((s, i) => {
    const at = `scenes[${i}]`;
    if (typeof s?.id !== 'string' || !ID.test(s.id)) out.push(`${at}.id: lowercase a-z, 0-9, -`);
    else if (ids.has(s.id)) out.push(`${at}.id "${s.id}" repeats`);
    ids.add(s?.id);
    if (!str(s?.title, 120)) out.push(`${at}.title: 1-120 characters`);
    if (s?.board !== undefined && !str(s.board, 64)) out.push(`${at}.board: a board id`);
    const steps = Array.isArray(s?.steps) ? s.steps : [];
    if (!steps.length || steps.length > LIMITS.steps) out.push(`${at}.steps: 1-${LIMITS.steps}`);
    steps.forEach((st, j) => {
      if (!str(st?.text)) out.push(`${at}.steps[${j}].text: 1-${LIMITS.text} characters`);
    });
    const q = s?.question;
    if (!q) return;
    if (!['choice', 'written', 'choice-and-written', 'board'].includes(q.kind))
      out.push(`${at}.question.kind: choice, written, choice-and-written or board`);
    if (!str(q.english) && !str(q.arabic)) out.push(`${at}.question: english or arabic text`);
    if (!str(q.answer?.english) && !str(q.answer?.arabic))
      out.push(`${at}.question.answer: english or arabic model answer`);
    const options = q.options ?? [];
    if (
      !Array.isArray(options) ||
      options.length > LIMITS.options ||
      !options.every((o) => str(o, 200))
    )
      out.push(`${at}.question.options: up to ${LIMITS.options} short texts`);
    if (q.kind === 'board' && (!s.board || !q.board))
      out.push(`${at}.question: a board question needs scene.board and question.board`);
    if (!Array.isArray(q.feedback) || !q.feedback.length || !q.feedback.every((f) => str(f?.text)))
      out.push(`${at}.question.feedback: at least one step explaining the answer`);
  });
  return out;
}

const step = (sceneId: string, prefix: string, s: AuthorStep, i: number) => ({
  unitIds: [`${sceneId}-${prefix}${i + 1}`],
  text: s.text.trim(),
  written: true,
  ...(s.board ? { board: s.board } : {}),
});

/** The reading package for one saved revision, or every problem found. */
export function buildPackage(
  lesson: AuthorLesson,
  context: LessonContext,
  boards: Record<string, BoardRef>,
): ReadingPackage {
  const problems = shape(lesson);
  if (problems.length) throw new LessonProblems(problems);
  const missing = lesson.scenes.filter((s) => s.board && !boards[s.board]).map((s) => s.board);
  if (missing.length)
    throw new LessonProblems(
      [...new Set(missing)].map((b) => `board "${b}" is not uploaded yet (put_board)`),
    );
  const scenes = lesson.scenes.map((s): ReadingScene => {
    const visual: VisualSpec = s.board
      ? { renderer: HTML_BOARD, params: { board: boards[s.board].key } }
      : { renderer: TEXT_BOARD, params: { title: s.title } };
    const scene: ReadingScene = {
      id: s.id,
      title: s.title.trim(),
      clipId: `${s.id}-teach`,
      visual,
      steps: s.steps.map((st, i) => step(s.id, 'u', st, i)),
    };
    const q = s.question;
    if (!q) return scene;
    const question: ReadingQuestion = {
      id: `${s.id}-q`,
      english: (q.english ?? q.arabic ?? '').trim(),
      arabic: (q.arabic ?? q.english ?? '').trim(),
      attempt: q.kind,
      options: q.options ?? [],
      answer: {
        english: (q.answer.english ?? q.answer.arabic ?? '').trim(),
        arabic: (q.answer.arabic ?? q.answer.english ?? '').trim(),
      },
      ...(q.board ? { board: q.board } : {}),
      feedback: {
        clipId: `${s.id}-answer`,
        steps: q.feedback.map((f, i) => step(s.id, 'f', f, i)),
        visual,
      },
    };
    return { ...scene, question };
  });
  const pkg: ReadingPackage = {
    schemaVersion: 1,
    delivery: 'reading',
    lessonId: `draft:${context.lessonId}`,
    curriculumId: `draft-course:${context.courseId}`,
    contentRevision: `draft-${context.lessonId}-r${context.revision}`,
    title: lesson.title.trim(),
    englishTitle: (lesson.englishTitle ?? lesson.title).trim(),
    curriculumTitle: context.courseTitle,
    lessonOrder: context.order,
    fps: 30,
    dimensions: { landscape: { width: 1280, height: 720 }, portrait: { width: 720, height: 1280 } },
    scenes,
    glossary: lesson.glossary ?? [],
    goals: (lesson.goals ?? []).map((g, i) => ({
      id: `goal-${i + 1}`,
      text: g.text,
      sceneIds: g.sceneIds,
      questionIds: scenes
        .filter((s) => g.sceneIds.includes(s.id) && s.question)
        .map((s) => s.question!.id),
    })),
  };
  try {
    validateReadingPackage(pkg, new Set([HTML_BOARD, TEXT_BOARD]));
    const manifests = Object.fromEntries(Object.values(boards).map((b) => [b.key, b.manifest]));
    validateLessonBoards(pkg, manifests);
  } catch (error) {
    throw new LessonProblems([(error as Error).message.replace(/^Invalid reading package: /, '')]);
  }
  return pkg;
}
