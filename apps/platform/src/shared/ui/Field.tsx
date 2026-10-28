import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

/** A labelled control with an optional hint and error under it. The control inside gets the
 *  `id`; give it `className="nl-input"` (or use TextInput / TextArea). */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="nl-field" data-invalid={error ? true : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <small id={`${id}-hint`} className="nl-field-hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="nl-field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={['nl-input', props.className].filter(Boolean).join(' ')} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={['nl-input', props.className].filter(Boolean).join(' ')} />
  );
}

/** A compact menu that reads as part of a sentence: «لـ [مبتدئين ▾]». */
export function PillSelect({
  lead,
  label,
  options,
  ...rest
}: {
  lead?: string;
  label: string;
  options: Array<[string, string]>;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="nl-pill-select">
      <span className="nl-sr-only">{label}</span>
      {lead && <span aria-hidden="true">{lead}</span>}
      <select {...rest}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

/** An on/off setting. A real checkbox, announced as a switch. */
export function Switch({
  checked,
  onChange,
  children,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="nl-switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="nl-switch-text">
        {children}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}
