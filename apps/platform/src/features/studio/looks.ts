import type { TextKey } from '../../i18n';
// The looks a course can be built in (docs/visuals/demos.md): each has a demo course whose
// board shows it working, a picture for its card, and the topics it suits. The server keeps
// the art direction for each (server/builds/looks.ts); the ids must match.

export type Look = {
  id: string;
  /** Keys in the language files (`looks.<id>`): call t() when rendering. */
  name: TextKey;
  /** One line: what it feels like and what it suits. */
  line: TextKey;
  /** The demo course and its live board. */
  demo?: string;
  board?: string;
  /** Words in a topic that make this look a good suggestion. */
  words: RegExp;
};

export const LOOKS: Look[] = [
  {
    id: 'chalk',
    name: 'looks.chalk.name',
    line: 'looks.chalk.line',
    demo: 'interest',
    board: 'demo-interest-chalk',
    words: /رياض|معادل|دال[ةه]|جبر|هندس|فايد|فائد|نسب|احتمال|إحصا|math|equation|graph|interest/i,
  },
  {
    id: 'watercolour',
    name: 'looks.watercolour.name',
    line: 'looks.watercolour.line',
    demo: 'plants',
    board: 'demo-plants-painted',
    words: /نبات|زرا?ع|طبيع|أكل|طبخ|حيوان|بيت|صح[ةه]|مية|ماء|plant|nature|food|animal|health/i,
  },
  {
    id: 'crt',
    name: 'looks.crt.name',
    line: 'looks.crt.line',
    demo: 'ai',
    board: 'demo-ai-crt',
    words: /ذكاء|AI|كمبيوتر|تكنولوج|إنترنت|انترنت|بيانات|داتا|سايبر|tech|computer|data|internet/i,
  },
  {
    id: 'space3d',
    name: 'looks.space3d.name',
    line: 'looks.space3d.line',
    demo: 'seasons',
    board: 'demo-seasons-3d',
    words: /فضاء|شمس|قمر|كوكب|كواكب|أرض|فصول|ذر[ةه]|جزي|خلي[ةه]|جسم|3D|space|planet|atom|cell/i,
  },
  {
    id: 'seachart',
    name: 'looks.seachart.name',
    line: 'looks.seachart.line',
    demo: 'suez',
    board: 'demo-suez-map',
    words: /خريط|جغراف|دول[ةه]|بحر|رحل[ةه]|تجار|قنا[ةه]|طريق|map|geograph|trade|travel|sea/i,
  },
  {
    id: 'shadow',
    name: 'looks.shadow.name',
    line: 'looks.shadow.line',
    demo: 'pyramid',
    board: 'demo-pyramid-shadow',
    words: /تاريخ|فراعن|هرم|حضار|حكاي|قص[ةه]|أسطور|history|ancient|story|pharaoh/i,
  },
  {
    id: 'blueprint',
    name: 'looks.blueprint.name',
    line: 'looks.blueprint.line',
    demo: 'circuit',
    board: 'demo-circuit-blueprint',
    words: /فيزي|كهرب|دا[يئ]ر[ةه]|قو[ةه]|حرك[ةه]|آل[ةه]|محرك|ميكانيك|physics|circuit|force|engine/i,
  },
  {
    id: 'crayon',
    name: 'looks.crayon.name',
    line: 'looks.crayon.line',
    demo: 'fractions',
    board: 'demo-fractions-crayon',
    words: /أطفال|اطفال|طفل|ابتدائ|حضان|كسور|عد|ألوان|kids|children|fraction/i,
  },
  {
    id: 'calligraphy',
    name: 'looks.calligraphy.name',
    line: 'looks.calligraphy.line',
    demo: 'grammar',
    board: 'demo-grammar-ink',
    words: /نحو|إعراب|اعراب|شعر|عربي|بلاغ|إملا|املا|همز|قرآن|grammar|arabic|poetry/i,
  },
  {
    id: 'pixel',
    name: 'looks.pixel.name',
    line: 'looks.pixel.line',
    demo: 'robot',
    board: 'demo-robot-pixel',
    words: /برمج|كود|خوارزم|روبوت|منطق|لعب[ةه]|programming|code|algorithm|robot|game/i,
  },
];

export const AUTO: Look = {
  id: 'auto',
  name: 'looks.auto.name',
  line: 'looks.auto.line',
  words: /$^/,
};

const FALLBACK = ['chalk', 'watercolour', 'space3d'];

/** Up to three looks that suit the topic, best first; a calm default when nothing matches.
 *  A course for a child starts from the playful looks; no topic yet suggests nothing. */
export function suggestLooks(topic: string, audience = 'me'): string[] {
  const kids = audience === 'kids' ? ['crayon', 'pixel'] : [];
  if (!topic) return kids;
  const hits = LOOKS.filter((look) => look.words.test(topic)).map((look) => look.id);
  return [...new Set([...kids, ...hits, ...FALLBACK])].slice(0, 3);
}

/** Ideas to start from, each with the look that shows it best. */
export const EXAMPLES: Array<{ topic: TextKey; look: string }> = [
  { topic: 'looks.examples.chalk', look: 'chalk' },
  { topic: 'looks.examples.watercolour', look: 'watercolour' },
  { topic: 'looks.examples.space3d', look: 'space3d' },
  { topic: 'looks.examples.pixel', look: 'pixel' },
  { topic: 'looks.examples.calligraphy', look: 'calligraphy' },
  { topic: 'looks.examples.seachart', look: 'seachart' },
];

export const lookOf = (id: string) => [AUTO, ...LOOKS].find((look) => look.id === id) ?? AUTO;
