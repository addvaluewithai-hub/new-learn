import { useEffect, useRef, useState } from 'react';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/csr/SpeakerHigh';
import { SpeakerSlashIcon } from '@phosphor-icons/react/dist/csr/SpeakerSlash';
import type { ReadingPace } from '@learn/lesson-runtime';
import type { FlowSettings } from './useLessonFlow';
import type { VoicePrefs } from '../voice/voicePrefs';
import { VoiceStyleSettings } from './VoiceStyleSettings';
import './lesson-settings.css';

const PACES: Array<{ value: ReadingPace | null; label: string }> = [
  { value: null, label: 'يدوي' },
  { value: 'slower', label: 'أبطأ' },
  { value: 'normal', label: 'عادي' },
  { value: 'faster', label: 'أسرع' },
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
        aria-label="إعدادات الدرس وصوت Nova"
        data-on={settings.narration || settings.pace ? '' : undefined}
        onClick={() => setOpen(!open)}
      >
        <Icon size={19} aria-hidden="true" />
      </button>
      {open ? (
        <div className="flow-pop" role="dialog" aria-label="طريقة مشي الدرس">
          <label className="flow-row">
            <span>
              <strong>Nova تقرا الدرس</strong>
              <small>بتقرا كل خطوة وتقلب لوحدها، وبتقف عند الأسئلة.</small>
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
              <span>الصوت</span>
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
              <strong id="flow-pace-title">التقليب لوحده</strong>
              <div role="radiogroup" aria-labelledby="flow-pace-title">
                {PACES.map((pace) => (
                  <button
                    key={pace.label}
                    type="button"
                    role="radio"
                    aria-checked={settings.pace === pace.value}
                    onClick={() => onChange({ pace: pace.value })}
                  >
                    {pace.label}
                  </button>
                ))}
              </div>
              <small>الوقت قبل ما الخطوة الجاية تظهر. «يدوي» يعني بزرار التالي.</small>
            </div>
          )}
          <VoiceStyleSettings prefs={voice} onChange={onVoice} />
        </div>
      ) : null}
    </div>
  );
}
