import { useEffect, useState } from 'react';
import { useI18n, type TextKey } from '../i18n';

const COLOURS: Array<[string, TextKey]> = [
  ['--nl-primary', 'ui.tokens.colours.primary'],
  ['--nl-accent', 'ui.tokens.colours.accent'],
  ['--nl-tutor', 'ui.tokens.colours.tutor'],
  ['--nl-ink', 'ui.tokens.colours.ink'],
  ['--nl-muted', 'ui.tokens.colours.muted'],
  ['--nl-line', 'ui.tokens.colours.line'],
  ['--nl-bg', 'ui.tokens.colours.bg'],
  ['--nl-paper', 'ui.tokens.colours.paper'],
  ['--nl-surface-soft', 'ui.tokens.colours.surfaceSoft'],
  ['--nl-success', 'ui.tokens.colours.success'],
  ['--nl-danger', 'ui.tokens.colours.danger'],
  ['--nl-warning', 'ui.tokens.colours.warning'],
];
const TYPE: Array<[string, TextKey]> = [
  ['--nl-text-3xl', 'ui.tokens.type.page'],
  ['--nl-text-xl', 'ui.tokens.type.section'],
  ['--nl-text-lg', 'ui.tokens.type.large'],
  ['--nl-text-md', 'ui.tokens.type.body'],
  ['--nl-text-sm', 'ui.tokens.type.small'],
];
const SHAPES = ['--nl-radius-sm', '--nl-radius-md', '--nl-radius-lg', '--nl-radius-xl'];

/** The tokens as they are right now, read from the page, so the gallery never goes stale. */
export function UiTokens() {
  const [values, setValues] = useState<Record<string, string>>({});
  const { t } = useI18n();
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const all = [...COLOURS.map(([name]) => name), ...SHAPES];
    setValues(Object.fromEntries(all.map((name) => [name, style.getPropertyValue(name).trim()])));
  }, []);
  return (
    <>
      <section className="ui-section" aria-labelledby="ui-colours">
        <h2 id="ui-colours">{t('ui.tokens.coloursTitle')}</h2>
        <ul className="ui-swatches">
          {COLOURS.map(([name, label]) => (
            <li key={name}>
              <span className="ui-swatch" style={{ background: `var(${name})` }} />
              <strong>{t(label)}</strong>
              <code>{name}</code>
              <code>{values[name]}</code>
            </li>
          ))}
        </ul>
      </section>
      <section className="ui-section" aria-labelledby="ui-type">
        <h2 id="ui-type">{t('ui.tokens.typeTitle')}</h2>
        <div className="ui-type">
          {TYPE.map(([name, label]) => (
            <p key={name} style={{ fontSize: `var(${name})` }}>
              {t(label)} <code>{name}</code>
            </p>
          ))}
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-shape">
        <h2 id="ui-shape">{t('ui.tokens.shapeTitle')}</h2>
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
