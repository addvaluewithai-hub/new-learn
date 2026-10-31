import { useEffect, useState } from 'react';
import type { TextKey } from '../../../i18n';

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
  { id: 'slowest', label: 'nova.voice.paces.slowest' },
  { id: 'slow', label: 'nova.voice.paces.slow' },
  { id: 'normal', label: 'nova.voice.paces.normal' },
] as const satisfies ReadonlyArray<{ id: string; label: TextKey }>;
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
/** The open course's own voice and character (docs/voice-agent.md), set by its lesson page. */
let course: Partial<VoicePrefs> | null = null;
/**
 * What the next Nova request sends as `style`: the learner's choice (even if storage is
 * blocked), with the course's voice and persona on top while one of its lessons is open. The
 * pace stays the learner's: how fast they can follow is theirs to say.
 */
export const voiceStyle = (): VoicePrefs => {
  const mine = (current ??= loadVoicePrefs());
  if (!course) return mine;
  return {
    ...mine,
    ...(course.voice && VOICES.includes(course.voice) ? { voice: course.voice } : {}),
    ...(course.persona ? { persona: course.persona.slice(0, PERSONA_MAX) } : {}),
  };
};
export function setCourseVoice(value: { voice?: string; persona?: string } | null) {
  course = value ? { voice: value.voice as VoicePrefs['voice'], persona: value.persona } : null;
}

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
