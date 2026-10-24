/**
 * A small loudness-based speech detector for the always-open microphone in listen mode.
 * It keeps ~0.5 s of audio before speech starts (so the first word is not cut), reports
 * when speech starts, every chunk while it lasts, and when the learner has been quiet long
 * enough. It knows nothing about words: the wake word is checked elsewhere.
 */
export type SpeechEvents = {
  start: (preroll: string[]) => void;
  chunk: (chunk: string) => void;
  end: (spokenMs: number) => void;
};

const CHUNK_MS = 40;
const PREROLL = 12;

export class SpeechDetector {
  /** Loudness that counts as voice; raised while the tutor's voice may leak into the mic. */
  threshold = 0.02;
  /** Quiet time that ends an utterance. */
  endAfterMs = 1300;
  private noise = 0.005;
  private before: string[] = [];
  private speaking = false;
  private loud = 0;
  private quietMs = 0;
  private spokenMs = 0;
  constructor(private on: SpeechEvents) {}

  get active() {
    return this.speaking;
  }

  feed(chunk: string, level: number) {
    // The floor follows the room's background noise slowly (dishes, a fan, running water).
    if (!this.speaking) this.noise = this.noise * 0.98 + Math.min(level, 0.2) * 0.02;
    const voice = level > Math.max(this.threshold, this.noise * 3);
    if (!this.speaking) {
      this.before.push(chunk);
      if (this.before.length > PREROLL) this.before.shift();
      this.loud = voice ? this.loud + 1 : 0;
      // Three loud chunks in a row (120 ms) is speech, not a clink.
      if (this.loud >= 3) {
        this.speaking = true;
        this.quietMs = 0;
        this.spokenMs = this.loud * CHUNK_MS;
        const preroll = this.before;
        this.before = [];
        this.on.start(preroll);
      }
      return;
    }
    this.on.chunk(chunk);
    this.spokenMs += CHUNK_MS;
    this.quietMs = voice ? 0 : this.quietMs + CHUNK_MS;
    if (this.quietMs >= this.endAfterMs) this.finish();
  }

  /** Ends the current utterance now (e.g. it ran too long). */
  finish() {
    if (!this.speaking) return;
    this.speaking = false;
    this.loud = 0;
    this.on.end(this.spokenMs - this.quietMs);
  }

  reset() {
    this.speaking = false;
    this.loud = 0;
    this.before = [];
  }
}
