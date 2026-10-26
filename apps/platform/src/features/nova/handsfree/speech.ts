/**
 * Turns the always-open microphone into utterances. Each 40 ms chunk is "voice" when the
 * Silero voice detector says so (or, until it loads or if it can't, when it is loud enough).
 * An utterance starts only after about half a second of voice within a short window, so
 * clinks, water and a fan do not count; it keeps one second of audio from before the start
 * (so the first word is not cut) and ends after enough quiet.
 */
export type SpeechEvents = {
  start: (preroll: string[]) => void;
  chunk: (chunk: string) => void;
  end: (spokenMs: number) => void;
};
export type Heard = { level: number; voice: number | null; speaking: boolean };

const CHUNK_MS = 40;
const PREROLL = 25; // 1 s
const WINDOW = 16; // 640 ms
const NEEDED = 12; // 480 ms of voice inside the window

export class SpeechDetector {
  /** Loudness that counts as voice when the voice detector is unavailable. */
  threshold = 0.02;
  /** Voice probability that counts as speech. */
  voiceAt = 0.6;
  /** Quiet time that ends an utterance. */
  endAfterMs = 1300;
  /** The latest chunk, for the diagnostics panel. */
  last: Heard = { level: 0, voice: null, speaking: false };
  private noise = 0.005;
  private before: string[] = [];
  private recent: boolean[] = [];
  private speaking = false;
  private quietMs = 0;
  private spokenMs = 0;
  constructor(private on: SpeechEvents) {}

  get active() {
    return this.speaking;
  }

  /** `voice` is the voice detector's probability, or null when it isn't running. */
  feed(chunk: string, level: number, voice: number | null) {
    // The floor follows the room's background noise slowly (dishes, a fan, running water).
    if (!this.speaking) this.noise = this.noise * 0.98 + Math.min(level, 0.2) * 0.02;
    const voiced =
      voice === null
        ? level > Math.max(this.threshold, this.noise * 3)
        : voice >= this.voiceAt && level > 0.004;
    this.last = { level, voice, speaking: this.speaking };
    if (!this.speaking) {
      this.before.push(chunk);
      if (this.before.length > PREROLL) this.before.shift();
      this.recent.push(voiced);
      if (this.recent.length > WINDOW) this.recent.shift();
      if (this.recent.filter(Boolean).length < NEEDED) return;
      this.speaking = true;
      this.quietMs = 0;
      this.spokenMs = NEEDED * CHUNK_MS;
      const preroll = this.before;
      this.before = [];
      this.recent = [];
      return this.on.start(preroll);
    }
    this.on.chunk(chunk);
    this.spokenMs += CHUNK_MS;
    this.quietMs = voiced ? 0 : this.quietMs + CHUNK_MS;
    if (this.quietMs >= this.endAfterMs) this.finish();
  }

  /** Ends the current utterance now. */
  finish() {
    if (!this.speaking) return;
    this.speaking = false;
    this.on.end(this.spokenMs - this.quietMs);
  }

  reset() {
    this.speaking = false;
    this.before = [];
    this.recent = [];
  }
}
