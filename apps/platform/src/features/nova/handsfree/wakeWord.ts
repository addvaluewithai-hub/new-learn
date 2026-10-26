import { api } from '../../../shared/api';
import { joinPcm } from './pcmJoin';

const WAKE_CHUNKS = 50; // 2 s of 40 ms chunks
const WAKE_BYTES = 16000 * 2 * 2.4;

/**
 * While the tutor talks, each thing the learner says is a candidate wake call. The first two
 * seconds go to the server, which says whether the wake word was said; meanwhile the audio
 * keeps collecting, so on a "yes" the whole utterance (wake word + question) reaches the tutor.
 * One check at a time, at most one per 1.5 s; noise, dishes and short clinks never get sent.
 */
export class WakeWord {
  private clip: { chunks: string[]; checking: boolean } | null = null;
  private last = 0;
  constructor(
    private word: () => string,
    private still: () => boolean,
    private called: (chunks: string[]) => void,
  ) {}

  get busy() {
    return Boolean(this.clip);
  }
  start(preroll: string[]) {
    if (!this.clip) this.clip = { chunks: [...preroll], checking: false };
  }
  chunk(chunk: string) {
    const clip = this.clip;
    if (!clip) return;
    clip.chunks.push(chunk);
    if (!clip.checking && clip.chunks.length >= WAKE_CHUNKS) void this.check(clip);
  }
  end(spokenMs: number) {
    const clip = this.clip;
    if (!clip || clip.checking) return;
    if (spokenMs >= 400) void this.check(clip);
    else this.clip = null;
  }
  reset() {
    this.clip = null;
  }

  private async check(clip: NonNullable<WakeWord['clip']>) {
    if (performance.now() - this.last < 1500) return void (this.clip = null);
    clip.checking = true;
    this.last = performance.now();
    let called = false;
    try {
      const result = await api<{ wake: boolean }>('/nova/wake', {
        word: this.word(),
        audio: joinPcm(clip.chunks, WAKE_BYTES),
      });
      called = result.wake;
    } catch {
      called = false;
    }
    if (this.clip !== clip) return;
    this.clip = null;
    if (called && this.still()) this.called(clip.chunks);
  }
}
