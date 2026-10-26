/**
 * Silero VAD v5 (MIT) in the browser through onnxruntime-web: is this a human voice, frame by
 * frame? Unlike loudness it tells speech from running water, a fan or clinking dishes. It is
 * loaded only in listen mode (WebAssembly + a 2.3 MB model, cached by the browser after the
 * first visit) and fed from the microphone stream the lesson already has.
 */
import type { InferenceSession, Tensor } from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import modelUrl from '@ricky0123/vad-web/dist/silero_vad_v5.onnx?url';

const FRAME = 512; // 32 ms at 16 kHz, the size Silero v5 expects

export class VoiceDetector {
  /** Probability (0..1) that the latest frame is speech. */
  probability = 0;
  private session: InferenceSession | null = null;
  private ort: typeof import('onnxruntime-web/wasm') | null = null;
  private state: Tensor | null = null;
  private pending = new Float32Array(0);
  private busy: Promise<void> = Promise.resolve();
  private failed = false;

  /** True once the model runs; until then (or if it can't load) callers fall back to loudness. */
  get ready() {
    return Boolean(this.session) && !this.failed;
  }

  async load() {
    try {
      const ort = await import('onnxruntime-web/wasm');
      ort.env.wasm.wasmPaths = { wasm: wasmUrl };
      ort.env.wasm.numThreads = 1; // no cross-origin isolation needed
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
      });
      this.ort = ort;
      this.reset();
    } catch {
      this.failed = true;
    }
  }

  reset() {
    if (!this.ort) return;
    this.state = new this.ort.Tensor('float32', new Float32Array(2 * 128), [2, 1, 128]);
    this.pending = new Float32Array(0);
    this.probability = 0;
  }

  /** Feeds 16 kHz samples; frames are scored in order, a few milliseconds each. */
  push(samples: Float32Array) {
    if (!this.ready) return;
    const joined = new Float32Array(this.pending.length + samples.length);
    joined.set(this.pending);
    joined.set(samples, this.pending.length);
    let offset = 0;
    for (; offset + FRAME <= joined.length; offset += FRAME) {
      const frame = joined.slice(offset, offset + FRAME);
      this.busy = this.busy.then(() => this.score(frame));
    }
    this.pending = joined.slice(offset);
  }

  private async score(frame: Float32Array) {
    const ort = this.ort,
      session = this.session;
    if (!ort || !session || !this.state) return;
    try {
      const result = await session.run({
        input: new ort.Tensor('float32', frame, [1, FRAME]),
        state: this.state,
        sr: new ort.Tensor('int64', BigInt64Array.from([16000n]), []),
      });
      this.state = result.stateN as Tensor;
      this.probability = (result.output.data as Float32Array)[0];
    } catch {
      this.failed = true;
    }
  }
}
