import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Look = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; icon?: ReactNode };

const classes = ({ variant = 'primary', size = 'md', block }: Look, extra?: string) =>
  ['nl-button', `nl-button--${variant}`, `nl-button--${size}`, block && 'nl-button--block', extra]
    .filter(Boolean)
    .join(' ');

/** The one button. Primary for the main action on a screen, secondary beside it, accent for
 *  the hero call to action on dark, ghost for quiet actions, danger for destructive ones. */
export function Button({
  variant,
  size,
  block,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes({ variant, size, block }, className)} {...rest}>
      {icon && (
        <span className="nl-button-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

/** A link that looks like a button, for actions that navigate. */
export function ButtonLink({
  variant,
  size,
  block,
  icon,
  className,
  children,
  ...rest
}: Look & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classes({ variant, size, block }, className)} {...rest}>
      {icon && (
        <span className="nl-button-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </a>
  );
}

/** A round button with only an icon; `label` is what a screen reader says. */
export function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  className,
  children,
  type = 'button',
  ...rest
}: {
  label: string;
  size?: ButtonSize;
  variant?: 'ghost' | 'secondary' | 'primary' | 'accent';
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={['nl-icon-button', `nl-button--${variant}`, `nl-icon-button--${size}`, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
