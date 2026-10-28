import { Brand } from '../../shared/Brand';
import { ButtonLink } from '../../shared/ui';
import { LOOKS } from '../studio/looks';
import '../../shared/platform.css';
import './landing.css';

const STEPS = [
  ['اكتب الفكرة', 'موضوع، أو ملزمة، أو صفحة من كتاب. بالعربي أو الإنجليزي.'],
  ['قول لمين واختار شكله', 'ليك، أو لطلابك، أو لطفل. وشكل يناسب الموضوع: طباشير، خريطة، 3D…'],
  ['اتعلّم مع Nova', 'بوردات تحرّكها بإيدك، وأسئلة بعد كل فكرة، وNova بتشرح بالصوت.'],
];
const AUDIENCES = [
  ['ليك إنت', 'بتذاكر لامتحان أو عايز تفهم حاجة جديدة؟ ارفع الملزمة وخلّيها درس تتفاعل معاه.'],
  ['لطلابك', 'حضّر درس تفاعلي في دقايق، وراجعه قبل ما يوصل لطلابك.'],
  ['لولادك', 'أشكال مرحة وكلام بسيط وأسئلة على قد سنّهم.'],
];

/** The front door for visitors: what New Learn makes, in the looks it makes it, and one way in. */
export default function Landing() {
  const hero = LOOKS.filter((look) => ['chalk', 'space3d', 'seachart'].includes(look.id));
  return (
    <div className="platform-ui landing" dir="rtl">
      <header className="landing-nav">
        <Brand />
        <nav aria-label="روابط">
          <a href="#looks">الأشكال</a>
          <a href="?preview=demos">الديموز</a>
          <ButtonLink variant="ghost" size="sm" href="/?auth=login">
            ادخل
          </ButtonLink>
          <ButtonLink size="sm" href="/?auth=signup">
            ابدأ مجانًا
          </ButtonLink>
        </nav>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="eyebrow">دروس تفاعلية من أي فكرة</span>
            <h1>أي فكرة، تبقى درس تلعب فيه بإيدك.</h1>
            <p>
              اكتب الموضوع واختار شكله، وفي دقايق يبقى عندك درس فيه بوردات بتتحرك، وأسئلة بعد كل
              فكرة، وNova بتشرح لك بالصوت.
            </p>
            <div className="landing-ctas">
              <ButtonLink variant="accent" size="lg" href="/?auth=signup">
                اعمل أول درس
              </ButtonLink>
              <ButtonLink variant="secondary" size="lg" href="/?preview=demo&id=interest">
                جرّب درس جاهز
              </ButtonLink>
            </div>
          </div>
          <div className="landing-hero-art" aria-hidden="true">
            {hero.map((look) => (
              <img key={look.id} src={`/styles/${look.id}.webp`} alt="" />
            ))}
          </div>
        </section>
        <section id="looks" className="landing-section" aria-labelledby="landing-looks">
          <h2 id="landing-looks">شكل لكل موضوع</h2>
          <p className="landing-lead">
            كل درس بيترسم بالكود، بشكل يناسب موضوعه. دوس على أي واحد وجرّبه.
          </p>
          <ul className="landing-looks">
            {LOOKS.map((look) => (
              <li key={look.id}>
                <a href={`/?preview=demo&id=${look.demo}`}>
                  <img src={`/styles/${look.id}.webp`} alt="" loading="lazy" />
                  <strong>{look.name}</strong>
                  <span>{look.line}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section className="landing-section" aria-labelledby="landing-how">
          <h2 id="landing-how">إزاي بيشتغل</h2>
          <ol className="landing-steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span aria-hidden="true">{['١', '٢', '٣'][i]}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="landing-section" aria-labelledby="landing-who">
          <h2 id="landing-who">لمين؟</h2>
          <ul className="landing-who">
            {AUDIENCES.map(([title, text]) => (
              <li key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="landing-final">
          <h2>جرّب بفكرة واحدة.</h2>
          <p>مجانًا، ومن غير ما تثبّت حاجة.</p>
          <ButtonLink variant="accent" size="lg" href="/?auth=signup">
            اعمل حسابك
          </ButtonLink>
        </section>
      </main>
      <footer className="landing-foot">
        <Brand />
        <span>اتعلّم بطريقتك.</span>
      </footer>
    </div>
  );
}
