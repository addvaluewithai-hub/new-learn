import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Photo } from '../visuals/photos';
import { Transfer } from '../visuals/transfer';
export function S02({
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

  if (p !== 'opening')
    visual =
      p === 'ice' ? (
        <Photo kind="solid" />
      ) : (
        <Transfer
          kind="solid"
          progress={progress('answer')}
          showTarget={has('transfer')}
          showArrow={has('answer')}
          frame={frame}
          reducedMotion={reducedMotion}
        />
      );
  if (p === 'question') caption = 'هل هياخد شكل الكوباية؟';
  else if (p === 'answer') caption = 'هيفضل مكعب تلج';
  else if (p === 'solid') caption = 'Solid · صلب';
  else if (p === 'shape') caption = 'شكل محدد';
  else if (p === 'volume' || p === 'recap') caption = 'شكل محدد · حجم محدد';
  else if (p === 'shape-term') caption = 'Shape = الشكل';
  else if (p === 'volume-term') caption = 'Volume = الحيز اللي المادة بتشغله';
  return { visual, caption, heading };
}
