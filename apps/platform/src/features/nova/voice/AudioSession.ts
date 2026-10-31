import { decodePcm, downsample16k, pcm16 } from './pcm';
import { t } from '../../../i18n';
export class AudioSession {
  private context = new AudioContext({ latencyHint: 'interactive' });
  private gain = this.context.createGain();
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private active = new Set<AudioBufferSourceNode>();
  private next = 0;
  private closed = false;
  private muted = false;
  private paused = false;
  private complete = false;
  private volume = 1;
  private fading = false;
  constructor(private onIdle: () => void) {
    this.gain.connect(this.context.destination);
    void this.context.resume().catch(() => {});
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (!this.fading) this.gain.gain.value = this.volume;
  }
  /**
   * Stop what is playing with a short fade (the learner took the floor), instead of a cut.
   * Only what is playing now goes; a reply that arrives after the fade plays at full volume.
   */
  fadeOut(seconds = 0.25) {
    if (this.closed || !this.active.size) return;
    const doomed = [...this.active];
    const g = this.gain.gain;
    const now = this.context.currentTime;
    this.fading = true;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + seconds);
    this.next = 0;
    this.complete = false;
    window.setTimeout(() => {
      for (const source of doomed) {
        source.onended = null;
        try {
          source.stop();
        } catch {
          // already ended
        }
        source.disconnect();
        this.active.delete(source);
      }
      this.fading = false;
      g.cancelScheduledValues(this.context.currentTime);
      g.setValueAtTime(this.volume, this.context.currentTime);
    }, seconds * 1000);
  }
  /** `send` gets each 16 kHz PCM chunk (base64), its loudness (RMS, 0..1) and its samples. */
  async capture(send: (chunk: string, level: number, samples: Float32Array) => void) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error(t('nova.voice.noMic'));
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    if (this.closed) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error(t('nova.voice.closed'));
    }
    this.stream = stream;
    await this.context.audioWorklet.addModule('/nova-capture.worklet.js');
    if (this.closed) return;
    this.source = this.context.createMediaStreamSource(stream);
    this.worklet = new AudioWorkletNode(this.context, 'nova-capture');
    this.worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (this.closed || this.paused || this.muted) return;
      let sum = 0;
      for (const sample of event.data) sum += sample * sample;
      const samples = downsample16k(event.data, this.context.sampleRate);
      send(pcm16(samples), Math.sqrt(sum / event.data.length), samples);
    };
    this.source.connect(this.worklet);
    this.worklet.connect(this.context.destination);
  }
  /** Queue a chunk; returns how many seconds from now it starts playing. */
  enqueue(data: string, rate = 24000) {
    if (this.closed) return 0;
    const samples = decodePcm(data),
      buffer = this.context.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    this.active.add(source);
    this.complete = false;
    // A new reply (or a stall) starts with a short cushion, so a slow network doesn't make
    // the voice stutter: the next chunks usually arrive while this one plays.
    const starting = this.next <= this.context.currentTime;
    const at = Math.max(this.context.currentTime + (starting ? 0.25 : 0.02), this.next);
    this.next = at + buffer.duration;
    source.onended = () => {
      this.active.delete(source);
      if (!this.active.size && this.complete) {
        this.next = 0;
        this.onIdle();
      }
    };
    source.start(at);
    return at - this.context.currentTime;
  }
  /** Seconds until the audio received so far has finished playing. */
  get endsIn() {
    return Math.max(0, this.next - this.context.currentTime);
  }
  get speaking() {
    return this.active.size > 0;
  }
  finish() {
    this.complete = true;
    if (!this.active.size) this.onIdle();
  }
  interrupt() {
    // A fade is already taking what plays now; the rest stops at once.
    for (const source of this.active) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    this.active.clear();
    this.next = 0;
    this.complete = false;
  }
  setMuted(value: boolean) {
    this.muted = value;
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !value && !this.paused;
    });
  }
  async setPaused(value: boolean) {
    this.paused = value;
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !value && !this.muted;
    });
    if (value) await this.context.suspend();
    else await this.context.resume();
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.interrupt();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.source?.disconnect();
    this.worklet?.disconnect();
    void this.context.close().catch(() => {});
  }
}
