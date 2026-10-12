import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LessonContext, LessonController } from '../context';
import type { RendererRegistry } from '../renderers';
import type { LessonLayout } from '../types';
import { useMediaQuery } from '../useMediaQuery';
import { boardTimeMs, pageSteps, readingBoardProps, readingContext, readingPages } from './model';
import { ReadingAttempt } from './ReadingAttempt';
import { ReadingBoard } from './ReadingBoard';
import { ReadText, textDirection } from './ReadText';
import type { ReadingPackage } from './types';
import { validateReadingPackage } from './validate';
import './reading.css';

export type ReadingPosition = { page: number; total: number; complete: boolean };
export type ReadingLessonProps = {
  lesson: ReadingPackage;
  registry: RendererRegistry;
  layout?: LessonLayout;
  initialPage?: number;
  /** Host overlay (e.g. the assistant) is open: keyboard navigation pauses. */
  suspended?: boolean;
  onContext?: (context: LessonContext) => void;
  onReady?: (controller: LessonController | null) => void;
  onPosition?: (position: ReadingPosition) => void;
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
  const { lesson, registry, onContext, onReady, onPosition } = props;
  const pages = useMemo(() => readingPages(lesson), [lesson]);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(props.initialPage ?? 0, 0), pages.length - 1),
  );
  const [reached, setReached] = useState(index);
  const [complete, setComplete] = useState(false);
  const [fromMs, setFromMs] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const portrait = useMediaQuery('(max-width: 650px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = props.layout ?? (portrait ? 'portrait' : 'landscape');
  const page = pages[index];
  const scene = lesson.scenes[page.scene];
  const question = scene.question;
  const locked = page.kind === 'attempt' && question && !(question.id in answers);

  const go = useCallback(
    (wanted: number) => {
      if (wanted >= pages.length) return setComplete(true);
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
      setReached((value) => Math.max(value, next));
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
  useEffect(() => {
    onContext?.(live.current);
    onPosition?.({ page: index, total: pages.length, complete });
  }, [index, complete, pages.length, onContext, onPosition]);
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

  if (complete)
    return (
      <section className="reading-lesson reading-complete" dir="rtl">
        <h2>خلّصت الدرس</h2>
        <p>
          {lesson.title} · {lesson.scenes.length} مشاهد · جاوبت {Object.keys(answers).length} من{' '}
          {lesson.scenes.filter((s) => s.question).length} أسئلة
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
  const firstOf = (sceneIndex: number) => pages.findIndex((p) => p.scene === sceneIndex);
  const reachedScene = pages[reached].scene;
  const isLast = index === pages.length - 1;
  return (
    <section className="reading-lesson" dir="rtl" data-layout={layout} data-page={page.kind}>
      <header className="reading-top">
        <nav className="reading-scenes" aria-label="مشاهد الدرس">
          {lesson.scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              title={s.title}
              aria-label={`المشهد ${i + 1}: ${s.title}`}
              aria-current={i === page.scene ? 'step' : undefined}
              data-done={i < reachedScene || undefined}
              disabled={i > reachedScene}
              onClick={() => go(firstOf(i))}
            />
          ))}
        </nav>
        <div className="reading-where">
          <span>
            المشهد {page.scene + 1} من {lesson.scenes.length}
          </span>
          <h2>{scene.title}</h2>
        </div>
      </header>
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
            setReached((value) => Math.max(value, index + 1));
          }}
        />
      ) : (
        <div className="reading-card">
          {page.kind === 'feedback' ? <span className="reading-tag">الإجابة النموذجية</span> : null}
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
      <div className="reading-nav">
        <button
          type="button"
          className="reading-quiet"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          السابق
        </button>
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
