import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Flow } from '../visuals/flow';
import { Term } from '../visuals/labels';
export function S07({
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

  if (p === 'term' || p === 'definition')
    visual = <Term english="Fluidity" arabic={p === 'definition' ? 'قابلية الجريان' : 'الميوعة'} />;
  else if (p === 'solid') {
    visual = model('solid');
    caption = 'الصلب العادي يقاوم تغيير شكله';
  } else if (p === 'practice' || p === 'question') {
    heading = 'جرّب بنفسك';
    visual = prompt(
      'Which states of matter are fluids?',
      p === 'question' ? 'أي حالات المادة تُعد موائع؟' : undefined,
    );
  } else if (p !== 'opening') {
    visual = (
      <Flow frame={frame} liquid={has('water')} gas={has('air')} reducedMotion={reducedMotion} />
    );
    caption = p === 'fluids' ? 'Fluids · موائع' : p === 'both' ? 'المائع يشمل السائل والغاز' : '';
  }
  return { visual, caption, heading };
}
