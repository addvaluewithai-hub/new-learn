import type { ReadingPackage } from '@learn/lesson-runtime';

// The demo gallery (docs/visuals/demos.md): ten short courses, each in its own style.
export type Demo = {
  id: string;
  title: string;
  style: string;
  audience: string;
  /** The card's colours: background and ink, taken from the style. */
  colors: [string, string];
  load?: () => Promise<ReadingPackage>;
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
  },
  {
    id: 'suez',
    title: 'قناة السويس ليه مهمة؟',
    style: 'خريطة بحرية قديمة',
    audience: 'جغرافيا واقتصاد',
    colors: ['#e9dcc0', '#7a4b2a'],
  },
  {
    id: 'pyramid',
    title: 'الهرم اتبنى إزاي؟',
    style: 'خيال الظل',
    audience: 'تاريخ',
    colors: ['#f2a65a', '#2b1b10'],
  },
  {
    id: 'circuit',
    title: 'ليه اللمبة بتنور؟',
    style: 'رسم هندسي',
    audience: 'فيزيا ثانوي',
    colors: ['#123a6b', '#e8f1ff'],
  },
  {
    id: 'fractions',
    title: 'الكسور بالبيتزا',
    style: 'ألوان شمع',
    audience: 'الأطفال',
    colors: ['#fff8e6', '#e0533d'],
  },
  {
    id: 'grammar',
    title: 'الفاعل والمفعول',
    style: 'خط عربي وحبر',
    audience: 'لغة عربية',
    colors: ['#f6efe2', '#1e1a16'],
  },
  {
    id: 'robot',
    title: 'حرّك الروبوت',
    style: 'لعبة بكسل',
    audience: 'برمجة للأطفال',
    colors: ['#2a1f4a', '#7cf2ff'],
  },
];
