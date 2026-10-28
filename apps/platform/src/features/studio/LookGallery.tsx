import { AUTO, LOOKS, type Look } from './looks';

/** «٢ الشكل»: every look as a card with a real picture; the ones that suit the topic say so. */
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
  return (
    <div className="looks" role="radiogroup" aria-label="شكل الدرس">
      {[AUTO, ...LOOKS].map((look) => {
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
                <span className="sr-only"> على {look.name}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
