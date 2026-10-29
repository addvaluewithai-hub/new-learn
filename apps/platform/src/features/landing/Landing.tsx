import { useCallback, useState } from 'react';
import { Brand } from '../../shared/Brand';
import { ButtonLink } from '../../shared/ui';
import { LOOKS } from '../studio/looks';
import { HeroStage } from './HeroStage';
import { initialLook, type HeroLook } from './hero';
import '../../shared/platform.css';
import './landing.css';

const STEPS = [
  ['اكتب الفكرة', 'موضوع، أو ملزمة، أو صفحة من كتاب. بالعربي أو الإنجليزي.'],
  ['قول لمين، واختار شكله', 'ليك، أو لطلابك، أو لطفل. وشكل يناسب الموضوع.'],
  ['اتعلّم مع Nova', 'بوردات بتتحرك بإيدك، وسؤال بعد كل فكرة، وصوت بيشرح.'],
];
const AUDIENCES = [
  ['ليك إنت', 'بتذاكر لامتحان؟ ارفع الملزمة وخلّيها درس تتفاعل معاه.'],
  ['لطلابك', 'حضّر درس في دقايق، راجعه، وابعته بلينك.'],
  ['لولادك', 'أشكال مرحة وكلام بسيط وأسئلة على قد سنّهم.'],
];

/** The front door for visitors: a lesson drawing itself, in the looks it comes in, and one way in. */
export default function Landing() {
  const [look, setLook] = useState<HeroLook>(() => initialLook(location.hash));
  const [pinned, setPinned] = useState(false);
  const onChange = useCallback((next: HeroLook, pin: boolean) => {
    setLook(next);
    setPinned(pin);
  }, []);
  const tint = { '--look-bg': look.colors[0], '--look-ink': look.colors[1] } as React.CSSProperties;
  return (
    <div className="platform-ui landing" dir="rtl" style={tint}>
      <header className="landing-nav">
        <Brand />
        <nav aria-label="روابط">
          <a href="#looks">الأشكال</a>
          <a href="?preview=demos">الديموز</a>
          <ButtonLink variant="ghost" size="sm" href="/?auth=login">
            ادخل
          </ButtonLink>
          <ButtonLink variant="accent" size="sm" href="/?auth=signup">
            ابدأ مجانًا
          </ButtonLink>
        </nav>
      </header>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">درس من أي فكرة، في دقايق</span>
          <h1>أي فكرة، تبقى درس بيترسم قدامك.</h1>
          <p>
            اكتب الموضوع واختار شكله. البورد بيترسم بالكود، وNova بتشرح بالصوت وتسألك بعد كل فكرة.
          </p>
          <div className="landing-ctas">
            <ButtonLink variant="accent" size="lg" href="/?auth=signup">
              اعمل أول درس
            </ButtonLink>
            <ButtonLink variant="ghost" size="lg" href={`/?preview=demo&id=${look.demo}`}>
              افتح الدرس ده كامل
            </ButtonLink>
          </div>
        </div>
        <HeroStage look={look} pinned={pinned} onChange={onChange} />
      </section>
      <main>
        <section id="looks" className="landing-section" aria-labelledby="landing-looks">
          <div className="landing-head">
            <h2 id="landing-looks">شكل لكل موضوع</h2>
            <p>كل درس بيترسم بالكود، بشكل يناسب موضوعه. دوس على أي واحد وجرّبه.</p>
          </div>
          <ul className="landing-looks">
            {LOOKS.map((item) => (
              <li key={item.id}>
                <a href={`/?preview=demo&id=${item.demo}`}>
                  <img src={`/styles/${item.id}.webp`} alt="" loading="lazy" />
                  <strong>{item.name}</strong>
                  <span>{item.line}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section className="landing-section" aria-labelledby="landing-how">
          <div className="landing-head">
            <h2 id="landing-how">إزاي بيشتغل</h2>
          </div>
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
          <div className="landing-head">
            <h2 id="landing-who">لمين؟</h2>
          </div>
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
