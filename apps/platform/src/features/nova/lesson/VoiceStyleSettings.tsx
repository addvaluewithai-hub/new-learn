import { PERSONA_MAX, SPEECH_PACES, VOICES, type VoicePrefs } from '../voice/voicePrefs';
import { useI18n } from '../../../i18n';

/** Nova's voice, how slowly it speaks, and a short line about its manner. */
export function VoiceStyleSettings({
  prefs,
  onChange,
}: {
  prefs: VoicePrefs;
  onChange: (next: Partial<VoicePrefs>) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flow-voice">
      <strong>{t('nova.voiceStyle.title')}</strong>
      <label className="flow-select">
        <span aria-hidden="true">{t('nova.voiceStyle.voice')}</span>
        <select
          aria-label={t('nova.voiceStyle.voice')}
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
      <div className="flow-chips" role="radiogroup" aria-label={t('nova.voiceStyle.pace')}>
        {SPEECH_PACES.map((pace) => (
          <button
            key={pace.id}
            type="button"
            role="radio"
            aria-checked={prefs.pace === pace.id}
            onClick={() => onChange({ pace: pace.id })}
          >
            {t(pace.label)}
          </button>
        ))}
      </div>
      <label className="flow-persona">
        <span>{t('nova.voiceStyle.persona')}</span>
        <input
          type="text"
          dir="auto"
          maxLength={PERSONA_MAX}
          placeholder={t('nova.voiceStyle.personaPlaceholder')}
          value={prefs.persona}
          onChange={(event) => onChange({ persona: event.target.value })}
        />
      </label>
      <small>{t('nova.voiceStyle.applies')}</small>
    </div>
  );
}
