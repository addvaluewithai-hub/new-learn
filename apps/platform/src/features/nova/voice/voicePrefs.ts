import { useEffect, useState } from 'react';

/**
 * The learner's tutor settings: Nova's voice, how slowly it speaks, and a short line about
 * its manner. They stay on this device and travel with every Nova request as `style`; the
 * server checks them again (server/nova/style.ts).
 */
/** Every prebuilt voice Gemini Live offers, under Google's own names. */
export const VOICES = [
  'Zephyr',
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Leda',
  'Orus',
  'Aoede',
  'Callirrhoe',
  'Autonoe',
  'Enceladus',
  'Iapetus',
  'Umbriel',
  'Algieba',
  'Despina',
  'Erinome',
  'Algenib',
  'Rasalgethi',
  'Laomedeia',
  'Achernar',
  'Alnilam',
  'Schedar',
  'Gacrux',
  'Pulcherrima',
  'Achird',
  'Zubenelgenubi',
  'Vindemiatrix',
  'Sadachbia',
  'Sadaltager',
  'Sulafat',
] as const;
export const SPEECH_PACES = [
  { id: 'slowest', label: 'بالراحة خالص' },
  { id: 'slow', label: 'هادي' },
  { id: 'normal', label: 'عادي' },
] as const;
export const PERSONA_MAX = 120;

export type VoicePrefs = {
  voice: (typeof VOICES)[number];
  pace: (typeof SPEECH_PACES)[number]['id'];
  persona: string;
};
const KEY = 'learn.nova.voice';
const DEFAULTS: VoicePrefs = { voice: 'Kore', pace: 'slowest', persona: '' };

export function loadVoicePrefs(): VoicePrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return {
      voice: VOICES.find((v) => v === saved?.voice) ?? DEFAULTS.voice,
      pace: SPEECH_PACES.find((p) => p.id === saved?.pace)?.id ?? DEFAULTS.pace,
      persona: typeof saved?.persona === 'string' ? saved.persona.slice(0, PERSONA_MAX) : '',
    };
  } catch {
    return DEFAULTS;
  }
}

let current: VoicePrefs | null = null;
/** What the next Nova request sends as `style` (the last choice, even if storage is blocked). */
export const voiceStyle = () => (current ??= loadVoicePrefs());

/** Settings state for the settings card; `onSaved` hears every change once it is stored. */
export function useVoicePrefs(onSaved?: (prefs: VoicePrefs) => void) {
  const [prefs, setPrefs] = useState(voiceStyle);
  const [first, setFirst] = useState(true);
  useEffect(() => {
    current = prefs;
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      // Private mode or blocked storage: requests read the defaults again.
    }
    if (first) setFirst(false);
    else onSaved?.(prefs);
    // Only a real change is news to the tutor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs]);
  const change = (next: Partial<VoicePrefs>) => setPrefs((now) => ({ ...now, ...next }));
  return { prefs, change };
}
