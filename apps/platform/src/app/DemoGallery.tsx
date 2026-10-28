import { DEMOS } from '../../../../fixtures/demos';
import '../shared/platform.css';
import './demo-gallery.css';

/** `?preview=demos`: ten short courses, each in its own style, open without an account. */
export default function DemoGallery() {
  return (
    <main className="platform-ui demo-gallery" dir="rtl">
      <header>
        <span className="eyebrow">معرض New Learn</span>
        <h1>كورس واحد، استايل مختلف كل مرة</h1>
        <p>
          كورسات قصيرة اتعملت كلها على نفس المنصة: بورد تفاعلي تحرّكه بإيدك، وسؤال على البورد، وNova
          يشرح لك بالصوت.
        </p>
      </header>
      <ul>
        {DEMOS.map((demo) => {
          const card = (
            <>
              <span className="demo-style">{demo.style}</span>
              <strong>{demo.title}</strong>
              <span className="demo-audience">{demo.load ? demo.audience : 'قريبًا'}</span>
            </>
          );
          const style = { background: demo.colors[0], color: demo.colors[1] };
          return (
            <li key={demo.id}>
              {demo.load ? (
                <a className="demo-card" href={`/?preview=demo&id=${demo.id}`} style={style}>
                  {card}
                </a>
              ) : (
                <div className="demo-card soon" style={style} aria-disabled="true">
                  {card}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
