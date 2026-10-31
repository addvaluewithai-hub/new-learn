import type { ReactNode } from 'react';
import { Button } from './Button';

/**
 * The shape of a page while it loads: a heading and a few rows that shimmer, so the page
 * does not jump when the content arrives. The label is read to screen readers.
 */
export function PageSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div className="nl-skeleton" role="status" aria-live="polite">
      <span className="nl-sr-only">{label}</span>
      <i className="nl-skeleton-title" aria-hidden="true" />
      <i className="nl-skeleton-line" aria-hidden="true" />
      {Array.from({ length: rows }, (_, i) => (
        <i key={i} className="nl-skeleton-card" aria-hidden="true" />
      ))}
    </div>
  );
}

/** Something failed to load: what happened, and a way to try again. */
export function ErrorState({
  message,
  retryLabel,
  onRetry,
  children,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="nl-error-state" role="alert">
      <p>{message}</p>
      {children}
      <Button variant="secondary" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
