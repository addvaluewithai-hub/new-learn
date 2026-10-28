// The "make a course" choices as the page shows them; the keys match the server's CHOICES
// (server/builds/request.ts), which says what each one tells the builder.
export type Choice = {
  key: string;
  title: string;
  multi?: boolean;
  options: Array<[string, string]>;
};

export const CHOICES: Choice[] = [
  {
    key: 'audience',
    title: 'الكورس لمين',
    options: [
      ['me', 'ليّا أنا'],
      ['students', 'لطلابي'],
      ['kids', 'لطفل'],
    ],
  },
  {
    key: 'goal',
    title: 'الهدف',
    options: [
      ['understand', 'أفهم الفكرة'],
      ['practice', 'أتمرن على مسائل'],
      ['review', 'أراجع بسرعة'],
    ],
  },
  {
    key: 'age',
    title: 'السن',
    options: [
      ['4-6', 'من ٤ لـ٦ سنين'],
      ['7-9', 'من ٧ لـ٩ سنين'],
      ['10-12', 'من ١٠ لـ١٢ سنة'],
    ],
  },
  {
    key: 'level',
    title: 'مستوى الطلاب',
    options: [
      ['beginner', 'مبتدئين'],
      ['some', 'عندهم خلفية'],
      ['revision', 'مراجعة'],
    ],
  },
  {
    key: 'language',
    title: 'لغة الشرح',
    options: [
      ['egyptian', 'مصري'],
      ['msa', 'فصحى'],
      ['english', 'English'],
      ['mixed', 'عربي ومصطلحات إنجليزي'],
    ],
  },
  {
    key: 'style',
    title: 'طريقة الشرح',
    multi: true,
    options: [
      ['story', 'حكاية الأول'],
      ['steps', 'خطوة بخطوة'],
      ['problem', 'مشكلة الأول'],
      ['examples', 'أمثلة محلولة'],
      ['analogies', 'تشبيهات من الحياة'],
    ],
  },
  {
    key: 'boards',
    title: 'البوردات',
    options: [
      ['text', 'نص بس'],
      ['some', 'تفاعلي لما يفيد'],
      ['most', 'تفاعلي في أغلبه'],
    ],
  },
  {
    key: 'questions',
    title: 'الأسئلة',
    options: [
      ['each', 'بعد كل مشهد'],
      ['key', 'في نقط مهمة'],
      ['none', 'من غير أسئلة'],
    ],
  },
  {
    key: 'size',
    title: 'الحجم',
    options: [
      ['1', 'درس واحد'],
      ['3', '3 دروس'],
      ['5', '5 دروس'],
    ],
  },
];

/** Who the course is for decides which few questions the page asks, in that person's words.
 *  The rest wait under «تفاصيل أكتر». */
export type Audience = {
  id: string;
  name: string;
  line: string;
  asks: Array<{ key: string; lead: string; labels?: Record<string, string> }>;
};

export const AUDIENCES: Audience[] = [
  {
    id: 'me',
    name: 'ليّا أنا',
    line: 'بذاكر أو عايز أتعلم حاجة جديدة',
    asks: [
      {
        key: 'level',
        lead: 'أنا',
        labels: { beginner: 'أول مرة أسمع عنه', some: 'عارف شوية', revision: 'بذاكر لامتحان' },
      },
      { key: 'goal', lead: 'عايز' },
      {
        key: 'size',
        lead: 'وقتي',
        labels: { '1': 'ربع ساعة', '3': 'حوالي ساعة', '5': 'أكتر من ساعة' },
      },
      { key: 'language', lead: 'بالـ' },
    ],
  },
  {
    id: 'students',
    name: 'لطلابي',
    line: 'كورس أشرحه لفصل أو مجموعة',
    asks: [
      { key: 'level', lead: 'الطلاب' },
      { key: 'size', lead: '' },
      { key: 'questions', lead: 'أسئلة' },
      { key: 'language', lead: 'بالـ' },
    ],
  },
  {
    id: 'kids',
    name: 'لطفل',
    line: 'لابني أو بنتي أو تلاميذ صغيرين',
    asks: [
      { key: 'age', lead: 'السن' },
      {
        key: 'size',
        lead: '',
        labels: { '1': 'درس قصير', '3': '3 دروس قصيرة', '5': '5 دروس قصيرة' },
      },
      { key: 'language', lead: 'بالـ' },
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
