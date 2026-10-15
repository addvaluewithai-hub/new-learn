import { Fragment } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function MathText({ value, display }: { value: string; display: boolean }) {
  const html = katex.renderToString(value, {
    displayMode: display,
    throwOnError: false,
    trust: false,
    strict: 'ignore',
    output: 'htmlAndMathml',
  });
  return (
    <span
      className={display ? 'bk-equation' : 'bk-inline-math'}
      dir="ltr"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Only bundled, reviewed strings are rendered. Student input is never HTML. */
export function BookText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$|\*\*[^*]+\*\*)/g);
  return (
    <div className="bk-prose" dir={/[\u0600-\u06ff]/.test(text) ? 'rtl' : 'ltr'}>
      {parts.map((part, i) =>
        part.startsWith('$$') ? (
          <MathText key={i} value={part.slice(2, -2)} display />
        ) : part.startsWith('$') ? (
          <MathText key={i} value={part.slice(1, -1)} display={false} />
        ) : part.startsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </div>
  );
}
