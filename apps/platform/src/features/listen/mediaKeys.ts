/**
 * Lock-screen and headset controls. Phones only route media buttons (and show lock-screen
 * controls) to a page that is playing a media element, so a silent looping clip claims the
 * media session; it also tells the browser this page is playing audio with the screen off.
 * The tutor's voice itself plays through Web Audio.
 */
export type MediaKeyActions = { talk: () => void; next: () => void; previous: () => void };

function silentWav(seconds: number) {
  const rate = 8000,
    samples = rate * seconds;
  const bytes = new Uint8Array(44 + samples).fill(128),
    view = new DataView(bytes.buffer);
  const ascii = (at: number, word: string) =>
    [...word].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  ascii(36, 'data');
  view.setUint32(40, samples, true);
  return new Blob([bytes], { type: 'audio/wav' });
}

export class MediaKeys {
  private element: HTMLAudioElement | null = null;
  private url = '';

  /** Must be called from a tap (autoplay rules). */
  async start(title: string, artist: string, actions: MediaKeyActions) {
    if (!this.element) {
      this.url = URL.createObjectURL(silentWav(6));
      this.element = new Audio(this.url);
      this.element.loop = true;
    }
    await this.element.play().catch(() => {});
    const session = navigator.mediaSession;
    if (!session) return;
    session.metadata = new MediaMetadata({ title, artist, album: 'New Learn' });
    session.playbackState = 'playing';
    const set = (action: MediaSessionAction, run: () => void) => {
      try {
        session.setActionHandler(action, run);
      } catch {
        // Not every browser supports every action.
      }
    };
    // A single press on most earbuds is play/pause: here it means "I want to talk".
    set('play', () => {
      session.playbackState = 'playing';
      actions.talk();
    });
    set('pause', () => {
      session.playbackState = 'playing';
      void this.element?.play().catch(() => {});
      actions.talk();
    });
    set('nexttrack', actions.next);
    set('previoustrack', actions.previous);
  }

  update(title: string, artist: string) {
    if (navigator.mediaSession)
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: 'New Learn' });
  }

  stop() {
    this.element?.pause();
    if (navigator.mediaSession) {
      navigator.mediaSession.playbackState = 'none';
      for (const action of ['play', 'pause', 'nexttrack', 'previoustrack'] as const)
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
    }
    if (this.url) URL.revokeObjectURL(this.url);
    this.element = null;
    this.url = '';
  }
}
