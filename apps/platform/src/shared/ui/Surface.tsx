import type { HTMLAttributes, ReactNode } from 'react';

/** A white panel on the page. `tone="soft"` for a quieter grouped area. */
export function Card({
  tone = 'plain',
  padded = true,
  className,
  ...rest
}: { tone?: 'plain' | 'soft' | 'outline'; padded?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['nl-card', `nl-card--${tone}`, padded && 'nl-card--padded', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}

export type Tone = 'neutral' | 'accent' | 'success' | 'danger' | 'tutor' | 'warning';

/** A small label: a status, a count, a «جديد». */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`nl-badge nl-badge--${tone}`}>{children}</span>;
}

/** A message in the flow of the page. Errors interrupt screen readers; the rest wait. */
export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`nl-alert nl-alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="nl-spinner-wrap" role={label ? 'status' : undefined}>
      <span className="nl-spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}

/** What a list shows before it has anything: a line of why, and the next step. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="nl-empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
