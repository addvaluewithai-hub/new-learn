import { ButtonLink } from '../../shared/ui';
import { Faq } from './Faq';
import { FAQ } from './faq';
import { useHead } from './head';
import { CONNECTOR_URL, SITE_LINKS } from './routes';
import { Shot, SiteFrame } from './SiteShell';

const STUDIO: Array<[string, string, string]> = [
  [
    'اكتب الفكرة أو ارفع الملزمة',
    'موضوع، أو PDF، أو صور من الكتاب. قول لمين الدرس واختار شكله من الأشكال الجاهزة.',
    '/site/studio.webp',
  ],
  [
    'شوفه وهو بيتعمل',
    'الدرس بيتبني خطوة بخطوة في دقايق، وبتشوف كل بورد أول ما يترسم.',
    '/site/progress.webp',
  ],
  [
    'راجع واكتب ملاحظات',
    'افتح الدرس زي ما الطالب هيشوفه، واكتب ملاحظة على أي خطوة. التصليح بييجي عليها.',
    '/site/draft.webp',
  ],
  [
    'انشر بلينك وتابع',
    'لينك واحد لطلابك. بتشوف مين بدأ ومين خلص كل درس، وبتنشر نسخة جديدة لما تعدّل.',
    '/site/publish.webp',
  ],
];

const CONNECT: Array<[string, string]> = [
  ['في Claude، افتح الإعدادات ثم Connectors ثم Add custom connector.', 'الاسم New Learn، واللينك:'],
  [
    'سجّل دخولك في New Learn واسمح للتطبيق.',
    'الصلاحية: يعمل مسودات ويقرا ملاحظاتك بس. مش بيقدر ينشر ولا يشوف الطلاب.',
  ],
  [
    'اطلب الدرس بكلامك.',
    'مثلًا: «اعمل لي درس عن الفايدة المركبة لطلاب أولى تجارة، ٣ مشاهد، بالعامية المصرية». هيسألك كام سؤال الأول ويتفق معاك على الخطة.',
  ],
  [
    'افتح لينك المعاينة اللي هيبعته.',
    'اكتب ملاحظاتك على الخطوات، وقوله «صلّح الملاحظات». لما يعجبك، انشره من لوحة المدرس.',
  ],
];

export default function TeachersPage() {
  useHead({
    title: 'للمدرسين · New Learn',
    description:
      'حضّر درس تفاعلي لطلابك في دقايق: من الاستوديو، أو بـClaude وChatGPT بتوعك. راجع، انشر بلينك، وتابع.',
    path: '/teachers',
  });
  return (
    <SiteFrame wide>
      <div className="site-title">
        <span className="eyebrow">للمدرسين</span>
        <h1>حضّر درس تفاعلي لطلابك في دقايق.</h1>
        <p>
          من ملزمتك أو من فكرة في دماغك: بورد بيترسم قدام الطالب، وسؤال بعد كل فكرة، وNova بتشرح
          بالصوت. انت بتراجع وتنشر، وطلابك بيفتحوا لينك.
        </p>
        <div className="site-ctas">
          <ButtonLink variant="accent" size="lg" href={SITE_LINKS.signup}>
            ابدأ مجانًا
          </ButtonLink>
          <ButtonLink variant="secondary" size="lg" href={SITE_LINKS.demos}>
            شوف دروس جاهزة
          </ButtonLink>
        </div>
      </div>
      <section aria-labelledby="t-studio">
        <div className="site-head">
          <h2 id="t-studio">الطريقة الأولى: من الاستوديو</h2>
          <p>أربع خطوات، من غير ما تكتب سطر كود.</p>
        </div>
        <ol className="site-steps">
          {STUDIO.map(([title, text, src]) => (
            <li key={title}>
              <Shot src={src} alt="" />
              <strong>{title}</strong>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section id="connect" aria-labelledby="t-connect">
        <div className="site-head">
          <h2 id="t-connect">الطريقة التانية: بـClaude أو ChatGPT بتاعك</h2>
          <p>
            لو بتحب تشتغل مع الـAI بتاعك، وصّله بالموقع وهو يكتب الدرس هنا مباشرة. إحنا بنتأكد من
            الصيغة ونحفظه مسودة في حسابك.
          </p>
        </div>
        <ol className="site-steps">
          {CONNECT.map(([title, text], i) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>
                {text} {i === 0 && <code>{CONNECTOR_URL}</code>}
              </p>
            </li>
          ))}
        </ol>
        <p className="site-note">
          في ChatGPT نفس الفكرة من الإعدادات ثم Connectors، لو خطتك بتدعم الـconnectors المخصصة.
        </p>
      </section>
      <section aria-labelledby="t-faq">
        <div className="site-head">
          <h2 id="t-faq">أسئلة المدرسين</h2>
        </div>
        <Faq items={FAQ.filter((f) => f.for === 'teachers')} open={0} />
      </section>
    </SiteFrame>
  );
}
