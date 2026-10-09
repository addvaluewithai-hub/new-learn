import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Flow, Diffusion } from '../visuals/flow';
import { Term } from '../visuals/labels';
export function S08({
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

  if (p === 'term') visual = <Term english="Diffusion" arabic="الانتشار" />;
  else if (p === 'compare') {
    visual = prompt('Diffusion rates', 'مقارنة عامة لسرعة الانتشار');
  } else if (['gas', 'liquid', 'slow'].includes(p)) {
    visual = model(p === 'gas' ? 'gas' : p === 'liquid' ? 'liquid' : 'solid');
    caption = p === 'gas' ? 'غاز: أسرع' : p === 'liquid' ? 'سائل: أبطأ' : 'صلب: بطيء جدًا';
  } else if (p === 'room' || p === 'air') {
    visual = <Flow frame={frame} liquid={false} gas reducedMotion={reducedMotion} />;
    caption = p === 'room' ? 'الريحة بتوصل إزاي؟' : 'حركة الهوا كمان بتنقل الروائح';
  } else if (p !== 'opening') {
    visual = (
      <Diffusion frame={frame} progress={progress('mix', 7)} reducedMotion={reducedMotion} />
    );
    caption =
      p === 'separate'
        ? 'مجموعتان في منطقتين مختلفتين'
        : p === 'mix'
          ? 'اختلاط تدريجي بالحركة العشوائية'
          : p === 'definition'
            ? 'حركة واختلاط'
            : p === 'net'
              ? 'انتقال صافٍ: من تركيز أعلى لأقل'
              : p === 'all'
                ? 'موجود في الغازات والسوائل'
                : p === 'solid'
                  ? 'وفي الصلب كمان، بسرعة مختلفة'
                  : p === 'compare'
                    ? 'مقارنة عامة لسرعة الانتشار'
                    : p === 'gas'
                      ? 'غاز: أسرع'
                      : p === 'liquid'
                        ? 'سائل: أبطأ'
                        : p === 'slow'
                          ? 'صلب: بطيء جدًا'
                          : p === 'room'
                            ? 'الريحة بتوصل إزاي؟'
                            : p === 'air'
                              ? 'حركة الهوا كمان بتنقل الروائح'
                              : '';
  }
  return { visual, caption, heading };
}
