import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ComponentType } from 'react';
import type {
  LessonLayout,
  LessonQuestion,
  LessonRecording,
  PackageScene,
  VisualSpec,
} from './types';
import { QuestionBoard } from './QuestionBoard';
import { SyncedAudio } from './SyncedAudio';
import { SceneBoundary } from './SceneBoundary';

export type VisualProps = {
  spec: VisualSpec;
  recording: LessonRecording;
  frame: number;
  layout: LessonLayout;
  reducedMotion: boolean;
  fps: number;
  phase?: 'teaching' | 'question-reading' | 'feedback';
  question?: Pick<
    LessonQuestion,
    'english' | 'title' | 'options' | 'englishOptions' | 'readingParts'
  >;
  answer?: { english: string; arabic: string; parts?: LessonQuestion['feedbackParts'] };
};
export type RendererRegistry = Readonly<Record<string, ComponentType<VisualProps>>>;
export type CompositionProps = {
  scene: PackageScene;
  recording: LessonRecording;
  registry: RendererRegistry;
  layout: LessonLayout;
  reducedMotion: boolean;
  fps: number;
  feedback: boolean;
  recovery: number;
  playbackEpoch: number;
  onAudioError: (error: Error) => void;
};

export function LessonVisual({ registry, ...props }: VisualProps & { registry: RendererRegistry }) {
  const Renderer = registry[props.spec.renderer];
  if (!Renderer) throw new Error(`Unsupported lesson renderer: ${props.spec.renderer}`);
  return <Renderer {...props} />;
}

export function LessonComposition(props: CompositionProps) {
  const frame = useCurrentFrame();
  const { scene, recording, feedback, layout, registry, reducedMotion, fps } = props;
  const reading =
    scene.question &&
    recording.questionAtMs != null &&
    (frame * 1000) / fps >= recording.questionAtMs;
  const custom = feedback
    ? scene.question?.feedbackVisual
    : reading
      ? scene.question?.readingVisual
      : undefined;
  const prompt = scene.question
    ? {
        english: scene.question.english,
        title: scene.question.title,
        options: scene.question.options,
        englishOptions: scene.question.englishOptions,
        readingParts: scene.question.readingParts,
      }
    : undefined;
  return (
    <AbsoluteFill>
      <SceneBoundary
        key={`${scene.id}:${props.playbackEpoch}:${feedback}`}
        onError={props.onAudioError}
      >
        {custom ? (
          <LessonVisual
            spec={custom}
            recording={recording}
            frame={frame}
            fps={fps}
            layout={layout}
            reducedMotion={reducedMotion}
            registry={registry}
            phase={feedback ? 'feedback' : 'question-reading'}
            question={prompt}
            answer={
              feedback && scene.question
                ? {
                    english: scene.question.englishAnswer,
                    arabic: scene.question.explanation,
                    parts: scene.question.feedbackParts,
                  }
                : undefined
            }
          />
        ) : scene.question && (reading || feedback) ? (
          <QuestionBoard
            question={scene.question}
            recording={recording}
            frame={frame}
            fps={fps}
            layout={layout}
            feedback={feedback}
          />
        ) : (
          <LessonVisual
            spec={scene.visual}
            recording={recording}
            frame={frame}
            layout={layout}
            reducedMotion={reducedMotion}
            fps={fps}
            registry={registry}
            phase="teaching"
          />
        )}
      </SceneBoundary>
      <SyncedAudio
        key={recording.id}
        src={recording.file}
        recovery={props.recovery}
        onError={props.onAudioError}
      />
    </AbsoluteFill>
  );
}
