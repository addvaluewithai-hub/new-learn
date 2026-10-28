import { useEffect, useState } from 'react';

const COLOURS: Array<[string, string]> = [
  ['--nl-primary', 'الأساسي'],
  ['--nl-accent', 'الليموني'],
  ['--nl-tutor', 'Nova'],
  ['--nl-ink', 'الكلام'],
  ['--nl-muted', 'كلام هادي'],
  ['--nl-line', 'خطوط'],
  ['--nl-bg', 'الخلفية'],
  ['--nl-paper', 'ورق الدرس'],
  ['--nl-surface-soft', 'سطح هادي'],
  ['--nl-success', 'صح'],
  ['--nl-danger', 'غلط'],
  ['--nl-warning', 'تنبيه'],
];
const TYPE: Array<[string, string]> = [
  ['--nl-text-3xl', 'عنوان الصفحة'],
  ['--nl-text-xl', 'عنوان جزء'],
  ['--nl-text-lg', 'كلام كبير'],
  ['--nl-text-md', 'الكلام العادي في كل الشاشات'],
  ['--nl-text-sm', 'كلام صغير وتفاصيل'],
];
const SHAPES = ['--nl-radius-sm', '--nl-radius-md', '--nl-radius-lg', '--nl-radius-xl'];

/** The tokens as they are right now, read from the page, so the gallery never goes stale. */
export function UiTokens() {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const all = [...COLOURS.map(([name]) => name), ...SHAPES];
    setValues(Object.fromEntries(all.map((name) => [name, style.getPropertyValue(name).trim()])));
  }, []);
  return (
    <>
      <section className="ui-section" aria-labelledby="ui-colours">
        <h2 id="ui-colours">الألوان</h2>
        <ul className="ui-swatches">
          {COLOURS.map(([name, label]) => (
            <li key={name}>
              <span className="ui-swatch" style={{ background: `var(${name})` }} />
              <strong>{label}</strong>
              <code>{name}</code>
              <code>{values[name]}</code>
            </li>
          ))}
        </ul>
      </section>
      <section className="ui-section" aria-labelledby="ui-type">
        <h2 id="ui-type">الخط والأحجام</h2>
        <div className="ui-type">
          {TYPE.map(([name, label]) => (
            <p key={name} style={{ fontSize: `var(${name})` }}>
              {label} <code>{name}</code>
            </p>
          ))}
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-shape">
        <h2 id="ui-shape">الحواف والظلال</h2>
        <div className="ui-shapes">
          {SHAPES.map((name) => (
            <div key={name} style={{ borderRadius: `var(${name})` }}>
              <code>{name}</code>
              <code>{values[name]}</code>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
