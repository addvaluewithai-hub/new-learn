import { AbsoluteFill } from 'remotion';
import {
  STATES_DIMENSIONS,
  type StateKind,
  type StatesScene,
  type StatesRecording,
  type StatesLayout,
} from './statesLesson';
import { boardAt } from './statesBoard';
import { Particles } from './visuals/particles';
import { Prompt } from './visuals/labels';
import { INK, C } from './visuals/palette';
import { S01 } from './scenes/S01';
import { S02 } from './scenes/S02';
import { S03 } from './scenes/S03';
import { S04 } from './scenes/S04';
import { S09 } from './scenes/S09';
import { S05 } from './scenes/S05';
import { S06 } from './scenes/S06';
import { S07 } from './scenes/S07';
import { S08 } from './scenes/S08';
import { S11 } from './scenes/S11';
import { S10 } from './scenes/S10';
const HEADINGS: Record<string, string> = {
  S01: 'بص حواليك…',
  S02: 'مكعب تلج في وعاء مختلف',
  S03: 'نفس كمية المية',
  S04: 'الهوا في وعاء أكبر',
  S09: 'نشوف المادة من جوّه',
  S05: 'إيه اللي بيتغيّر بالضغط؟',
  S06: 'كتلة قد إيه في نفس الحجم؟',
  S07: 'مين يقدر يجري؟',
  S08: 'الجسيمات بتختلط إزاي؟',
  S11: 'لما نسخّن الغاز…',
  S10: 'لاحظ، وبعدها فسّر',
};

const scenes = { S01, S02, S03, S04, S09, S05, S06, S07, S08, S11, S10 };
export type StatesCompositionProps = {
  scene: StatesScene;
  recording: StatesRecording;
  layout: StatesLayout;
  reducedMotion?: boolean;
};
export function StatesBoardFrame({
  scene,
  recording,
  layout,
  frame,
  reducedMotion = false,
}: StatesCompositionProps & { frame: number }) {
  const portrait = layout === 'portrait';
  const { width, height } = STATES_DIMENSIONS[layout];
  const b = boardAt(recording, frame);
  const p = b.phase;
  const has = b.has;
  const progress = (id: string, seconds = 1.4) =>
    reducedMotion ? (has(id) ? 1 : 0) : b.progress(id, seconds);
  const heading = HEADINGS[scene.id];
  const model = (kind: StateKind, moving = true, motionPhase?: string) => (
    <Particles
      kind={kind}
      frame={motionPhase ? b.frameSince(motionPhase) : frame}
      reducedMotion={reducedMotion || !moving}
    />
  );
  const prompt = (english: string, arabic?: string) => (
    <Prompt english={english} arabic={arabic} portrait={portrait} />
  );

  const draw = scenes[scene.id];
  const result = draw({ p, has, progress, portrait, frame, reducedMotion, model, prompt, heading });
  const { visual, caption, heading: currentHeading } = result;
  const fade = reducedMotion ? 1 : Math.min(1, b.age / 0.24);
  return (
    <AbsoluteFill
      data-states-composition={layout}
      data-scene={scene.id}
      data-board-phase={p}
      style={{
        background: '#fffefb',
        color: INK,
        fontFamily: '"Segoe UI",Tahoma,Arial,sans-serif',
        overflow: 'hidden',
      }}
    >
      <h1
        dir="rtl"
        data-safe-element="heading"
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          top: portrait ? 38 : 24,
          margin: 0,
          fontSize: portrait ? 42 : 40,
          lineHeight: 1.45,
          fontWeight: 650,
          textAlign: 'center',
        }}
      >
        {currentHeading}
      </h1>
      {visual ? (
        <div
          data-safe-element="diagram"
          data-board-part="visual"
          style={{
            position: 'absolute',
            left: portrait ? 36 : 50,
            top: portrait ? 198 : 127,
            width: portrait ? 468 : 860,
            height: portrait ? 428 : 320,
          }}
        >
          {visual}
        </div>
      ) : null}
      {caption ? (
        <div
          data-safe-element="explanation"
          data-board-part="caption"
          dir="rtl"
          style={{
            position: 'absolute',
            left: portrait ? 40 : 48,
            right: portrait ? 40 : 48,
            bottom: portrait ? 68 : 26,
            fontSize: portrait ? 36 : 32,
            lineHeight: 1.55,
            fontWeight: 550,
            textAlign: 'center',
            color: C.liquid,
            opacity: fade,
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
