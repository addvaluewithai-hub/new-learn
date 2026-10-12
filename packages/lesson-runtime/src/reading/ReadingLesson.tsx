import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LessonContext, LessonController } from '../context';
import type { RendererRegistry } from '../renderers';
import type { LessonLayout } from '../types';
import { useMediaQuery } from '../useMediaQuery';
import { goalProgress } from './goals';
import {
  boardTimeMs,
  pageSteps,
  readingBoardProps,
  readingContext,
  readingPageIndex,
  readingPages,
  readingPositionOf,
  type ReadingPosition,
} from './model';
import { ReadingAttempt } from './ReadingAttempt';
import { ReadingBoard } from './ReadingBoard';
import { GoalsChip, ScenePath } from './ReadingChrome';
import { ReadText, textDirection } from './ReadText';
import type { ReadingPackage } from './types';
import { validateReadingPackage } from './validate';
import './reading.css';
import './reading-chrome.css';

export type ReadingProgress = {
  position: ReadingPosition;
  reachedSceneIds: string[];
  answers: Record<string, string>;
  complete: boolean;
};
export type ReadingLessonProps = {
  lesson: ReadingPackage;
  registry: RendererRegistry;
  layout?: LessonLayout;
  /** Saved progress to resume from (positions that no longer exist start at the top). */
  initial?: Partial<ReadingProgress>;
  /** Host overlay (e.g. the assistant) is open: keyboard navigation pauses. */
  suspended?: boolean;
  onContext?: (context: LessonContext) => void;
  onReady?: (controller: LessonController | null) => void;
  onProgress?: (progress: ReadingProgress) => void;
  /** Host control shown between «السابق» and «التالي», e.g. asking the assistant. */
  dock?: ReactNode;
  finish?: { label: string; href: string };
};

// A content change remounts the session, like recorded lessons.
export function ReadingLesson(props: ReadingLessonProps) {
  const lesson = useMemo(
    () => validateReadingPackage(props.lesson, new Set(Object.keys(props.registry))),
    [props.lesson, props.registry],
  );
  return (
    <ReadingSession
      key={`${lesson.lessonId}:${lesson.contentRevision}`}
      {...props}
      lesson={lesson}
    />
  );
}

