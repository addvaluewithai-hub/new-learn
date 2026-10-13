import { PERSONA_MAX, SPEECH_PACES, VOICES, type VoicePrefs } from '../voice/voicePrefs';

/** Nova's voice, how slowly it speaks, and a short line about its manner. */
export function VoiceStyleSettings({
  prefs,
  onChange,
}: {
  prefs: VoicePrefs;
  onChange: (next: Partial<VoicePrefs>) => void;
}) {
  return (
    <div className="flow-voice">
      <strong>صوت Nova</strong>
      <label className="flow-select">
        <span aria-hidden="true">الصوت</span>
        <select
          aria-label="الصوت"
          dir="ltr"
          value={prefs.voice}
          onChange={(event) => onChange({ voice: event.target.value as VoicePrefs['voice'] })}
        >
          {VOICES.map((voice) => (
            <option key={voice} value={voice}>
              {voice}
            </option>
          ))}
        </select>
      </label>
      <div className="flow-chips" role="radiogroup" aria-label="سرعة الكلام">
        {SPEECH_PACES.map((pace) => (
          <button
            key={pace.id}
            type="button"
            role="radio"
            aria-checked={prefs.pace === pace.id}
            onClick={() => onChange({ pace: pace.id })}
          >
            {pace.label}
          </button>
        ))}
      </div>
      <label className="flow-persona">
        <span>تحب Nova تكون إزاي؟</span>
        <input
          type="text"
          dir="auto"
          maxLength={PERSONA_MAX}
          placeholder="مثلًا: هادية وصبورة وبتهزر شوية"
          value={prefs.persona}
          onChange={(event) => onChange({ persona: event.target.value })}
        />
      </label>
      <small>بيتطبّق من كلام Nova الجاي.</small>
    </div>
  );
}
