import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useMediaQuery } from '../useMediaQuery';
import { attempted, goalProgress } from './goals';
import { useHostBridge, useReport } from './host';
import {
  boardTimeMs,
  readingBoardProps,
  readingContext,
  readingPageIndex,
  readingPages,
  readingPositionOf,
  type ReadingPosition,
} from './model';
import { useReadingNav } from './useReadingNav';
import { validateLessonBoards } from './board';
import { ReadingBoard } from './ReadingBoard';
import { useReadingBoard } from './useBoard';
import { useReadingKeys } from './stage/keys';
import { PageCaption } from './stage/Caption';
import { Complete } from './stage/Complete';
import { AnswerDock, Dock } from './stage/Dock';
import { ScenesList, Sheet } from './stage/Sheets';
import { Thread } from './stage/Thread';
import { readingMs, usePageVisible } from './stage/flow';
import { useCaptionShown } from './stage/captionPref';
import { ExitLink, GoalsChip, SceneTrack, TopBar } from './stage/TopBar';
import { threadItems } from './thread';
import type { ReadingLessonProps, ReadingProgress } from './props';
import { validateReadingPackage } from './validate';
import './stage/stage.css';
import './stage/stage-parts.css';
import './stage/stage-sheets.css';
import './stage/thread.css';
import './stage/flow.css';

// A content change remounts the session, like recorded lessons.
export function ReadingLesson(props: ReadingLessonProps) {
  const lesson = useMemo(
    () =>
      validateLessonBoards(
        validateReadingPackage(props.lesson, new Set(Object.keys(props.registry))),
        props.boards,
      ),
    [props.lesson, props.registry, props.boards],
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
  const nav = useReadingNav(lesson, pages, initial, props.questions ?? 'ask');
  const { index, page, reached, answers, complete, done, fromMs, answering } = nav;
  const [sheet, setSheet] = useState<'scenes' | null>(null);
  const talk = props.conversation;
  const [ownOpen, setOwnOpen] = useState(false);
  const threadOpen = talk ? talk.open : ownOpen;
  const setThread = talk ? talk.onOpenChange : setOwnOpen;
  const portrait = useMediaQuery('(max-width: 650px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = props.layout ?? (portrait ? 'portrait' : 'landscape');
  const scene = lesson.scenes[page.scene];
  const question = scene.question;
  const reachedIds = sceneIds.slice(0, reached + 1);
  const real = attempted(answers);
  const goals = goalProgress(lesson.goals, real, reachedIds);
  const go = (wanted: number) => {
    setSheet(null);
    nav.go(wanted);
  };
  const answer = nav.answer;

  const live = useReadingBoard(lesson, pages, index, answers, props.boards);
  const context = { ...readingContext(lesson, page, complete), board: live.context };
  // Host-driven navigation (e.g. narration): never past an unanswered question.
  useHostBridge(
    context,
    {
      next: () => void (!answering && !complete && go(index + 1)),
      goTo: (at) => {
        const target = readingPageIndex(lesson, pages, at as ReadingPosition);
        if (target >= 0 && (target <= index || !answering)) go(target);
      },
      answer: (value) =>
        void (answering && question?.attempt !== 'board' && value.trim() && answer(value.trim())),
      skip: () => !complete && nav.skip(),
      reveal: () => !complete && nav.reveal(),
      back: () => go(index - 1),
    },
    `${index}:${complete}:${live.observed}`,
    onReady,
    onContext,
  );
  useReport<ReadingProgress>(
    {
      position: readingPositionOf(lesson, page, complete),
      reachedSceneIds: reachedIds,
      answers,
      complete: done,
    },
    [index, reached, answers, complete, done],
    onProgress,
  );
  useReadingKeys(!props.suspended && !sheet, {
    threadOpen,
    closeThread: () => setThread(false),
    forward: answering || complete ? null : () => go(index + 1),
    back: () => go(index - 1),
  });

  const caption = useCaptionShown();
  // Hiding the text never hides a question: the learner needs it to answer.
  const textHidden = !caption.shown && !answering && page.kind !== 'attempt';
  const inScene = pages.filter((p) => p.scene === page.scene);
  const fill = (inScene.indexOf(page) + 1) / inScene.length;
  // The page turns alone only while nothing else needs the learner's attention.
  const flow = props.flow;
  const visible = usePageVisible();
  const held = !visible || Boolean(props.suspended || sheet) || (threadOpen && !flow?.narrating);
  const items = threadOpen ? threadItems(lesson, pages, index, answers, talk?.notes) : [];
  const shown = readingBoardProps(scene, page, layout, lesson.fps, reducedMotion);
  const board = shown && { ...shown, board: live.link ?? undefined };
  const Board = board ? registry[board.spec.renderer] : undefined;
  const size = lesson.dimensions[layout];
  const shape = { '--rl-ar': `${size.width / size.height}` } as CSSProperties;
  return (
    <section
      className="rl"
      dir="rtl"
      data-layout={layout}
      data-page={complete ? 'complete' : page.kind}
      data-thread={(threadOpen && !complete) || undefined}
      data-answering={answering || undefined}
    >
      <TopBar
        start={<ExitLink exit={props.exit} />}
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
        end={
          <>
            {props.status}
            {props.tools}
          </>
        }
      />
      {complete ? (
        <div className="rl-stage rl-stage-end">
          <Complete
            title={lesson.title}
            goals={lesson.goals ?? []}
            met={goals.met}
            answered={real.length}
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
          <div className="rl-caption-zone" hidden={textHidden}>
            <PageCaption
              scene={scene}
              page={page}
              answers={answers}
              answering={Boolean(answering)}
              onAnswer={answer}
              onSkip={nav.skip}
              onReveal={nav.reveal}
              onThread={() => setThread(true)}
              onHint={talk ? () => talk.onAsk('محتاج تلميح للسؤال ده') : undefined}
            />
          </div>
          {threadOpen ? (
            <Thread
              items={items}
              tutor={talk?.tutor ?? ''}
              busy={talk?.busy}
              onAsk={talk?.onAsk}
              onClose={() => setThread(false)}
              footer={portrait ? talk?.composer : undefined}
            />
          ) : null}
          {answering ? (
            <AnswerDock
              canBack={index > 0}
              onBack={() => go(index - 1)}
              onSubmit={answer}
              written={question!.attempt !== 'choice'}
              board={question!.board ? () => answer(live.answer()) : undefined}
            />
          ) : (
            <Dock
              canBack={index > 0}
              onBack={() => go(index - 1)}
              onNext={() => go(index + 1)}
              nextLabel={index === pages.length - 1 ? 'خلّص الدرس' : 'التالي'}
              center={talk ? (portrait ? talk.orb : talk.composer) : null}
              text={{ shown: caption.shown, onToggle: caption.toggle }}
              flow={
                flow && (flow.pace || flow.narrating)
                  ? {
                      ms: flow.narrating ? undefined : readingMs(context.line ?? '', flow.pace!),
                      page: `${index}`,
                      running: !flow.paused && !held,
                      paused: flow.paused,
                      speaking: flow.speaking,
                      onToggle: () => flow.onPausedChange(!flow.paused),
                    }
                  : undefined
              }
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
    </section>
  );
}
