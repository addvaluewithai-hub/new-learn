import { Chip, ChoiceCard, PillSelect } from '../../shared/ui';
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
    <PillSelect
      label={choice.title}
      lead={lead}
      value={value}
      onChange={(e) => onPick(name, e.target.value)}
      options={choice.options.map(([option, text]) => [option, labels?.[option] ?? text])}
    />
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
          <ChoiceCard
            key={a.id}
            name="audience"
            value={a.id}
            checked={a.id === audience.id}
            onChange={(id) => onPick('audience', id)}
            title={a.name}
          >
            {a.line}
          </ChoiceCard>
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
              <Chip
                key={value}
                pressed={choices.style.split(',').includes(value)}
                onToggle={() => onPick('style', value, true)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </fieldset>
      </details>
    </div>
  );
}
