import type { CourseVoice } from '../db/authoring';
import { HttpError } from '../http';
import { PACES, PERSONA_MAX, VOICES } from '../nova/style';

// The course's voice and character (docs/voice-agent.md): a teacher (or their AI) picks a
// Gemini voice, a pace and a persona line; Nova narrates and answers in it for every learner
// of that course. Null means the learner's own Nova settings apply.

/** Checked input for a course's voice: undefined leaves it, null clears it. */
export function courseVoiceInput(value: unknown): CourseVoice | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  const voice = VOICES.find((name) => name === v?.voice);
  if (!v || !voice) throw HttpError.plain(400, `voice.voice: one of ${VOICES.join(', ')}`);
  const pace = PACES.find((p) => p === v.pace) ?? 'normal';
  const persona =
    typeof v.persona === 'string'
      ? v.persona
          .replace(/[\u0000-\u001f\u007f«»]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
  if (persona.length > PERSONA_MAX)
    throw HttpError.plain(400, `voice.persona: up to ${PERSONA_MAX} characters`);
  return { voice, pace, persona };
}
