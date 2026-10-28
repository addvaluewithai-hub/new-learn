import type { ReactNode } from 'react';

/** A toggle in a row of options; several can be on at once. */
export function Chip({
  pressed,
  onToggle,
  children,
}: {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="nl-chip" aria-pressed={pressed} onClick={onToggle}>
      {children}
    </button>
  );
}

/** One choice among a few short options, shown side by side. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="nl-segmented" role="radiogroup" aria-label={label}>
      {options.map(([option, text]) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          onClick={() => onChange(option)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** A larger choice with a title and a line, as a card; one of a group is picked. */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <label className="nl-choice-card" data-checked={checked || undefined}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </label>
  );
}
