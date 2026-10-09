import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { MassBoxes } from '../visuals/density';
import { Term } from '../visuals/labels';
export function S06({
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

  if (p === 'term') visual = <Term english="Density" arabic="الكثافة" />;
  else if (p !== 'opening') {
    visual = <MassBoxes fill={has('mass')} denser={has('denser')} />;
    caption =
      p === 'boxes'
        ? 'نفس الحجم'
        : p === 'mass'
          ? 'كتلة أكبر في الصندوق الأول'
          : p === 'denser'
            ? 'الصندوق الأول أكثف'
            : p === 'definition'
              ? 'الكثافة تربط الكتلة بالحجم'
              : p === 'gas'
                ? 'الغاز غالبًا أقل كثافة'
                : p === 'usually'
                  ? 'الصلب غالبًا أكثف من السائل'
                  : p === 'exceptions'
                    ? 'لكن فيه استثناءات'
                    : p === 'recap'
                      ? 'اسم الحالة وحده مش كفاية'
                      : '';
  }
  return { visual, caption, heading };
}
