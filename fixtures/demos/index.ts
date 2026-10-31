import type { ReadingPackage } from '@learn/lesson-runtime';

// The demo gallery (docs/visuals/demos.md): short courses, each in its own style.
export type Demo = {
  id: string;
  title: string;
  style: string;
  audience: string;
  /** The card's colours: background and ink, taken from the style. */
  colors: [string, string];
  load?: () => Promise<ReadingPackage>;
  /** The course's own voice and character for Nova (docs/voice-agent.md). */
  voice?: { voice: string; pace: string; persona: string };
};

export const DEMOS: Demo[] = [
  {
    id: 'ai',
    title: 'إزاي الـAI بيكمّل جملتك؟',
    style: 'شاشة كمبيوتر قديمة',
    audience: 'الكل',
    colors: ['#0b1f12', '#8dffa6'],
    load: () => import('./courses/ai').then((m) => m.aiCourse),
  },
  {
    id: 'interest',
    title: 'فلوسك بتكبر إزاي؟',
    style: 'طباشير على سبورة',
    audience: 'الكبار',
    colors: ['#1f2b27', '#ffe066'],
    load: () => import('./courses/interest').then((m) => m.interestCourse),
  },
  {
    id: 'plants',
    title: 'نسقي ولا نستنى؟',
    style: 'رسم مائي باليد',
    audience: 'البيت والهوايات',
    colors: ['#f3ebdc', '#a85a42'],
    load: () => import('./courses/plants').then((m) => m.plantsCourse),
  },
  {
    id: 'seasons',
    title: 'ليه فيه صيف وشتا؟',
    style: '3D',
    audience: 'المدارس',
    colors: ['#0a1030', '#ffd36e'],
    load: () => import('./courses/seasons').then((m) => m.seasonsCourse),
  },
  {
    id: 'solar',
    title: 'رحلة في المجموعة الشمسية',
    style: '3D وصوت بشخصية',
    audience: 'المدارس',
    colors: ['#070b1f', '#ffb86b'],
    load: () => import('./courses/solar').then((m) => m.solarCourse),
    voice: {
      voice: 'Algenib',
      pace: 'slow',
      persona: 'عالم فلك صوته عميق ودافي، بيحب الوقفة قبل المفاجأة، وبيهزر هزار خفيف',
    },
  },
  {
    id: 'suez',
    title: 'قناة السويس ليه مهمة؟',
    style: 'خريطة بحرية قديمة',
    audience: 'جغرافيا واقتصاد',
    colors: ['#e9dcc0', '#7a4b2a'],
    load: () => import('./courses/suez').then((m) => m.suezCourse),
  },
  {
    id: 'pyramid',
    title: 'الهرم اتبنى إزاي؟',
    style: 'خيال الظل',
    audience: 'تاريخ',
    colors: ['#f2a65a', '#2b1b10'],
    load: () => import('./courses/pyramid').then((m) => m.pyramidCourse),
  },
  {
    id: 'circuit',
    title: 'ليه اللمبة بتنور؟',
    style: 'رسم هندسي',
    audience: 'فيزيا ثانوي',
    colors: ['#123a6b', '#e8f1ff'],
    load: () => import('./courses/circuit').then((m) => m.circuitCourse),
  },
  {
    id: 'fractions',
    title: 'الكسور بالبيتزا',
    style: 'ألوان شمع',
    audience: 'الأطفال',
    colors: ['#fff8e6', '#e0533d'],
    load: () => import('./courses/fractions').then((m) => m.fractionsCourse),
  },
  {
    id: 'grammar',
    title: 'الفاعل والمفعول',
    style: 'خط عربي وحبر',
    audience: 'لغة عربية',
    colors: ['#f6efe2', '#1e1a16'],
    load: () => import('./courses/grammar').then((m) => m.grammarCourse),
  },
  {
    id: 'robot',
    title: 'حرّك الروبوت',
    style: 'لعبة بكسل',
    audience: 'برمجة للأطفال',
    colors: ['#2a1f4a', '#7cf2ff'],
    load: () => import('./courses/robot').then((m) => m.robotCourse),
  },
];
