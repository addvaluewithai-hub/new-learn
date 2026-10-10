import { encodePcm, decodePcm } from './pcm';
export class AudioSession {
  private context = new AudioContext({ latencyHint: 'interactive' });
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
    void this.context.resume().catch(() => {});
  }
  async capture(send: (chunk: string) => void) {
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
      if (!this.closed && !this.paused && !this.muted)
        send(encodePcm(event.data, this.context.sampleRate));
    };
    this.source.connect(this.worklet);
    this.worklet.connect(this.context.destination);
  }
  enqueue(data: string, rate = 24000) {
    if (this.closed) return;
    const samples = decodePcm(data),
      buffer = this.context.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    this.active.add(source);
    this.complete = false;
    const at = Math.max(this.context.currentTime + 0.02, this.next);
    this.next = at + buffer.duration;
    source.onended = () => {
      this.active.delete(source);
      if (!this.active.size && this.complete) {
        this.next = 0;
        this.onIdle();
      }
    };
    source.start(at);
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
