import type { FlowSettings } from '../lesson/useLessonFlow';
import { WAKE_WORD } from '../lesson/useLessonFlow';

/** Audio mode for any lesson: same lesson, the screen may be off, answers by voice. */
export function HandsFreeSettings({
  settings,
  onChange,
}: {
  settings: FlowSettings;
  onChange: (next: Partial<FlowSettings>) => void;
}) {
  return (
    <div className="flow-handsfree">
      <label className="flow-row">
        <span>
          <strong>وضع الاستماع (من غير شاشة)</strong>
          <small>
            Nova بتقرا الدرس، وبترد على الأسئلة بصوتك من غير ما تلمس الموبايل. تقدر تقفل الشاشة.
          </small>
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
            <span>كلمة النداء</span>
            <input
              type="text"
              maxLength={30}
              value={settings.wakeWord}
              onChange={(event) => onChange({ wakeWord: event.target.value })}
              onBlur={(event) => !event.target.value.trim() && onChange({ wakeWord: WAKE_WORD })}
            />
            <small>قولها وبعدها سؤالك عشان تقاطع Nova وهي بتقرا، أو دوس زرار السماعة مرة.</small>
          </label>
          <label className="flow-row">
            <span>
              <strong>مكان فيه دوشة</strong>
              <small>Nova تستنى ردّك بعد كلمة النداء أو زرار السماعة بس.</small>
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
