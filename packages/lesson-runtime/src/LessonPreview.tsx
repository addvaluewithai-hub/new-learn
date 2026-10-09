import { useCallback, useMemo, useReducer, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Player, type PlayerRef } from '@remotion/player';
import type { LessonPackage, LessonLayout } from './types';
import { validateLessonPackage } from './validate';
import { framesForRecording } from './recording';
import { activeRecording, initialSession, reduceSession } from './session';
import { LessonComposition, type RendererRegistry } from './renderers';
import { useMediaQuery } from './useMediaQuery';
import { usePlaybackBridge } from './usePlaybackBridge';
import { PlaybackControls } from './PlaybackControls';
import { QuestionForm } from './QuestionForm';
import './preview.css';

export type LessonPreviewProps = {
  lesson: LessonPackage;
  registry: RendererRegistry;
  layout?: LessonLayout;
};

// A content change remounts the session. No account or storage callbacks here.
export function LessonPreview(props: LessonPreviewProps) {
  const lesson = useMemo(
    () => validateLessonPackage(props.lesson, new Set(Object.keys(props.registry))),
    [props.lesson, props.registry],
  );
  return (
    <PreviewSession
      key={`${lesson.lessonId}:${lesson.contentRevision}`}
      {...props}
      lesson={lesson}
    />
  );
}

function PreviewSession({ lesson, registry, layout: override }: LessonPreviewProps) {
  const reducer = useCallback(
    (state: ReturnType<typeof initialSession>, action: Parameters<typeof reduceSession>[2]) =>
      reduceSession(lesson, state, action),
    [lesson],
  );
  const [state, dispatch] = useReducer(reducer, undefined, initialSession);
  const player = useRef<PlayerRef>(null);
  const portrait = useMediaQuery('(max-width: 650px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const layout = override ?? (portrait ? 'portrait' : 'landscape');
  const scene = lesson.scenes[state.index];
  const recording = activeRecording(lesson, state);
  const dimensions = lesson.dimensions[layout];
  const duration = framesForRecording(recording, lesson.fps);
  const epoch = state.epoch;
  const liveEpoch = useRef(epoch);
  liveEpoch.current = epoch;
  const onAudioError = useCallback(
    (error: Error) => {
      if (liveEpoch.current !== epoch) return;
      player.current?.pause();
      dispatch({ type: 'error', epoch, message: error.message || 'تعذّر تشغيل الصوت. جرّب تاني.' });
    },
    [epoch],
  );
  const inputProps = useMemo(
    () => ({
      scene,
      recording,
      registry,
      layout,
      reducedMotion,
      fps: lesson.fps,
      feedback: state.mode === 'feedback',
      recovery: state.recovery,
      playbackEpoch: epoch,
      onAudioError,
    }),
    [
      scene,
      recording,
      registry,
      layout,
      reducedMotion,
      lesson.fps,
      state.mode,
      state.recovery,
      epoch,
      onAudioError,
    ],
  );
  usePlaybackBridge(player, state, duration, dispatch);

  const navigate = (index: number) => {
    player.current?.pause();
    dispatch({ type: 'navigate', index });
  };
  return (
    <section
      className="lesson-preview"
      data-mode={state.mode}
      data-scene={scene.id}
      data-layout={layout}
      dir="rtl"
    >
      <header className="lesson-header">
        <div>
          <span className="lesson-label">{lesson.curriculumTitle}</span>
          <h2>{scene.title}</h2>
        </div>
        <span className="lesson-count">
          {state.index + 1} / {lesson.scenes.length}
        </span>
      </header>
      <nav className="lesson-scenes" aria-label="مشاهد الدرس">
        {lesson.scenes.map((item, index) => (
          <button
            key={item.id}
            disabled={state.fatalError}
            onClick={() => navigate(index)}
            aria-current={index === state.index ? 'step' : undefined}
          >
            {index + 1}. {item.title}
          </button>
        ))}
      </nav>
      <div
        className="lesson-stage"
        dir="ltr"
        style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }}
      >
        <Player
          ref={player}
          component={LessonComposition}
          inputProps={inputProps}
          durationInFrames={duration}
          fps={lesson.fps}
          compositionWidth={dimensions.width}
          compositionHeight={dimensions.height}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          clickToPlay={false}
          spaceKeyToPlayOrPause={false}
          moveToBeginningWhenEnded={false}
          numberOfSharedAudioTags={2}
          errorFallback={() => (
            <div className="lesson-failure">تعذّر عرض المشهد. جرّب إعادة تشغيله.</div>
          )}
        />
      </div>
      {state.error && (
        <div className="lesson-error" role="alert">
          <p>تعذّر تشغيل المشهد؛ هنقف هنا لحد ما الصوت يشتغل.</p>
          <button
            onClickCapture={(event) => {
              if (state.fatalError) {
                window.location.reload();
                return;
              }
              // Reset inputs and reload failed media before starting playback.
              // Keep play in the user gesture without an intervening pause.
              flushSync(() => dispatch({ type: 'retry' }));
              player.current?.play(event);
            }}
          >
            {state.fatalError ? 'أعد تحميل المعاينة' : 'حاول تاني'}
          </button>
        </div>
      )}
      <PlaybackControls
        player={player}
        state={state}
        duration={duration}
        onReplay={() => navigate(state.index)}
      />
      {state.mode === 'attempt' && scene.question && (
        <QuestionForm
          question={scene.question}
          draft={state.draft}
          onChange={(draft) => dispatch({ type: 'draft', draft })}
          onSubmit={() => dispatch({ type: 'submit' })}
        />
      )}
      {state.mode === 'complete' && (
        <div className="lesson-review" role="status">
          <h2>{lesson.review.heading}</h2>
          <p>{lesson.review.summary}</p>
          <button className="lesson-primary" onClick={() => dispatch({ type: 'restart' })}>
            ابدأ من الأول
          </button>
        </div>
      )}
    </section>
  );
}
