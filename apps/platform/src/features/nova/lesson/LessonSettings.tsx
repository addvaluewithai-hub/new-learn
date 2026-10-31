import { useEffect, useRef, useState } from 'react';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/csr/SpeakerHigh';
import { SpeakerSlashIcon } from '@phosphor-icons/react/dist/csr/SpeakerSlash';
import type { QuestionMode, ReadingPace } from '@learn/lesson-runtime';
import type { FlowSettings } from './useLessonFlow';
import type { VoicePrefs } from '../voice/voicePrefs';
import { VoiceStyleSettings } from './VoiceStyleSettings';
import { HandsFreeSettings } from '../handsfree/HandsFreeSettings';
import { useI18n, type TextKey } from '../../../i18n';
import './lesson-settings.css';

const PACES: Array<{ value: ReadingPace | null; label: TextKey }> = [
  { value: null, label: 'nova.lessonSettings.paces.manual' },
  { value: 'slower', label: 'nova.lessonSettings.paces.slower' },
  { value: 'normal', label: 'nova.lessonSettings.paces.normal' },
  { value: 'faster', label: 'nova.lessonSettings.paces.faster' },
];

const QUESTIONS: Array<{ value: QuestionMode; label: TextKey }> = [
  { value: 'ask', label: 'nova.lessonSettings.questionModes.ask' },
  { value: 'show', label: 'nova.lessonSettings.questionModes.show' },
];

/** How the lesson moves (Nova reading aloud, or a reading pace) and how Nova sounds. */
export function LessonSettings({
  settings,
  onChange,
  voice,
  onVoice,
}: {
  settings: FlowSettings;
  onChange: (next: Partial<FlowSettings>) => void;
  voice: VoicePrefs;
  onVoice: (next: Partial<VoicePrefs>) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    addEventListener('pointerdown', away);
    addEventListener('keydown', escape);
    return () => {
      removeEventListener('pointerdown', away);
      removeEventListener('keydown', escape);
    };
  }, [open]);
  const Icon = settings.narration ? SpeakerHighIcon : SpeakerSlashIcon;
  return (
    <div className="flow-settings" ref={box}>
      <button
        type="button"
        className="flow-settings-button"
        aria-expanded={open}
        aria-label={t('nova.lessonSettings.label')}
        data-on={settings.narration || settings.pace ? '' : undefined}
        onClick={() => setOpen(!open)}
      >
        <Icon size={19} aria-hidden="true" />
      </button>
      {open ? (
        <div className="flow-pop" role="dialog" aria-label={t('nova.lessonSettings.label')}>
          <label className="flow-row">
            <span>
              <strong>{t('nova.lessonSettings.narration')}</strong>
              <small>{t('nova.lessonSettings.narrationHint')}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="flow-switch"
              checked={settings.narration}
              onChange={(event) => onChange({ narration: event.target.checked })}
            />
          </label>
          {settings.narration ? (
            <label className="flow-volume">
              <span>{t('nova.lessonSettings.volume')}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(event) => onChange({ volume: Number(event.target.value) })}
              />
            </label>
          ) : (
            <div className="flow-pace">
              <strong id="flow-pace-title">{t('nova.lessonSettings.autoTurn')}</strong>
              <div role="radiogroup" aria-labelledby="flow-pace-title">
                {PACES.map((pace) => (
                  <button
                    key={pace.label}
                    type="button"
                    role="radio"
                    aria-checked={settings.pace === pace.value}
                    onClick={() => onChange({ pace: pace.value })}
                  >
                    {t(pace.label)}
                  </button>
                ))}
              </div>
              <small>{t('nova.lessonSettings.paceHint')}</small>
            </div>
          )}
          <div className="flow-pace">
            <strong id="flow-questions-title">{t('nova.lessonSettings.questions')}</strong>
            <div role="radiogroup" aria-labelledby="flow-questions-title">
              {QUESTIONS.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={settings.questions === mode.value}
                  onClick={() => onChange({ questions: mode.value })}
                >
                  {t(mode.label)}
                </button>
              ))}
            </div>
            <small>{t('nova.lessonSettings.questionsHint')}</small>
          </div>
          <HandsFreeSettings settings={settings} onChange={onChange} />
          <VoiceStyleSettings prefs={voice} onChange={onVoice} />
        </div>
      ) : null}
    </div>
  );
}
