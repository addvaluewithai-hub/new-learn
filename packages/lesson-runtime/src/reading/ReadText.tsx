/** Any Arabic letter makes a line right-to-left, even when it opens with an English term. */
export const textDirection = (text: string) => (/[؀-ۿ]/.test(text) ? 'rtl' : 'ltr');

/** Written lesson text: `$…$` marks symbols, kept left-to-right inside Arabic. */
export function ReadText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\$([^$]+)\$/).map((part, i) =>
        i % 2 ? (
          <bdi key={i} dir="ltr" className="reading-math">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}
