import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Arabic belongs in a normal text run, outside KaTeX's left-to-right math fonts. */
export function Formula({ source }: { source: string }) {
  const notes: string[] = [];
  const math = source.replace(/\\text\{([^{}]*[\u0600-\u06ff][^{}]*)\}/g, (_, text) => {
    notes.push(text);
    return '';
  });
  const html = katex.renderToString(math, {
    displayMode: true,
    throwOnError: false,
    trust: false,
    strict: 'ignore',
    output: 'htmlAndMathml',
  });
  return (
    <div
      className="ch8-equation"
      dir="ltr"
      style={{ fontSize: math.length > 120 ? 21 : math.length > 75 ? 26 : 34 }}
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {notes.map((note) => (
        <small key={note} dir="rtl">
          {note}
        </small>
      ))}
    </div>
  );
}
