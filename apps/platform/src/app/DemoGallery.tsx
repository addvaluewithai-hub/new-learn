import { DEMOS } from '../../../../fixtures/demos';
import '../shared/platform.css';
import './demo-gallery.css';
import { useI18n } from '../i18n';

/** `?preview=demos`: ten short courses, each in its own style, open without an account. */
export default function DemoGallery() {
  const { t, dir } = useI18n();
  return (
    <main className="platform-ui demo-gallery" dir={dir}>
      <header>
        <span className="eyebrow">{t('app.demos.eyebrow')}</span>
        <h1>{t('app.demos.title')}</h1>
        <p>{t('app.demos.lead')}</p>
      </header>
      <ul>
        {DEMOS.map((demo) => {
          const card = (
            <>
              <span className="demo-style">
                <bdi>{demo.style}</bdi>
              </span>
              <strong>
                <bdi>{demo.title}</bdi>
              </strong>
              <span className="demo-audience">
                {demo.load ? <bdi>{demo.audience}</bdi> : t('app.demos.soon')}
              </span>
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
