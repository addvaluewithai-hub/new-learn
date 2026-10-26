/** Words of a transcript, ignoring Arabic spelling variants, diacritics and punctuation. */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // diacritics and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
