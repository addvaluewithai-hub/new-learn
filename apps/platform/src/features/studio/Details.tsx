import { CHOICES } from './choices';

const PICKS: Array<[string, string]> = [
  ['level', 'للطلاب'],
  ['language', 'بالـ'],
  ['size', ''],
  ['questions', 'أسئلة'],
  ['boards', 'بوردات'],
];

/** «٣ التفاصيل»: the settings as one sentence of chips, each a menu; teaching styles below. */
export function Details({
  choices,
  onPick,
}: {
  choices: Record<string, string>;
  onPick: (key: string, value: string, multi?: boolean) => void;
}) {
  const style = CHOICES.find((c) => c.key === 'style')!;
  return (
    <div className="details">
      <p className="details-line">
        {PICKS.map(([key, lead]) => {
          const choice = CHOICES.find((c) => c.key === key)!;
          return (
            <label key={key} className="pill">
              <span className="sr-only">{choice.title}</span>
              {lead && <span aria-hidden="true">{lead}</span>}
              <select value={choices[key]} onChange={(e) => onPick(key, e.target.value)}>
                {choice.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </p>
      <fieldset className="details-style">
        <legend>
          {style.title} <small>(لحد ٣)</small>
        </legend>
        <div className="chips">
          {style.options.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={choices.style.split(',').includes(value)}
              onClick={() => onPick('style', value, true)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
