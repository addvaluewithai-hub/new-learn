/** A whole-screen wait: a spinner and one line, centred (never stuck in a corner). */
export function Loading({ text }: { text: string }) {
  return (
    <div className="page-loading" role="status">
      <span className="page-spinner" aria-hidden="true" />
      {text}
    </div>
  );
}
