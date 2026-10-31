import type { FlowSettings } from '../lesson/useLessonFlow';
import { WAKE_WORD } from '../lesson/useLessonFlow';
import { useI18n } from '../../../i18n';

/** Audio mode for any lesson: same lesson, the screen may be off, answers by voice. */
export function HandsFreeSettings({
  settings,
  onChange,
}: {
  settings: FlowSettings;
  onChange: (next: Partial<FlowSettings>) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flow-handsfree">
      <label className="flow-row">
        <span>
          <strong>{t('nova.handsFree.title')}</strong>
          <small>{t('nova.handsFree.hint')}</small>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="flow-switch"
          checked={settings.handsFree}
          onChange={(event) =>
            onChange(
              event.target.checked ? { handsFree: true, narration: true } : { handsFree: false },
            )
          }
        />
      </label>
      {settings.handsFree ? (
        <>
          <label className="flow-field">
            <span>{t('nova.handsFree.wakeWord')}</span>
            <input
              type="text"
              maxLength={30}
              value={settings.wakeWord}
              onChange={(event) => onChange({ wakeWord: event.target.value })}
              onBlur={(event) => !event.target.value.trim() && onChange({ wakeWord: WAKE_WORD })}
            />
            <small>{t('nova.handsFree.wakeWordHint')}</small>
          </label>
          <label className="flow-row">
            <span>
              <strong>{t('nova.handsFree.noisy')}</strong>
              <small>{t('nova.handsFree.noisyHint')}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="flow-switch"
              checked={settings.noisy}
              onChange={(event) => onChange({ noisy: event.target.checked })}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}
