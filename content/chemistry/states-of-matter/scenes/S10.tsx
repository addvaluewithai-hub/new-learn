import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { ParticleQuestionDiagram } from '../visuals/particles';
import { Term } from '../visuals/labels';
export function S10({
  p,
  has,
  progress,
  portrait,
  frame,
  reducedMotion,
  model,
  prompt,
  heading: initialHeading,
}: SceneContext) {
  let visual: ReactNode = null;
  let caption: ReactNode = '';
  let heading = initialHeading;

  if (p === 'model' || p === 'intro') {
    visual =
      p === 'model' ? (
        <ParticleQuestionDiagram frame={frame} reducedMotion={reducedMotion} />
      ) : null;
  } else if (p === 'read') {
    visual = <ParticleQuestionDiagram frame={frame} reducedMotion={reducedMotion} />;
    caption = 'اقرأ السؤال على أجزاء';
  } else if (p === 'identify' || p === 'explain') {
    visual = (
      <Term
        english={p === 'identify' ? 'Identify' : 'Explain why'}
        arabic={p === 'identify' ? 'حدّد' : 'فسّر السبب'}
      />
    );
  } else if (p === 'order' || p === 'support') {
    visual = <ParticleQuestionDiagram frame={frame} reducedMotion={reducedMotion} />;
    caption = p === 'order' ? 'اسم الحالة، وبعدها السبب' : 'ابدأ بالمعنى اللي فهمته';
  } else if (p.startsWith('question-')) {
    heading = 'جرّب بنفسك';
    visual = prompt(
      p === 'question-identify'
        ? 'Identify the state of matter.'
        : p === 'question-compress'
          ? 'Why is it easy to compress?'
          : 'Must a liquid fill a larger container?',
      p === 'question-identify'
        ? 'حدّد حالة المادة'
        : p === 'question-compress'
          ? 'فسّر سهولة الضغط'
          : 'هل السائل لازم يملا وعاء أكبر كله؟',
    );
  }
  return { visual, caption, heading };
}
