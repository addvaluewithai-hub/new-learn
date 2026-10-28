import { useState } from 'react';
import { boardTimeMs, readingPageIndex } from './model';
import type { QuestionMode, ReadingProgress } from './props';
import type { ReadingPackage, ReadingPage } from './types';

/**
 * Where the learner is in a reading lesson and how they move: Next and back, answering, and
 * leaving a question unanswered (skip) or seeing its model answer without one (reveal).
 */
export function useReadingNav(
  lesson: ReadingPackage,
  pages: ReadingPage[],
  initial: Partial<ReadingProgress> | undefined,
  mode: QuestionMode,
) {
  const sceneIds = lesson.scenes.map((s) => s.id);
  const [index, setIndex] = useState(() =>
    !initial?.position || initial.complete
      ? 0
      : Math.max(0, readingPageIndex(lesson, pages, initial.position)),
  );
  const [reached, setReached] = useState(() => {
    if (initial?.complete) return sceneIds.length - 1;
    const saved = (initial?.reachedSceneIds ?? []).map((id) => sceneIds.indexOf(id));
    return Math.max(pages[index].scene, ...saved);
  });
  const [answers, setAnswers] = useState<Record<string, string>>(() => initial?.answers ?? {});
  const [complete, setComplete] = useState(false);
  const [done, setDone] = useState(Boolean(initial?.complete));
  const [fromMs, setFromMs] = useState<number | null>(null);
  const page = pages[index];
  const question = lesson.scenes[page.scene].question;
  const open = Boolean(question && !(question.id in answers));
  const asking = mode === 'ask';
  const answering = asking && page.kind === 'attempt' && open;
  /** On a question still open: its lead-in or its answer page. */
  const onQuestion = open && (page.kind === 'ask' || page.kind === 'attempt');

  const show = (next: number) => {
    const now = pages[index];
    const after = pages[next];
    const sameClip =
      after.scene === now.scene && (after.kind === 'feedback') === (now.kind === 'feedback');
    setFromMs(next === index + 1 && sameClip && after.kind !== 'attempt' ? boardTimeMs(now) : null);
    setComplete(false);
    setIndex(next);
    setReached((value) => Math.max(value, after.scene));
  };
  const go = (wanted: number) => {
    if (wanted >= pages.length) {
      setComplete(true);
      setDone(true);
      return;
    }
    if (wanted < 0) return;
    // When questions are asked, feedback opens only after an attempt.
    const target = pages[wanted];
    const q = lesson.scenes[target.scene].question;
    show(
      asking && target.kind === 'feedback' && q && !(q.id in answers)
        ? pages.findIndex((p) => p.scene === target.scene && p.kind === 'attempt')
        : wanted,
    );
  };
  const answer = (value: string) => {
    setAnswers((all) => ({ ...all, [question!.id]: value }));
    setFromMs(null);
    setIndex(index + 1);
  };
  /** Leave the question unanswered and go on to the next scene. False when not on one. */
  const skip = () => {
    if (!onQuestion) return false;
    const next = pages.findIndex((p) => p.scene > page.scene);
    go(next < 0 ? pages.length : next);
    return true;
  };
  /** Show the model answer; when asking, it is recorded as "I don't know". */
  const reveal = () => {
    if (!onQuestion) return false;
    const first = pages.findIndex((p) => p.scene === page.scene && p.kind === 'feedback');
    if (first < 0) return skip();
    if (asking) setAnswers((all) => ({ ...all, [question!.id]: '' }));
    show(first);
    return true;
  };
  return {
    index,
    page,
    reached,
    answers,
    complete,
    done,
    fromMs,
    answering,
    go,
    answer,
    skip,
    reveal,
  };
}
