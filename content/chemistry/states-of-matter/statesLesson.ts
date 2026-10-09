import source from './states-source.json';
export const STATES_FPS = 30;
export const STATES_DIMENSIONS = {
  landscape: { width: 960, height: 540 },
  portrait: { width: 540, height: 960 },
} as const;
export type StatesLayout = keyof typeof STATES_DIMENSIONS;
export type StateKind = 'solid' | 'liquid' | 'gas';
export type { TimedWord } from '@learn/lesson-runtime/core';
export type StatesRecording = import('@learn/lesson-runtime/core').LessonRecording;
export type StatesManifest = {
  lessonId: string;
  revision: string;
  beats: StatesRecording[];
  feedback: StatesRecording[];
};
export const STATES_SCENES = [
  {
    id: 'S01',
    title: 'نفس المادة… سلوك مختلف',
    term: 'STATES OF MATTER',
    kind: 'intro',
    cue: 'تلج · مية · هوا',
    takeaway: 'نقارن الخصائص، وبعدها نفهم السبب.',
  },
  {
    id: 'S02',
    title: 'الصلب يحتفظ بشكله',
    term: 'SOLID',
    kind: 'solid',
    cue: 'شكل محدد · حجم محدد',
    takeaway: 'الجسيمات قريبة وتهتز حول مواضعها.',
  },
  {
    id: 'S03',
    title: 'نفس المية، شكل مختلف',
    term: 'LIQUID',
    kind: 'liquid',
    cue: 'الشكل يتغيّر · الحجم ثابت تقريبًا',
    takeaway: 'السائل يشغل جزءًا من الوعاء.',
  },
  {
    id: 'S04',
    title: 'الغاز يملأ الحيز المتاح',
    term: 'GAS',
    kind: 'gas',
    cue: 'شكل الوعاء · حجم الوعاء',
    takeaway: 'فرق مهم: السائل له حجم محدد تقريبًا.',
  },
  {
    id: 'S09',
    title: 'جسيمات صغيرة، فرق كبير',
    term: 'PARTICLE MODEL',
    kind: 'particles',
    cue: 'الترتيب · المسافات · الحركة',
    takeaway: 'الترتيب والمسافات والحركة تفسّر خواص المادة.',
  },
  {
    id: 'S05',
    title: 'الفراغ هو اللي بيقل',
    term: 'COMPRESSIBILITY',
    kind: 'compression',
    cue: 'قابلية الانضغاط',
    takeaway: 'نفس العدد · نفس حجم الجسيم · مسافات أقل',
  },
  {
    id: 'S06',
    title: 'كتلة قد إيه في نفس الحجم؟',
    term: 'DENSITY',
    kind: 'density',
    cue: 'نفس الحجم · كتلة أكبر = كثافة أعلى',
    takeaway: 'الغاز أقل كثافة نسبيًا في الظروف العادية.',
  },
  {
    id: 'S07',
    title: 'مائع مش معناها سائل وبس',
    term: 'FLUIDITY',
    kind: 'flow',
    cue: 'السائل والغاز موائع',
    takeaway: 'الميوعة: القدرة على التدفق.',
  },
  {
    id: 'S08',
    title: 'الحركة العشوائية تعمل اختلاط',
    term: 'DIFFUSION',
    kind: 'diffusion',
    cue: 'الانتشار أسرع في الغاز عمومًا',
    takeaway: 'النموذج يوضح الاختلاط، لا سرعة حقيقية.',
  },
  {
    id: 'S11',
    title: 'التسخين… حسب ظروف الوعاء',
    term: 'THERMAL EXPANSION',
    kind: 'thermal',
    cue: 'نفس كمية الغاز · وعاءان مختلفان',
    takeaway: 'ضغط ثابت: الحجم يزيد. حجم ثابت: الضغط يزيد.',
  },
  {
    id: 'S10',
    title: 'دورك: لاحظ وفسّر',
    term: 'YOUR TURN',
    kind: 'summary',
    cue: 'من الملاحظة… للتفسير',
    takeaway: 'حدّد الحالة، وفسّر الضغط، ثم قارن بالسائل.',
  },
] as const;
export type StatesScene = (typeof STATES_SCENES)[number];
export const STATES_SCRIPT = source;
export const STATE_LABELS: Record<
  StateKind,
  { name: string; arabic: string; shape: string; volume: string; particles: string; color: string }
> = {
  solid: {
    name: 'Solid',
    arabic: 'صلب',
    shape: 'شكل محدد',
    volume: 'حجم محدد',
    particles: 'قريبة · تهتز في مواضعها',
    color: '#b98537',
  },
  liquid: {
    name: 'Liquid',
    arabic: 'سائل',
    shape: 'شكل الوعاء',
    volume: 'حجم محدد تقريبًا',
    particles: 'قريبة · تتحرك جنب بعضها',
    color: '#3a9687',
  },
  gas: {
    name: 'Gas',
    arabic: 'غاز',
    shape: 'شكل الوعاء',
    volume: 'يملأ الوعاء',
    particles: 'متباعدة · حركة عشوائية',
    color: '#8271c3',
  },
};
export const STATES_TEACHING_SCRIPT = source.beats.filter((beat) => !('role' in beat));
export const STATES_FEEDBACK_SCRIPT = source.beats.filter((beat) => 'role' in beat);
export const framesFor = (recording: StatesRecording) =>
  Math.ceil((recording.durationMs / 1000) * STATES_FPS);
export function cueProgress(
  recording: StatesRecording,
  cue: string,
  frame: number,
  durationSeconds = 2,
) {
  const at = recording.cues.find((c) => c.id === cue)?.atMs;
  if (at === undefined) return 0;
  const p = Math.max(0, Math.min(1, (frame / STATES_FPS - at / 1000) / durationSeconds));
  return p * p * (3 - 2 * p);
}
const reflect = (value: number, range: number) => {
  const wrap = ((value % (2 * range)) + 2 * range) % (2 * range);
  return wrap > range ? 2 * range - wrap : wrap;
};
const particleSeed = (index: number, axis: number) => {
  const value = Math.sin((index + 1) * 127.1 + axis * 311.7) * 43758.5453;
  return value - Math.floor(value);
};
export function particlesAt(
  kind: StateKind,
  frame: number,
  width: number,
  height: number,
  count = 24,
  reducedMotion = false,
) {
  const time = reducedMotion ? 0 : frame / STATES_FPS;
  return Array.from({ length: count }, (_, i) => {
    if (kind === 'solid')
      return {
        x: 22 + (i % 6) * 21 + Math.sin(time * 7 + i) * 1.4,
        y: height - 80 + Math.floor(i / 6) * 20 + Math.cos(time * 6 + i) * 1.4,
        r: 5,
      };
    return {
      x:
        9 +
        reflect(
          particleSeed(i, 0) * (width - 18) +
            time * (i % 2 ? -1 : 1) * (kind === 'gas' ? 38 + (i % 5) * 7 : 10 + (i % 5) * 3),
          width - 18,
        ),
      y:
        9 +
        reflect(
          particleSeed(i, 1) * (height - 18) +
            time * (i % 3 ? 1 : -1) * (kind === 'gas' ? 46 + (i % 4) * 8 : 8 + (i % 4) * 3),
          height - 18,
        ),
      r: 5,
    };
  });
}
