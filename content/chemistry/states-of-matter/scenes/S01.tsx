import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
import type { SceneContext } from './context';
import { EDGE, INK } from '../visuals/palette';
import { Svg } from '../visuals/primitives';
import { Photo, Photos } from '../visuals/photos';
import { Compression } from '../visuals/transfer';
import { Dots } from '../visuals/particles';
import { Term } from '../visuals/labels';
export function S01({
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

  if (['solid', 'liquid', 'gas'].includes(p)) heading = '3 حالات للمادة';
  else if (p === 'properties') heading = 'هنقارن الشكل والحجم';
  else if (p === 'particles') heading = 'وبعدها نفهم السبب';
  else if (p === 'compress') heading = 'ليه الهوا أسهل في الضغط؟';
  else if (p === 'practice' || p === 'attempt') heading = 'هنجرّب خلال الشرح';
  if (['water', 'glass', 'air', 'matter', 'overview'].includes(p)) {
    visual =
      p === 'glass' ? (
        <Svg label="كوباية المية نفسها مادة">
          <path d="M158 42l22 214h180l22-214" stroke={EDGE} strokeWidth="5" fill="#f5faf7" />
          <path d="M180 256h180" stroke={INK} strokeWidth="4" />
        </Svg>
      ) : p === 'air' ? (
        <Photo kind="gas" />
      ) : p === 'matter' || p === 'overview' ? (
        <Photos kinds={['liquid', 'gas']} portrait={portrait} labels={false} />
      ) : (
        <Photo kind="liquid" />
      );
    caption =
      p === 'matter'
        ? 'كل دي مادة'
        : p === 'overview'
          ? 'هنقارن 3 حالات للمادة'
          : p === 'glass'
            ? 'الكوباية نفسها'
            : p === 'air'
              ? 'الهوا اللي حوالينا'
              : 'المية في الكوباية';
  } else if (['solid', 'liquid', 'gas'].includes(p)) {
    const kinds: StateKind[] =
      p === 'solid' ? ['solid'] : p === 'liquid' ? ['solid', 'liquid'] : ['solid', 'liquid', 'gas'];
    visual = <Photos kinds={kinds} portrait={portrait} active={p as StateKind} />;
  } else if (p === 'properties') {
    visual = <Term english="Shape · Volume" arabic="الشكل · الحجم" />;
    caption = 'هنقارن شكل كل حالة وحجمها';
  } else if (p === 'particles') {
    visual = <Dots plural />;
    caption = 'وبعدها نفهم السبب من الجسيمات';
  } else if (p === 'compress') {
    visual = <Compression progress={0} frame={frame} reducedMotion={reducedMotion} />;
  } else if (p === 'practice' || p === 'attempt') {
    visual = prompt(
      p === 'attempt' ? 'Try, then review' : 'Short questions in English',
      p === 'attempt' ? 'جرّب الأول، وبعدها نراجع' : 'أسئلة قصيرة خلال الشرح',
    );
  }
  return { visual, caption, heading };
}