function ReadingSession(props: ReadingLessonProps) {
  const { lesson, registry, onContext, onReady, onProgress, initial } = props;
  const pages = useMemo(() => readingPages(lesson), [lesson]);
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
  const portrait = useMediaQuery('(max-width: 650px)');
  const narrow = useMediaQuery('(max-width: 900px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = props.layout ?? (portrait ? 'portrait' : 'landscape');
  const page = pages[index];
  const scene = lesson.scenes[page.scene];
  const question = scene.question;
  const locked = page.kind === 'attempt' && question && !(question.id in answers);
  const reachedIds = sceneIds.slice(0, reached + 1);
  const goals = goalProgress(lesson.goals, Object.keys(answers), reachedIds);

  const go = useCallback(
    (wanted: number) => {
      if (wanted >= pages.length) {
        setComplete(true);
        setDone(true);
        return;
      }
      if (wanted < 0) return;
      // Feedback opens only after an attempt; jumping there lands on the attempt.
      const target = pages[wanted];
      const q = lesson.scenes[target.scene].question;
      const next =
        target.kind === 'feedback' && q && !(q.id in answers)
          ? pages.findIndex((p) => p.scene === target.scene && p.kind === 'attempt')
          : wanted;
      const now = pages[index];
      const after = pages[next];
      const sameClip =
        after.scene === now.scene && (after.kind === 'feedback') === (now.kind === 'feedback');
      setFromMs(
        next === index + 1 && sameClip && after.kind !== 'attempt' ? boardTimeMs(now) : null,
      );
      setComplete(false);
      setIndex(next);
      setReached((value) => Math.max(value, after.scene));
    },
    [answers, index, lesson, pages],
  );

  const context = readingContext(lesson, page, complete);
  const live = useRef(context);
  live.current = context;
  useEffect(() => {
    onReady?.({ pause: () => undefined, getContext: () => live.current });
    return () => onReady?.(null);
  }, [onReady]);
  useEffect(() => onContext?.(live.current), [index, complete, onContext]);
  const progress = useRef<ReadingProgress | null>(null);
  progress.current = {
    position: readingPositionOf(lesson, page, complete),
    reachedSceneIds: reachedIds,
    answers,
    complete: done,
  };
  useEffect(() => {
    if (progress.current) onProgress?.(progress.current);
  }, [index, reached, answers, complete, done, onProgress]);
  useEffect(() => {
    if (props.suspended) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest('textarea, input, select, button')) return;
      if (event.key === 'ArrowLeft' && !locked) go(index + 1);
      if (event.key === 'ArrowRight') go(index - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, index, locked, props.suspended]);

  const firstOf = (sceneIndex: number) => pages.findIndex((p) => p.scene === sceneIndex);
  const top = (
    <div className="reading-top">
      <div className="reading-where">
        <span>
          المشهد {page.scene + 1} من {lesson.scenes.length}
        </span>
        <h2>{complete ? 'خلّصت الدرس' : scene.title}</h2>
      </div>
      <GoalsChip goals={lesson.goals ?? []} met={goals.met} />
    </div>
  );
  if (complete)
    return (
      <section className="reading-lesson reading-complete" dir="rtl">
        {top}
        <p>
          {lesson.title} · جاوبت {Object.keys(answers).length} من{' '}
          {lesson.scenes.filter((s) => s.question).length} أسئلة
          {goals.total ? ` · الأهداف ${goals.done} من ${goals.total}` : ''}
        </p>
        <div className="reading-nav">
          <button type="button" className="reading-quiet" onClick={() => go(0)}>
            راجع من الأول
          </button>
          {props.finish ? (
            <a className="reading-primary" href={props.finish.href}>
              {props.finish.label}
            </a>
          ) : null}
        </div>
      </section>
    );

  const steps = pageSteps(scene, page);
  const board = readingBoardProps(scene, page, layout, lesson.fps, reducedMotion);
  const Board = board ? registry[board.spec.renderer] : undefined;
  const text = page.kind === 'attempt' ? '' : steps[page.step].text;
  const isLast = index === pages.length - 1;
  return (
    <section className="reading-lesson" dir="rtl" data-layout={layout} data-page={page.kind}>
      {top}
      <div className="reading-stage">
        <div className="reading-main">
          {Board && board ? (
            <ReadingBoard
              Board={Board}
              props={board}
              fromMs={fromMs}
              toMs={boardTimeMs(page)}
              size={lesson.dimensions[layout]}
            />
          ) : null}
          {page.kind === 'attempt' && question ? (
            <ReadingAttempt
              key={question.id}
              question={question}
              onSubmit={(answer) => {
                setAnswers((value) => ({ ...value, [question.id]: answer }));
                setFromMs(null);
                setIndex(index + 1);
              }}
            />
          ) : (
            <div className="reading-card">
              {page.kind === 'feedback' ? (
                <span className="reading-tag">الإجابة النموذجية</span>
              ) : null}
              <p className="reading-text" dir={textDirection(text)} aria-live="polite">
                <ReadText text={text} />
              </p>
              {page.kind === 'feedback' && question && answers[question.id] ? (
                <p className="reading-yours">
                  إجابتك: <bdi dir="auto">{answers[question.id]}</bdi>
                </p>
              ) : null}
              <span className="reading-step">
                خطوة {page.step + 1} من {steps.length}
              </span>
            </div>
          )}
        </div>
        <ScenePath
          lesson={lesson}
          current={page.scene}
          reached={reached}
          compact={narrow || layout === 'portrait'}
          onOpen={(i) => go(firstOf(i))}
        />
      </div>
      <div className="reading-nav">
        <button
          type="button"
          className="reading-quiet"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          السابق
        </button>
        {props.dock ? <div className="reading-dock">{props.dock}</div> : null}
        {locked ? null : (
          <button type="button" className="reading-primary" onClick={() => go(index + 1)}>
            {isLast ? 'خلّص الدرس' : 'التالي'}
          </button>
        )}
      </div>
      {page.kind !== 'attempt' && page.step > 0 ? (
        <details className="reading-earlier">
          <summary>اللي فات في المشهد ده</summary>
          <ol>
            {steps.slice(0, page.step).map((step, i) => (
              <li key={i} dir={textDirection(step.text)}>
                <ReadText text={step.text} />
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
