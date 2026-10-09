import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Thermal, WarmMaterials } from '../visuals/thermal';
import { Term } from '../visuals/labels';
export function S11({
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

  if (p === 'term') visual = <Term english="Thermal expansion" arabic="التمدد الحراري" />;
  else if (p === 'materials' || p === 'material-expansion') {
    visual = <WarmMaterials progress={progress('material-expansion', 3)} />;
    caption = has('material-expansion') ? 'زيادة صغيرة في الظروف المعتادة' : '';
  } else if (p === 'question') {
    visual = prompt('Can the volume change?', 'هل الوعاء يسمح بالتمدد؟');
  } else if (p !== 'opening') {
    visual = (
      <Thermal
        progress={progress('expand', 2)}
        rigidProgress={progress('pressure-up', 2)}
        showRigid={has('rigid')}
        condition={has('pressure')}
        volume={has('volume')}
        pressure={has('pressure-up')}
        frame={frame}
        reducedMotion={reducedMotion}
      />
    );
    caption =
      p === 'piston'
        ? 'نفس كمية الغاز'
        : p === 'pressure'
          ? 'كمية ثابتة · ضغط ثابت'
          : p === 'recap'
            ? 'تأثير التسخين مرتبط بظروف الوعاء'
            : '';
  }
  return { visual, caption, heading };
}
