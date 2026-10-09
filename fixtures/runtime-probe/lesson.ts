import type { LessonPackage, LessonRecording } from '@learn/lesson-runtime';
import audio from './audio-manifest.json';

// Synthetic words/cues deliberately test boundaries; these are not spoken ASR.
function recording(id: keyof typeof audio, question = false): LessonRecording {
  return {
    id,
    ...audio[id],
    words: [
      { text: 'synthetic', start_ms: 0, end_ms: 300 },
      { text: 'anchor', start_ms: 1000, end_ms: 1400 },
      { text: 'marker', start_ms: 2000, end_ms: 2400 },
    ],
    questionAtMs: question ? 1000 : null,
    cues: [
      { id: 'second-group', atMs: 1000 },
      { id: 'answer', atMs: 1000 },
    ],
    contentAudit: {
      faithful: false,
      issues: ['Synthetic tone fixture; not reviewed teaching or speech.'],
    },
  };
}

export const probeLesson: LessonPackage = {
  schemaVersion: 1,
  delivery: 'recorded',
  lessonId: 'runtime-probe',
  curriculumId: 'development-fixtures',
  contentRevision: 'probe-1',
  recordingVersion: 'synthetic-1',
  title: 'تجربة المحرك',
  englishTitle: 'Runtime acceptance probe',
  curriculumTitle: 'تجربة تطوير — ليست منهجًا',
  lessonOrder: 1,
  fps: 30,
  dimensions: { landscape: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } },
  scenes: [
    {
      id: 'combine',
      title: 'نشرح الفكرة',
      takeaway: '',
      tip: '',
      script: 'Synthetic tone test.',
      check: '',
      recordingId: 'teach',
      visual: { renderer: 'runtime-probe', params: { mode: 'combine' } },
    },
    {
      id: 'try',
      title: 'نجرب سؤال',
      takeaway: '',
      tip: '',
      script: 'Synthetic question test.',
      check: '',
      recordingId: 'question',
      visual: { renderer: 'runtime-probe', params: { mode: 'question' } },
      question: {
        id: 'Q1',
        english: 'How many counters are there altogether?',
        title: 'المجموعتين فيهم كام نقطة مع بعض؟',
        options: ['أربع نقاط', 'خمس نقاط'],
        englishOptions: ['Four counters', 'Five counters'],
        correct: 1,
        attempt: 'choice',
        hint: '',
        englishAnswer: 'There are five counters altogether.',
        explanation: 'اتنين زائد تلاتة يساوي خمسة.',
        feedbackId: 'feedback',
        readingParts: [
          { text: 'How many counters are there altogether?', atMs: 1000, language: 'en' },
          { text: 'المجموعتين فيهم كام نقطة مع بعض؟', atMs: 2000, language: 'ar' },
        ],
      },
    },
    {
      id: 'closing',
      title: 'نكمل تلقائيًا',
      takeaway: '',
      tip: '',
      script: 'Synthetic closing test.',
      check: '',
      recordingId: 'closing',
      visual: { renderer: 'runtime-probe', params: { mode: 'closing' } },
    },
  ],
  recordings: [
    recording('teach'),
    recording('question', true),
    recording('feedback'),
    recording('closing'),
  ],
  glossary: [],
  sources: [
    {
      title: 'Original development fixture',
      locator: 'fixtures/runtime-probe',
      availability: 'synthetic test only',
    },
  ],
  review: {
    heading: 'خلصت تجربة المحرك',
    summary: 'شوفنا الظهور التدريجي، السؤال أثناء التشغيل، والتعقيب والانتقال التلقائي.',
  },
};
