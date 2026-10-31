import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useI18n } from '../../i18n';

/** A modal on the native <dialog>: focus stays inside, Escape and the backdrop close it, and
 *  the page behind is inert. Mount it to open it; `onClose` unmounts it. */
export function Dialog({
  title,
  description,
  onClose,
  footer,
  size = 'md',
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={['nl-dialog', `nl-dialog--${size}`, className].filter(Boolean).join(' ')}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-text` : undefined}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself, outside its box.
        const dialog = ref.current;
        if (event.target !== dialog || !dialog) return;
        const box = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom;
        if (!inside) dialog.close();
      }}
    >
      <header className="nl-dialog-head">
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description && <p id={`${id}-text`}>{description}</p>}
        </div>
        <button
          type="button"
          className="nl-icon-button nl-button--ghost nl-icon-button--md"
          aria-label={t('common.close')}
          onClick={() => ref.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      {children && <div className="nl-dialog-body">{children}</div>}
      {footer && <footer className="nl-dialog-foot">{footer}</footer>}
    </dialog>
  );
}
