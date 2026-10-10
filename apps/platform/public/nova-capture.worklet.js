class NovaCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = [];
    this.size = 0;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    this.samples.push(new Float32Array(channel));
    this.size += channel.length;
    if (this.size >= sampleRate * 0.04) {
      const merged = new Float32Array(this.size);
      let offset = 0;
      for (const part of this.samples) {
        merged.set(part, offset);
        offset += part.length;
      }
      this.port.postMessage(merged, [merged.buffer]);
      this.samples = [];
      this.size = 0;
    }
    return true;
  }
}
registerProcessor('nova-capture', NovaCapture);
