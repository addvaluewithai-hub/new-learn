import { ButtonLink } from '../../shared/ui';
import { Faq } from '../site/Faq';
import { FAQ } from '../site/faq';
import { CONNECTOR_URL, SITE_LINKS } from '../site/routes';
import { Shot } from '../site/SiteShell';
import './sections.css';

// The landing's sections below the hero: how it works, Nova, teachers, the connector, who
// it is for, and the questions. Each is a few lines of copy next to the real product.

const STEPS: Array<[string, string, string]> = [
  ['اكتب الفكرة', 'موضوع، أو ملزمة، أو صفحة من كتاب. قول لمين، واختار شكله.', '/site/studio.webp'],
  [
    'شوفه وهو بيتعمل',
    'الدرس بيتبني خطوة بخطوة، وكل بورد بيظهر أول ما يترسم.',
    '/site/progress.webp',
  ],
  ['اتعلّم مع Nova', 'بورد بيتحرك بإيدك، وسؤال بعد كل فكرة، وصوت بيشرح.', '/site/reading.webp'],
];

export function HowSection() {
  return (
    <section className="landing-section" aria-labelledby="landing-how">
      <div className="site-head">
        <h2 id="landing-how">إزاي بيشتغل</h2>
        <p>من الفكرة للدرس في تلات خطوات، وانت بتشوف كل حاجة.</p>
      </div>
      <ol className="site-steps landing-how">
        {STEPS.map(([title, text, src]) => (
          <li key={title}>
            <Shot src={src} alt="" />
            <strong>{title}</strong>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const NOVA: Array<[string, string]> = [
  [
    'بتعرف انت فين',
    'Nova شايفة الخطوة اللي واقف عندها، فبتجاوب على قد السؤال من غير ما تعيد الدرس.',
  ],
  ['بالصوت أو بالكتابة', 'اضغط واتكلم، أو اكتب. وبتسمع الرد لو حابب.'],
  [
    'التصحيح من الدرس، مش منها',
    'سؤال بعد كل فكرة: اختيار، أو كتابة، أو على البورد نفسه. الإجابة الصح محددة في الدرس.',
  ],
];

export function NovaSection() {
  return (
    <section className="landing-section landing-split" aria-labelledby="landing-nova">
      <div className="landing-split-copy">
        <div className="site-head">
          <span className="eyebrow">Nova</span>
          <h2 id="landing-nova">مساعدة جوه الدرس، مش بره.</h2>
          <p>في كل خطوة فيه حد تسأله. وفي كل فكرة فيه سؤال يتأكد إنك فهمت.</p>
        </div>
        <ul className="landing-points">
          {NOVA.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
      <Shot src="/site/reading.webp" alt="درس قراءة في New Learn: البورد وشريط Nova" tall />
    </section>
  );
}

const TEACHER: Array<[string, string]> = [
  ['من الملزمة', 'ارفع PDF أو صور من الكتاب، أو اكتب الفكرة. الدرس بيتعمل عليها.'],
  [
    'راجع قبل ما يوصل',
    'اكتب ملاحظة على أي خطوة، والتصليح بييجي عليها. مفيش حاجة بتتنشر غير بإيدك.',
  ],
  ['لينك واحد لطلابك', 'بيفتحوه ويبدأوا. بتشوف مين بدأ ومين خلص كل درس.'],
];

export function TeacherSection() {
  return (
    <section
      className="landing-section landing-split landing-split--flip"
      aria-labelledby="landing-teacher"
    >
      <div className="landing-split-copy">
        <div className="site-head">
          <span className="eyebrow">للمدرس</span>
          <h2 id="landing-teacher">من الملزمة للينك، في نفس اليوم.</h2>
        </div>
        <ul className="landing-points">
          {TEACHER.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </li>
          ))}
        </ul>
        <ButtonLink variant="secondary" href={SITE_LINKS.teachers}>
          صفحة المدرسين
        </ButtonLink>
      </div>
      <Shot src="/site/publish.webp" alt="لوحة المدرس: النشر ولينك الكورس" tall />
    </section>
  );
}

export function ConnectSection() {
  return (
    <section className="landing-connect" aria-labelledby="landing-connect">
      <div className="site-head">
        <span className="eyebrow">عندك Claude أو ChatGPT؟</span>
        <h2 id="landing-connect">خلّيه يكتب الدرس هنا.</h2>
        <p>
          وصّله بالموقع كـconnector واطلب منه درس بكلامك. هو بيكتب، وإحنا بنتأكد من الصيغة ونحفظه
          مسودة في حسابك. بيشوف مسوداتك بس، ومش بيقدر ينشر.
        </p>
      </div>
      <div className="landing-connect-url">
        <code>{CONNECTOR_URL}</code>
        <ButtonLink variant="accent" href={SITE_LINKS.connect}>
          إزاي توصّله
        </ButtonLink>
      </div>
    </section>
  );
}

const AUDIENCES: Array<[string, string, string, string]> = [
  [
    'ليك إنت',
    'بتذاكر لامتحان؟ ارفع الملزمة وخلّيها درس تتفاعل معاه.',
    'اعمل أول درس',
    SITE_LINKS.signup,
  ],
  ['لطلابك', 'حضّر درس في دقايق، راجعه، وابعته بلينك.', 'للمدرسين', SITE_LINKS.teachers],
  [
    'لولادك',
    'أشكال مرحة وكلام بسيط وأسئلة على قد سنّهم.',
    'جرّب درس الكسور',
    '/?preview=demo&id=fractions',
  ],
];

export function WhoSection() {
  return (
    <section className="landing-section" aria-labelledby="landing-who">
      <div className="site-head">
        <h2 id="landing-who">لمين؟</h2>
      </div>
      <ul className="landing-who">
        {AUDIENCES.map(([title, text, cta, href]) => (
          <li key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
            <a href={href}>{cta} ←</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="landing-section landing-faq" aria-labelledby="landing-faq">
      <div className="site-head">
        <h2 id="landing-faq">أسئلة بتتسأل كتير</h2>
        <p>
          والباقي في <a href={SITE_LINKS.support}>صفحة الدعم</a>.
        </p>
      </div>
      <Faq items={FAQ.filter((f) => !f.for).slice(0, 5)} />
    </section>
  );
}
