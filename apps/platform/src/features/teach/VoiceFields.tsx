import { Field } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { PERSONA_MAX, SPEECH_PACES, VOICES } from '../nova/voice/voicePrefs';
import type { CourseVoice } from './types';

const DEFAULT: CourseVoice = { voice: 'Kore', pace: 'normal', persona: '' };

/**
 * The course's own voice and character (docs/voice-agent.md): Nova narrates and answers every
 * learner of this course with this voice and persona. Off, learners keep their own settings.
 */
export function VoiceFields({
  value,
  onChange,
}: {
  value: CourseVoice | null;
  onChange: (next: CourseVoice | null) => void;
}) {
  const { t } = useI18n();
  const on = value !== null;
  return (
    <section className="teach-voice" aria-labelledby="course-voice-title">
      <div className="teach-voice-head">
        <h2 id="course-voice-title">{t('teach.voice.title')}</h2>
        <label className="teach-voice-switch">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => onChange(e.target.checked ? DEFAULT : null)}
          />
          <span>{t('teach.voice.own')}</span>
        </label>
      </div>
      <p className="teach-note">{t(on ? 'teach.voice.lead' : 'teach.voice.default')}</p>
      {on && (
        <div className="teach-fields">
          <Field id="course-voice" label={t('teach.voice.voice')}>
            <select
              id="course-voice"
              className="teach-select"
              dir="ltr"
              value={value.voice}
              onChange={(e) => onChange({ ...value, voice: e.target.value })}
            >
              {VOICES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field id="course-pace" label={t('teach.voice.pace')}>
            <select
              id="course-pace"
              className="teach-select"
              value={value.pace}
              onChange={(e) => onChange({ ...value, pace: e.target.value })}
            >
              {SPEECH_PACES.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.label)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="course-persona"
            label={t('teach.voice.persona')}
            hint={t('teach.voice.personaHint')}
          >
            <input
              id="course-persona"
              className="nl-input"
              type="text"
              dir="auto"
              maxLength={PERSONA_MAX}
              placeholder={t('teach.voice.personaPlaceholder')}
              value={value.persona}
              onChange={(e) => onChange({ ...value, persona: e.target.value })}
            />
          </Field>
        </div>
      )}
    </section>
  );
}
