// The looks a course can be built in (docs/visuals/demos.md): each has a demo course whose
// board shows it working, a picture for its card, and the topics it suits. The server keeps
// the art direction for each (server/builds/looks.ts); the ids must match.

export type Look = {
  id: string;
  name: string;
  /** One line: what it feels like and what it suits. */
  line: string;
  /** The demo course and its live board. */
  demo?: string;
  board?: string;
  /** Words in a topic that make this look a good suggestion. */
  words: RegExp;
};

export const LOOKS: Look[] = [
  {
    id: 'chalk',
    name: 'طباشير على سبورة',
    line: 'القلم بيرسم قدامك: للمعادلات والرسوم البيانية.',
    demo: 'interest',
    board: 'demo-interest-chalk',
    words: /رياض|معادل|دال[ةه]|جبر|هندس|فايد|فائد|نسب|احتمال|إحصا|math|equation|graph|interest/i,
  },
  {
    id: 'watercolour',
    name: 'رسم مائي باليد',
    line: 'دافي وهادي: للطبيعة والبيت والحياة اليومية.',
    demo: 'plants',
    board: 'demo-plants-painted',
    words: /نبات|زرا?ع|طبيع|أكل|طبخ|حيوان|بيت|صح[ةه]|مية|ماء|plant|nature|food|animal|health/i,
  },
  {
    id: 'crt',
    name: 'شاشة كمبيوتر قديمة',
    line: 'أخضر بيلمع: للتكنولوجيا والـAI والأرقام.',
    demo: 'ai',
    board: 'demo-ai-crt',
    words: /ذكاء|AI|كمبيوتر|تكنولوج|إنترنت|انترنت|بيانات|داتا|سايبر|tech|computer|data|internet/i,
  },
  {
    id: 'space3d',
    name: 'مجسّم 3D',
    line: 'حاجات بتتلف وتتشاف من كل ناحية: الفضاء والأجسام.',
    demo: 'seasons',
    board: 'demo-seasons-3d',
    words: /فضاء|شمس|قمر|كوكب|كواكب|أرض|فصول|ذر[ةه]|جزي|خلي[ةه]|جسم|3D|space|planet|atom|cell/i,
  },
  {
    id: 'seachart',
    name: 'خريطة قديمة',
    line: 'ورق قديم وحبر: للجغرافيا والرحلات والتجارة.',
    demo: 'suez',
    board: 'demo-suez-map',
    words: /خريط|جغراف|دول[ةه]|بحر|رحل[ةه]|تجار|قنا[ةه]|طريق|map|geograph|trade|travel|sea/i,
  },
  {
    id: 'shadow',
    name: 'خيال الظل',
    line: 'مشاهد بالورق والضل: للتاريخ والحكايات.',
    demo: 'pyramid',
    board: 'demo-pyramid-shadow',
    words: /تاريخ|فراعن|هرم|حضار|حكاي|قص[ةه]|أسطور|history|ancient|story|pharaoh/i,
  },
  {
    id: 'blueprint',
    name: 'رسم هندسي',
    line: 'خطوط بيضا على أزرق: للفيزيا والدواير والآلات.',
    demo: 'circuit',
    board: 'demo-circuit-blueprint',
    words: /فيزي|كهرب|دا[يئ]ر[ةه]|قو[ةه]|حرك[ةه]|آل[ةه]|محرك|ميكانيك|physics|circuit|force|engine/i,
  },
  {
    id: 'crayon',
    name: 'ألوان شمع',
    line: 'مرح وبسيط: للأطفال وأول المفاهيم.',
    demo: 'fractions',
    board: 'demo-fractions-crayon',
    words: /أطفال|اطفال|طفل|ابتدائ|حضان|كسور|عد|ألوان|kids|children|fraction/i,
  },
  {
    id: 'calligraphy',
    name: 'خط عربي وحبر',
    line: 'نسخ وحبر على ورق: للغة العربية والشعر والنحو.',
    demo: 'grammar',
    board: 'demo-grammar-ink',
    words: /نحو|إعراب|اعراب|شعر|عربي|بلاغ|إملا|املا|همز|قرآن|grammar|arabic|poetry/i,
  },
  {
    id: 'pixel',
    name: 'لعبة بكسل',
    line: 'خطوات وألغاز: للبرمجة والتفكير المنطقي.',
    demo: 'robot',
    board: 'demo-robot-pixel',
    words: /برمج|كود|خوارزم|روبوت|منطق|لعب[ةه]|programming|code|algorithm|robot|game/i,
  },
];

export const AUTO: Look = {
  id: 'auto',
  name: 'سيبها عليّ',
  line: 'نختار الشكل اللي يناسب موضوعك.',
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
export const EXAMPLES: Array<{ topic: string; look: string }> = [
  { topic: 'الفايدة المركبة لطلاب أولى تجارة', look: 'chalk' },
  { topic: 'إزاي النبات بيشرب المية ويعمل غذاه', look: 'watercolour' },
  { topic: 'الكواكب وبعدها عن الشمس للصف الرابع', look: 'space3d' },
  { topic: 'أول خطوات في البرمجة للأطفال', look: 'pixel' },
  { topic: 'الهمزة: إمتى على ألف وإمتى على السطر', look: 'calligraphy' },
  { topic: 'طريق الحرير: التجارة بين الصين وأوروبا', look: 'seachart' },
];

export const lookOf = (id: string) => [AUTO, ...LOOKS].find((look) => look.id === id) ?? AUTO;
