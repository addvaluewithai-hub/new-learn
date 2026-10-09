import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Compression } from '../visuals/transfer';
import { Term } from '../visuals/labels';
export function S05({
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

  if (['liquid-solid', 'close', 'hard'].includes(p)) {
    visual = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', gap: 20 }}>
        {model('liquid')}
        {model('solid')}
      </div>
    );
    caption =
      p === 'liquid-solid'
        ? 'السائل والصلب'
        : p === 'close'
          ? 'الجسيمات أصلًا قريبة'
          : 'انضغاطهم أصعب تحت الضغط المعتاد';
  } else if (p === 'compressed' || p === 'decrease') {
    visual = (
      <Term
        english={p === 'compressed' ? 'Compressed' : 'Decrease'}
        arabic={p === 'compressed' ? 'اتضغط' : 'يقل'}
      />
    );
  } else if (p === 'question') {
    heading = 'جرّب بنفسك';
    visual = prompt('Smaller particles, or smaller spaces?', 'الجسيمات بتصغر، ولا المسافات بتقل؟');
  } else if (p !== 'opening') {
    visual = (
      <Compression progress={progress('compress', 3)} frame={frame} reducedMotion={reducedMotion} />
    );
    caption =
      p === 'space'
        ? 'المسافات بين الجسيمات قلّت'
        : p === 'size'
          ? 'الجسيمات نفسها ما صغرتش'
          : p === 'term'
            ? 'Compressibility · قابلية الانضغاط'
            : p === 'definition'
              ? 'تقليل الحجم بالضغط'
              : p === 'gas'
                ? 'بين جسيمات الغاز مسافات كبيرة'
                : '';
  }
  return { visual, caption, heading };
}
