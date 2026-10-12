import React from 'react';
import type { VisualProps } from '@learn/lesson-runtime';
import { CaptionStrip, QuestionStage, Shell, Timeline, makeClock } from './stage';
import { FEEDBACK, QUESTIONS, SCENES } from './beats';

// One renderer for teaching, question reading and post-attempt feedback.
// Beats live in beats.ts; every reveal is bound to a semantic-unit cue.
export default function MathBoard(props: VisualProps) {
  const scene = String(props.spec.params.scene ?? '');
  const feedback = props.phase === 'feedback';
  const clock = makeClock(props, feedback ? props.recording.id : scene);
  const question = QUESTIONS[scene];
  if (question && !feedback)
    return (
      <Shell props={props} kicker={question.kicker}>
        <QuestionStage spec={question} clock={clock} props={props} />
      </Shell>
    );
  const spec = feedback ? FEEDBACK[scene] : SCENES[scene];
  if (!spec) throw new Error(`MathBoard: no beat plan for ${scene}${feedback ? ' feedback' : ''}`);
  return (
    <Shell props={props} kicker={spec.kicker}>
      <CaptionStrip captions={spec.captions} clock={clock} />
      <Timeline spec={spec} clock={clock} />
    </Shell>
  );
}
