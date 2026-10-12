import { pageSteps, readingPageIndex, type ReadingPosition } from './model';
import type { ReadingPackage, ReadingPage } from './types';

/** A message the host adds to the lesson conversation, pinned to the step it was asked on. */
export type ThreadNote = {
  id: string;
  role: 'learner' | 'tutor';
  text: string;
  at: ReadingPosition;
  /** The tutor is still answering (text may be partial or empty). */
  pending?: boolean;
  /** Spoken rather than typed. */
  voice?: boolean;
  failed?: boolean;
};
export type ThreadItem =
  | { kind: 'scene'; key: string; number: number; title: string }
  | { kind: 'line'; key: string; text: string; label?: string; current: boolean }
  | { kind: 'question'; key: string; english: string; arabic: string; current: boolean }
  | { kind: 'answer'; key: string; text: string }
  | { kind: 'note'; key: string; note: ThreadNote };

/**
 * The lesson so far as one conversation: every page up to the current one, the learner's
 * answers, and the host's notes after the step they belong to. Notes pinned to a later step
 * (the learner went back) stay visible at the end instead of disappearing.
 */
export function threadItems(
  lesson: ReadingPackage,
  pages: ReadingPage[],
  index: number,
  answers: Record<string, string>,
  notes: ThreadNote[] = [],
): ThreadItem[] {
  const pinned = new Map<number, ThreadNote[]>();
  for (const note of notes) {
    const found = readingPageIndex(lesson, pages, note.at);
    const at = found < 0 || found > index ? index : found;
    pinned.set(at, [...(pinned.get(at) ?? []), note]);
  }
  const items: ThreadItem[] = [];
  for (let p = 0; p <= index; p++) {
    const page = pages[p];
    const scene = lesson.scenes[page.scene];
    if (p === 0 || pages[p - 1].scene !== page.scene)
      items.push({ kind: 'scene', key: `s${p}`, number: page.scene + 1, title: scene.title });
    if (page.kind === 'attempt' && scene.question) {
      const q = scene.question;
      items.push({
        kind: 'question',
        key: `q${p}`,
        english: q.english,
        arabic: q.arabic,
        current: p === index,
      });
      if (q.id in answers) items.push({ kind: 'answer', key: `a${p}`, text: answers[q.id] });
    } else {
      items.push({
        kind: 'line',
        key: `l${p}`,
        text: pageSteps(scene, page)[page.step].text,
        label: page.kind === 'feedback' && page.step === 0 ? 'الإجابة النموذجية' : undefined,
        current: p === index,
      });
    }
    for (const note of pinned.get(p) ?? []) items.push({ kind: 'note', key: note.id, note });
  }
  return items;
}
