// Did the voice say the line? The recognised text is compared with the script after
// normalising (align.mjs): the share of script words found in order. Clips below the bar are
// generated again once with a stronger instruction; still below, they are kept but flagged for
// the teacher (never silently dropped, never silently wrong).
import { norm } from './align.mjs';

export const QUALITY_BAR = 0.8;

/** 0..1: how much of the script the transcript contains, in order. */
export function agreement(scriptText, heardText) {
  const a = scriptText.split(/\s+/).map(norm).filter(Boolean);
  const b = heardText.split(/\s+/).map(norm).filter(Boolean);
  if (!a.length) return 1;
  if (!b.length) return 0;
  let i = 0,
    j = 0,
    hits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j] || (a[i].length >= 3 && (a[i].includes(b[j]) || b[j].includes(a[i])))) {
      hits++;
      i++;
      j++;
    } else if (b.length - j > a.length - i) j++;
    else i++;
  }
  return hits / a.length;
}
