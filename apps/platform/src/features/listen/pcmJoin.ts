/** Joins base64 PCM chunks into one base64 clip, keeping at most `maxBytes` from the start. */
export function joinPcm(chunks: string[], maxBytes: number) {
  const parts: string[] = [];
  let size = 0;
  for (const chunk of chunks) {
    if (size >= maxBytes) break;
    const binary = atob(chunk).slice(0, maxBytes - size);
    parts.push(binary);
    size += binary.length;
  }
  const joined = parts.join('');
  return btoa(joined.length % 2 ? joined.slice(0, -1) : joined);
}

/** What the learner actually heard: the tutor's words up to the audio that has started. */
export class HeardTracker {
  private text = '';
  private marks: Array<{ at: number; length: number }> = [];
  said(text: string) {
    this.text += text;
  }
  /** A chunk of the tutor's audio was queued to start `startsIn` seconds from now. */
  queued(startsIn: number) {
    this.marks.push({ at: performance.now() + startsIn * 1000, length: this.text.length });
  }
  heard(now = performance.now()) {
    const started = this.marks.filter((mark) => mark.at <= now);
    const length = started.length ? started[started.length - 1].length : 0;
    return this.text.slice(0, length).slice(-220).trim();
  }
  reset() {
    this.text = '';
    this.marks = [];
  }
}
