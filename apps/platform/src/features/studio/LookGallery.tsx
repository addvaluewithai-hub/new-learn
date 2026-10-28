import { useEffect, useRef, useState } from 'react';
import { AUTO, LOOKS, type Look } from './looks';

/** «٢ الشكل»: every look as a small card with a real picture, in a row that slides sideways.
 *  The looks that suit the topic come first and say so. */
export function LookGallery({
  selected,
  suggested,
  onSelect,
  onPreview,
}: {
  selected: string;
  suggested: string[];
  onSelect: (id: string) => void;
  onPreview: (look: Look) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  // Which ends of the row are showing, so each arrow hides when there is nothing that way.
  const measure = () => {
    const row = track.current;
    if (!row) return;
    const moved = Math.abs(row.scrollLeft);
    setEdges({ start: moved < 8, end: moved + row.clientWidth >= row.scrollWidth - 8 });
  };
  useEffect(measure, [suggested.join()]);
  const looks = [
    AUTO,
    ...suggested.map((id) => LOOKS.find((look) => look.id === id)!),
    ...LOOKS.filter((look) => !suggested.includes(look.id)),
  ];
  // In right-to-left pages the row runs leftwards, so "next" scrolls towards negative x.
  const slide = (next: boolean) => {
    const row = track.current;
    if (!row) return;
    const rtl = getComputedStyle(row).direction === 'rtl';
    const step = row.clientWidth * 0.8 * (next === rtl ? -1 : 1);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollBy({ left: step, behavior: still ? 'auto' : 'smooth' });
  };
  return (
    <div className="looks-slider">
      <div
        className="looks"
        ref={track}
        role="radiogroup"
        aria-label="شكل الدرس"
        onScroll={measure}
      >
        {looks.map((look) => {
          const on = look.id === selected;
          const fits = suggested.includes(look.id);
          return (
            <div key={look.id} className={`look${on ? ' on' : ''}`} data-look={look.id}>
              <label className="look-pick">
                <input
                  type="radio"
                  name="look"
                  value={look.id}
                  checked={on}
                  onChange={() => onSelect(look.id)}
                />
                {look.id === 'auto' ? (
                  <span className="look-art look-auto" aria-hidden="true">
                    ✦
                  </span>
                ) : (
                  <img className="look-art" src={`/styles/${look.id}.webp`} alt="" loading="lazy" />
                )}
                <span className="look-name">{look.name}</span>
                <span className="look-line">{look.line}</span>
                {fits && <span className="look-fits">مناسب لموضوعك</span>}
              </label>
              {look.board && (
                <button type="button" className="look-try" onClick={() => onPreview(look)}>
                  اتفرّج
                  <span className="nl-sr-only"> على {look.name}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="looks-arrow prev"
        hidden={edges.start}
        onClick={() => slide(false)}
      >
        <span aria-hidden="true">›</span>
        <span className="nl-sr-only">الأشكال اللي قبل</span>
      </button>
      <button
        type="button"
        className="looks-arrow next"
        hidden={edges.end}
        onClick={() => slide(true)}
      >
        <span aria-hidden="true">‹</span>
        <span className="nl-sr-only">أشكال تانية</span>
      </button>
    </div>
  );
}
