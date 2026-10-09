import type { RendererRegistry, VisualProps } from '@learn/lesson-runtime';
import manifest from './data/manifest.json';
import { createStatesPackage } from './statesPackage';
import { StatesBoardFrame } from './StatesBoard';
import { SpokenBoardFrame } from './SpokenBoard';
import { ParticleQuestionDiagram } from './visuals/particles';
import type { StatesScene } from './statesLesson';

function Teaching(props: VisualProps) {
  return <StatesBoardFrame {...props} scene={props.spec.params.scene as StatesScene} />;
}
function Speech(props: VisualProps) {
  return (
    <SpokenBoardFrame
      {...props}
      feedback={props.phase === 'feedback'}
      fromMs={props.phase === 'feedback' ? 0 : (props.recording.questionAtMs ?? 0)}
    />
  );
}
function ParticleQuestion(props: VisualProps) {
  return <ParticleQuestionDiagram {...props} />;
}
export const statesRenderers: RendererRegistry = {
  'states-board-v1': Teaching,
  'particle-question-v1': ParticleQuestion,
  'states-speech-v1': Speech,
};
export const statesLesson = createStatesPackage(manifest);
