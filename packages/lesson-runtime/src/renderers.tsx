import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { ComponentType } from 'react';
import type { LessonLayout, LessonRecording, PackageScene, VisualSpec } from './types';
import { QuestionBoard } from './QuestionBoard';
import { SyncedAudio } from './SyncedAudio';

export type VisualProps = {
  spec: VisualSpec;
  recording: LessonRecording;
  frame: number;
  layout: LessonLayout;
  reducedMotion: boolean;
  fps: number;
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
  return (
    <AbsoluteFill>
      {scene.question && (reading || feedback) ? (
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
        />
      )}
      <SyncedAudio key={recording.id} src={recording.file} onError={props.onAudioError} />
    </AbsoluteFill>
  );
}
