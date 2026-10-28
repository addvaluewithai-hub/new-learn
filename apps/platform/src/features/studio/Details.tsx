import { AUDIENCES, CHOICES } from './choices';

const choiceOf = (key: string) => CHOICES.find((c) => c.key === key)!;

/** One setting as a pill: a short lead and a menu, in the words of the person it is for. */
function Pill({
  name,
  lead,
  labels,
  value,
  onPick,
}: {
  name: string;
  lead: string;
  labels?: Record<string, string>;
  value: string;
  onPick: (key: string, value: string) => void;
}) {
  const choice = choiceOf(name);
  return (
    <label className="pill">
      <span className="sr-only">{choice.title}</span>
      {lead && <span aria-hidden="true">{lead}</span>}
      <select value={value} onChange={(e) => onPick(name, e.target.value)}>
        {choice.options.map(([option, label]) => (
          <option key={option} value={option}>
            {labels?.[option] ?? label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** «٢ لمين؟»: who the course is for, the few questions that matter to them, and the rest
 *  (boards, questions, teaching style) folded under «تفاصيل أكتر». */
export function Details({
  choices,
  onPick,
}: {
  choices: Record<string, string>;
  onPick: (key: string, value: string, multi?: boolean) => void;
}) {
  const audience = AUDIENCES.find((a) => a.id === choices.audience) ?? AUDIENCES[0];
  const asked = audience.asks.map((ask) => ask.key);
  const more = ['questions', 'boards'].filter((key) => !asked.includes(key));
  const style = choiceOf('style');
  return (
    <div className="details">
      <div className="audiences" role="radiogroup" aria-label="الكورس لمين">
        {AUDIENCES.map((a) => (
          <label key={a.id} className={`audience${a.id === audience.id ? ' on' : ''}`}>
            <input
              type="radio"
              name="audience"
              value={a.id}
              checked={a.id === audience.id}
              onChange={() => onPick('audience', a.id)}
            />
            <strong>{a.name}</strong>
            <span>{a.line}</span>
          </label>
        ))}
      </div>
      <p className="details-line">
        {audience.asks.map((ask) => (
          <Pill
            key={ask.key}
            name={ask.key}
            lead={ask.lead}
            labels={ask.labels}
            value={choices[ask.key]}
            onPick={onPick}
          />
        ))}
      </p>
      <details className="details-more">
        <summary>تفاصيل أكتر</summary>
        <p className="details-line">
          {more.map((key) => (
            <Pill
              key={key}
              name={key}
              lead={key === 'boards' ? 'بوردات' : 'أسئلة'}
              value={choices[key]}
              onPick={onPick}
            />
          ))}
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
      </details>
    </div>
  );
}
