import { decodePcm, downsample16k, pcm16 } from './pcm';
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
  constructor(private onIdle: () => void) {
    this.gain.connect(this.context.destination);
    void this.context.resume().catch(() => {});
  }
  setVolume(value: number) {
    this.gain.gain.value = Math.max(0, Math.min(1, value));
  }
  /** `send` gets each 16 kHz PCM chunk (base64), its loudness (RMS, 0..1) and its samples. */
  async capture(send: (chunk: string, level: number, samples: Float32Array) => void) {
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error('المتصفح مش بيدعم الميكروفون هنا. استخدم الشات.');
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
      throw new Error('المكالمة اتقفلت.');
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
