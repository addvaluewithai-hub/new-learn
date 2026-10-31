import type { TextKey } from '../../i18n';

// The "make a course" choices as the page shows them; the keys match the server's CHOICES
// (server/builds/request.ts), which says what each one tells the builder. Titles and labels
// are keys in the language files: components call t() when rendering.
export type Choice = {
  key: string;
  title: TextKey;
  multi?: boolean;
  options: Array<[string, TextKey]>;
};

export const CHOICES: Choice[] = [
  {
    key: 'audience',
    title: 'studio.choices.audience.title',
    options: [
      ['me', 'studio.choices.audience.me'],
      ['students', 'studio.choices.audience.students'],
      ['kids', 'studio.choices.audience.kids'],
    ],
  },
  {
    key: 'goal',
    title: 'studio.choices.goal.title',
    options: [
      ['understand', 'studio.choices.goal.understand'],
      ['practice', 'studio.choices.goal.practice'],
      ['review', 'studio.choices.goal.review'],
    ],
  },
  {
    key: 'age',
    title: 'studio.choices.age.title',
    options: [
      ['4-6', 'studio.choices.age.from4to6'],
      ['7-9', 'studio.choices.age.from7to9'],
      ['10-12', 'studio.choices.age.from10to12'],
    ],
  },
  {
    key: 'level',
    title: 'studio.choices.level.title',
    options: [
      ['beginner', 'studio.choices.level.beginner'],
      ['some', 'studio.choices.level.some'],
      ['revision', 'studio.choices.level.revision'],
    ],
  },
  {
    // The language the lesson is written in: its options are content, only the labels turn.
    key: 'language',
    title: 'studio.choices.language.title',
    options: [
      ['egyptian', 'studio.choices.language.egyptian'],
      ['msa', 'studio.choices.language.msa'],
      ['english', 'studio.choices.language.english'],
      ['mixed', 'studio.choices.language.mixed'],
    ],
  },
  {
    key: 'style',
    title: 'studio.choices.style.title',
    multi: true,
    options: [
      ['story', 'studio.choices.style.story'],
      ['steps', 'studio.choices.style.steps'],
      ['problem', 'studio.choices.style.problem'],
      ['examples', 'studio.choices.style.examples'],
      ['analogies', 'studio.choices.style.analogies'],
    ],
  },
  {
    key: 'boards',
    title: 'studio.choices.boards.title',
    options: [
      ['text', 'studio.choices.boards.text'],
      ['some', 'studio.choices.boards.some'],
      ['most', 'studio.choices.boards.most'],
    ],
  },
  {
    key: 'questions',
    title: 'studio.choices.questions.title',
    options: [
      ['each', 'studio.choices.questions.each'],
      ['key', 'studio.choices.questions.key'],
      ['none', 'studio.choices.questions.none'],
    ],
  },
  {
    key: 'size',
    title: 'studio.choices.size.title',
    options: [
      ['1', 'studio.choices.size.oneLesson'],
      ['3', 'studio.choices.size.threeLessons'],
      ['5', 'studio.choices.size.fiveLessons'],
    ],
  },
];

/** Who the course is for decides which few questions the page asks, in that person's words.
 *  The rest wait under «تفاصيل أكتر». */
export type Audience = {
  id: string;
  name: TextKey;
  line: TextKey;
  asks: Array<{ key: string; lead?: TextKey; labels?: Record<string, TextKey> }>;
};

export const AUDIENCES: Audience[] = [
  {
    id: 'me',
    name: 'studio.audiences.me.name',
    line: 'studio.audiences.me.line',
    asks: [
      {
        key: 'level',
        lead: 'studio.leads.myLevel',
        labels: {
          beginner: 'studio.audiences.me.level.beginner',
          some: 'studio.audiences.me.level.some',
          revision: 'studio.audiences.me.level.revision',
        },
      },
      { key: 'goal', lead: 'studio.leads.goal' },
      {
        key: 'size',
        lead: 'studio.leads.time',
        labels: {
          '1': 'studio.audiences.me.size.oneLesson',
          '3': 'studio.audiences.me.size.threeLessons',
          '5': 'studio.audiences.me.size.fiveLessons',
        },
      },
      { key: 'language', lead: 'studio.leads.language' },
    ],
  },
  {
    id: 'students',
    name: 'studio.audiences.students.name',
    line: 'studio.audiences.students.line',
    asks: [
      { key: 'level', lead: 'studio.leads.students' },
      { key: 'size' },
      { key: 'questions', lead: 'studio.leads.questions' },
      { key: 'language', lead: 'studio.leads.language' },
    ],
  },
  {
    id: 'kids',
    name: 'studio.audiences.kids.name',
    line: 'studio.audiences.kids.line',
    asks: [
      { key: 'age', lead: 'studio.leads.age' },
      {
        key: 'size',
        labels: {
          '1': 'studio.audiences.kids.size.oneLesson',
          '3': 'studio.audiences.kids.size.threeLessons',
          '5': 'studio.audiences.kids.size.fiveLessons',
        },
      },
      { key: 'language', lead: 'studio.leads.language' },
    ],
  },
];

export const DEFAULT_CHOICES: Record<string, string> = {
  audience: 'me',
  goal: 'understand',
  age: '7-9',
  level: 'beginner',
  language: 'egyptian',
  style: 'steps',
  boards: 'some',
  questions: 'key',
  size: '1',
};

export const FILE_TYPES =
  'application/pdf,.pdf,.docx,image/png,image/jpeg,image/webp,text/plain,.txt,.md';
export const FILE_LIMITS = { count: 5, each: 4 * 1024 * 1024, total: 10 * 1024 * 1024 };

/** A chosen file as the API takes it: its bytes in base64. */
export async function readUpload(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const mime =
    file.type ||
    (file.name.endsWith('.md') ? 'text/markdown' : file.name.endsWith('.txt') ? 'text/plain' : '');
  return { name: file.name, mime, data: btoa(binary) };
}
