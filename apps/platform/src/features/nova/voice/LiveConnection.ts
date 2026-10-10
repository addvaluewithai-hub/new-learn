export type LiveToken = { token: string; model: string; config: Record<string, unknown> };
export type LiveCallbacks = {
  audio: (data: string, rate: number) => void;
  interrupted: () => void;
  complete: () => void;
  transcript: (role: 'user' | 'assistant', text: string) => void;
  error: (message: string) => void;
  answer: (index: number, choice: number) => unknown;
};
export class LiveConnection {
  private socket: WebSocket | null = null;
  private ready = false;
  private intentional = false;
  private cancelSetup: (() => void) | null = null;
  constructor(private callbacks: LiveCallbacks) {}
  connect(token: LiveToken) {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.token)}`,
      );
      this.socket = socket;
      let settled = false,
        chain = Promise.resolve();
      const timer = window.setTimeout(() => fail('الاتصال اتأخر. جرّب تاني.'), 15000);
      const fail = (message: string) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error(message));
        } else if (!this.intentional) this.callbacks.error(message);
      };
      this.cancelSetup = () => fail('المكالمة اتقفلت.');
      socket.onopen = () =>
        this.send({ setup: { model: `models/${token.model}`, ...token.config } });
      socket.onmessage = (event) => {
        chain = chain
          .then(async () => {
            if (this.intentional) return;
            const message = JSON.parse(
              typeof event.data === 'string' ? event.data : await (event.data as Blob).text(),
            );
            if (message.setupComplete) {
              this.ready = true;
              settled = true;
              clearTimeout(timer);
              resolve();
            }
            if (message.error) {
              fail('تعذّر بدء جلسة Nova.');
              this.close();
              return;
            }
            const content = message.serverContent;
            if (content?.interrupted) this.callbacks.interrupted();
            if (content?.inputTranscription?.text)
              this.callbacks.transcript('user', content.inputTranscription.text);
            if (content?.outputTranscription?.text)
              this.callbacks.transcript('assistant', content.outputTranscription.text);
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/pcm'))
                this.callbacks.audio(
                  part.inlineData.data,
                  Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] ?? 24000),
                );
            }
            for (const call of message.toolCall?.functionCalls ?? []) {
              const result =
                call.name === 'answer_question'
                  ? this.callbacks.answer(call.args?.questionIndex, call.args?.choice)
                  : { error: 'Unknown tool' };
              this.send({
                toolResponse: {
                  functionResponses: [{ id: call.id, name: call.name, response: result }],
                },
              });
            }
            if (content?.turnComplete) this.callbacks.complete();
            if (message.goAway) {
              fail('المكالمة انتهت. تقدر تتصل تاني.');
              this.close();
            }
          })
          .catch(() => fail('تعذّر قراءة رد Nova.'));
      };
      socket.onerror = () => fail('تعذّر الاتصال. راجع الإنترنت وجرّب تاني.');
      socket.onclose = () => {
        this.ready = false;
        clearTimeout(timer);
        if (!this.intentional) fail('المكالمة اتقطعت. جرّب تتصل تاني.');
      };
    });
  }
  private send(value: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(value));
  }
  audio(chunk: string) {
    if (this.ready)
      this.send({ realtimeInput: { audio: { data: chunk, mimeType: 'audio/pcm;rate=16000' } } });
  }
  endAudio() {
    if (this.ready) this.send({ realtimeInput: { audioStreamEnd: true } });
  }
  text(text: string) {
    if (this.ready)
      this.send({
        clientContent: { turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true },
      });
  }
  close() {
    if (this.intentional) return;
    this.intentional = true;
    this.cancelSetup?.();
    this.socket?.close();
    this.socket = null;
    this.ready = false;
  }
}
