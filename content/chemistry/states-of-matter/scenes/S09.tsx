import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Particles, Dots } from '../visuals/particles';
export function S09({
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

  if (['dots', 'particle', 'particles', 'model'].includes(p)) {
    visual = <Dots plural={has('particles')} />;
    caption =
      p === 'particle'
        ? 'Particle · جسيم'
        : p === 'particles'
          ? 'Particles · جسيمات'
          : p === 'model'
            ? 'نموذج للتوضيح، مش صورة حقيقية'
            : '';
  } else if (['solid', 'solid-close', 'solid-motion', 'crystal', 'not-all'].includes(p)) {
    visual = model('solid', has('solid-motion'), 'solid-motion');
    heading = 'Solid · صلب';
    caption =
      p === 'solid-close'
        ? 'الجسيمات قريبة'
        : p === 'solid-motion'
          ? 'تهتز حول مواضعها'
          : p === 'crystal'
            ? 'نموذج لصلب بلوري'
            : p === 'not-all'
              ? 'مش كل المواد الصلبة ترتيبها واحد'
              : '';
  } else if (['liquid', 'liquid-close', 'liquid-motion', 'liquid-shape'].includes(p)) {
    visual = model('liquid', has('liquid-motion'), 'liquid-motion');
    heading = 'Liquid · سائل';
    caption =
      p === 'liquid-close'
        ? 'الجسيمات قريبة'
        : p === 'liquid-motion'
          ? 'تتحرك وتتبدّل أماكنها'
          : p === 'liquid-shape'
            ? 'الحركة تساعده يغيّر شكله'
            : '';
  } else if (p !== 'opening') {
    visual = model('gas', has('gas-motion'), 'gas-motion');
    heading = 'Gas · غاز';
    caption =
      p === 'gas-space'
        ? 'مسافات كبيرة بين الجسيمات'
        : p === 'gas-motion'
          ? 'تتحرك في اتجاهات مختلفة'
          : p === 'random'
            ? 'Random motion · حركة عشوائية'
            : p === 'spread'
              ? 'ينتشر في الحيز المتاح'
              : '';
  }
  return { visual, caption, heading };
}
