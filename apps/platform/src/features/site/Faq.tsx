import './faq.css';

export type FaqItem = { q: string; a: string };

/** Questions and answers as native disclosure rows: no script, keyboard and reader friendly. */
export function Faq({ items, open }: { items: readonly FaqItem[]; open?: number }) {
  return (
    <div className="site-faq">
      {items.map((item, i) => (
        <details key={item.q} open={i === open}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
