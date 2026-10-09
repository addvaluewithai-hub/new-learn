import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Photo } from '../visuals/photos';
import { Transfer } from '../visuals/transfer';
import { StateRecap } from '../visuals/labels';
export function S04({
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

  if (['compare', 'solid', 'liquid', 'gas-recap'].includes(p)) {
    heading = 'نراجع الشكل والحجم';
    visual =
      p === 'compare' ? (
        prompt('Shape · Volume', 'نراجع الفرق')
      ) : (
        <StateRecap phase={p === 'gas-recap' ? 'gas' : p} portrait={portrait} />
      );
  } else if (p === 'matter' || p === 'mass') {
    visual = <Photo kind="gas" />;
    caption = p === 'mass' ? 'له كتلة وبيشغل حيز' : 'الهوا مادة، حتى لو مش شايفينه';
  } else if (p !== 'opening') {
    visual = (
      <Transfer
        kind="gas"
        progress={progress('expand', 3)}
        showTarget={has('expand')}
        frame={frame}
        reducedMotion={reducedMotion}
      />
    );
    caption = p === 'properties' ? 'بياخد شكل الوعاء وحجمه' : p === 'gas' ? 'Gas · غاز' : '';
  }
  return { visual, caption, heading };
}
