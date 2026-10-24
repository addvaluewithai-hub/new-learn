import { HttpError } from '../http';

/** At most this much 16 kHz 16-bit mono speech is checked for the wake word (2.5 s). */
export const WAKE_MAX_BYTES = 16000 * 2 * 2.5;

/** Decodes the client's base64 PCM and wraps it as a WAV file the model can read. */
export function wakeWav(value: unknown) {
  if (typeof value !== 'string' || !value || value.length > Math.ceil(WAKE_MAX_BYTES / 3) * 4)
    throw new HttpError(400, 'الصوت غير صحيح.');
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new HttpError(400, 'الصوت غير صحيح.');
  }
  if (binary.length < 3200 || binary.length % 2) throw new HttpError(400, 'الصوت قصير جدًا.');
  const wav = new Uint8Array(44 + binary.length),
    view = new DataView(wav.buffer);
  const ascii = (at: number, word: string) =>
    [...word].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + binary.length, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, binary.length, true);
  for (let i = 0; i < binary.length; i++) wav[44 + i] = binary.charCodeAt(i);
  let out = '';
  for (let i = 0; i < wav.length; i += 0x8000)
    out += String.fromCharCode(...wav.subarray(i, i + 0x8000));
  return btoa(out);
}

export const wakeSchema = {
  type: 'object',
  properties: { heard: { type: 'string' }, wake: { type: 'boolean' } },
  required: ['heard', 'wake'],
};

export const wakePrompt = (word: string) =>
  `This is a short clip from a learner's microphone while an audio lesson plays (the tutor's voice may leak in). Transcribe what the learner says in "heard". Set "wake" to true only if a person clearly says the wake word «${word}» (or just «نوفا» / "Nova") to call the tutor. Background noise, dishes, water, music, the tutor's own lesson speech or other words alone are false.`;

/** The model's verdict; anything malformed counts as "not called". */
export function wakeVerdict(text: string) {
  try {
    const value = JSON.parse(text);
    return value?.wake === true;
  } catch {
    return false;
  }
}
