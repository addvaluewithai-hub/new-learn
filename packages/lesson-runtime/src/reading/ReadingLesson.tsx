import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CSSProperties } from 'react';
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
import { ReadingBoard } from './ReadingBoard';
import { Caption, QuestionCaption } from './stage/Caption';
import { Complete } from './stage/Complete';
import { AnswerDock, Dock } from './stage/Dock';
import { ScenesList, Sheet, Transcript } from './stage/Sheets';
import { GoalsChip, SceneTrack, TopBar } from './stage/TopBar';
import type { ReadingPackage } from './types';
import { validateReadingPackage } from './validate';
import './stage/stage.css';
import './stage/stage-parts.css';
import './stage/stage-sheets.css';

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
  /** Leaving the lesson (top bar close) and the default end action. */
  exit?: { label: string; href: string };
  /** The lesson that follows, offered on the completion screen. */
  next?: { title: string; href: string } | null;
  /** Host tool in the middle of the controls, e.g. asking the assistant. */
  assistant?: ReactNode;
  /** Small host status in the top bar, e.g. "saved". */
  status?: ReactNode;
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
  const [sheet, setSheet] = useState<'scenes' | 'history' | null>(null);
  const portrait = useMediaQuery('(max-width: 650px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = props.layout ?? (portrait ? 'portrait' : 'landscape');
  const page = pages[index];
  const scene = lesson.scenes[page.scene];
  const question = scene.question;
  const answering = page.kind === 'attempt' && question && !(question.id in answers);
  const reachedIds = sceneIds.slice(0, reached + 1);
  const goals = goalProgress(lesson.goals, Object.keys(answers), reachedIds);

  const go = useCallback(
    (wanted: number) => {
      setSheet(null);
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
  const answer = (value: string) => {
    setAnswers((all) => ({ ...all, [question!.id]: value }));
    setFromMs(null);
    setIndex(index + 1);
  };

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
    if (props.suspended || sheet) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest('textarea, input, select')) return;
      if (event.key === 'ArrowLeft' && !answering && !complete) go(index + 1);
      if (event.key === 'ArrowRight') go(index - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go, index, answering, complete, props.suspended, sheet]);

  const inScene = pages.filter((p) => p.scene === page.scene);
  const fill = (inScene.indexOf(page) + 1) / inScene.length;
  const steps = pageSteps(scene, page);
  const board = readingBoardProps(scene, page, layout, lesson.fps, reducedMotion);
  const Board = board ? registry[board.spec.renderer] : undefined;
  const size = lesson.dimensions[layout];
  const shape = { '--rl-ar': `${size.width / size.height}` } as CSSProperties;
  return (
    <section
      className="rl"
      dir="rtl"
      data-layout={layout}
      data-page={complete ? 'complete' : page.kind}
    >
      <TopBar
        start={
          props.exit ? (
            <a
              className="rl-round rl-round-sm"
              href={props.exit.href}
              aria-label={props.exit.label}
            >
              ×
            </a>
          ) : null
        }
        title={lesson.title}
        sceneTitle={complete ? 'خلّصت الدرس' : scene.title}
        track={
          <SceneTrack
            lesson={lesson}
            scene={page.scene}
            reached={reached}
            fill={complete ? 1 : fill}
            onOpen={() => setSheet('scenes')}
          />
        }
        goals={<GoalsChip goals={lesson.goals ?? []} met={goals.met} />}
        end={props.status}
      />
      {complete ? (
        <div className="rl-stage rl-stage-end">
          <Complete
            title={lesson.title}
            goals={lesson.goals ?? []}
            met={goals.met}
            answered={Object.keys(answers).length}
            questions={lesson.scenes.filter((s) => s.question).length}
            next={props.next}
            exit={props.exit}
            onReview={() => go(0)}
          />
        </div>
      ) : (
        <>
          <div className="rl-stage" style={shape}>
            <div className="rl-board-frame" key={`${scene.id}:${page.kind === 'feedback'}`}>
              {Board && board ? (
                <ReadingBoard
                  Board={Board}
                  props={board}
                  fromMs={fromMs}
                  toMs={boardTimeMs(page)}
                  size={size}
                />
              ) : null}
            </div>
          </div>
          <div className="rl-caption-zone">
            {answering ? (
              <QuestionCaption question={question!} onChoose={answer} onSkip={() => answer('')} />
            ) : (
              <Caption
                label={
                  page.kind === 'feedback'
                    ? 'الإجابة النموذجية'
                    : page.kind === 'attempt'
                      ? 'سؤال'
                      : undefined
                }
                text={page.kind === 'attempt' ? question!.english : steps[page.step].text}
                answer={
                  page.kind === 'feedback' && page.step === 0 && question
                    ? answers[question.id]
                    : undefined
                }
                step={page.kind === 'attempt' ? 0 : page.step}
                steps={page.kind === 'attempt' ? 1 : steps.length}
                onHistory={page.step > 0 ? () => setSheet('history') : undefined}
              />
            )}
          </div>
          {answering ? (
            <AnswerDock
              canBack={index > 0}
              onBack={() => go(index - 1)}
              onSubmit={answer}
              written={question!.attempt !== 'choice'}
            />
          ) : (
            <Dock
              canBack={index > 0}
              onBack={() => go(index - 1)}
              onNext={() => go(index + 1)}
              nextLabel={index === pages.length - 1 ? 'خلّص الدرس' : 'التالي'}
              center={props.assistant}
            />
          )}
        </>
      )}
      {sheet === 'scenes' ? (
        <Sheet title="مشاهد الدرس" onClose={() => setSheet(null)}>
          <ScenesList
            lesson={lesson}
            current={page.scene}
            reached={reached}
            onOpen={(i) => go(pages.findIndex((p) => p.scene === i))}
          />
        </Sheet>
      ) : null}
      {sheet === 'history' ? (
        <Sheet title="اللي فات في المشهد ده" onClose={() => setSheet(null)}>
          <Transcript steps={steps.slice(0, page.step + 1)} />
        </Sheet>
      ) : null}
    </section>
  );
}
