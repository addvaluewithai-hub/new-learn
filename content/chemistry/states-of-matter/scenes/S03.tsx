import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Transfer } from '../visuals/transfer';
export function S03({
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

  if (['practice', 'question-term', 'sample', 'question'].includes(p)) {
    heading = 'جرّب بنفسك';
    visual =
      p === 'sample' ? (
        <Transfer
          kind="liquid"
          progress={1}
          showTarget
          frame={frame}
          reducedMotion={reducedMotion}
        />
      ) : (
        prompt(
          p === 'practice'
            ? 'Shape or volume?'
            : p === 'question-term'
              ? 'Which property may change?'
              : 'Which may change: shape or volume?',
          p === 'question-term' ? 'أي خاصية ممكن تتغيّر؟' : undefined,
        )
      );
    caption = p === 'sample' ? '100 mL · بدون فقد أو تغيّر الحرارة' : '';
  } else if (p !== 'opening') {
    visual = (
      <Transfer
        kind="liquid"
        progress={has('partial') ? 1 : progress('transfer', 3)}
        showTarget={has('transfer')}
        frame={frame}
        reducedMotion={reducedMotion}
      />
    );
    caption =
      p === 'shape'
        ? 'الشكل اتغيّر'
        : p === 'conditions'
          ? 'بدون فقد مية أو تغيّر الحرارة'
          : p === 'volume'
            ? 'الحجم ثابت تقريبًا'
            : p === 'liquid'
              ? 'Liquid · سائل'
              : p === 'shape-term'
                ? 'بياخد شكل الجزء اللي موجود فيه'
                : p === 'volume-term'
                  ? 'Volume محدد تقريبًا'
                  : p === 'not-full'
                    ? 'مش لازم يملا الوعاء كله'
                    : p === 'partial'
                      ? 'شوية مية في وعاء كبير'
                      : '';
  }
  return { visual, caption, heading };
}
