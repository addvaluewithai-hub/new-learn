import { useEffect, useState } from 'react';
import { Card, PillSelect, Segmented, Switch, TextInput, Field } from '../../shared/ui';
import { loadFlow, saveFlow, type FlowSettings } from '../nova/lesson/useLessonFlow';
import { PERSONA_MAX, SPEECH_PACES, VOICES, useVoicePrefs } from '../nova/voice/voicePrefs';

type Pace = 'manual' | 'slower' | 'normal' | 'faster';

/** How lessons run and how Nova sounds. These live on this device, like the lesson's own
 *  settings menu, and the lesson reads them when it opens. */
export function LearningSettings() {
  const [flow, setFlow] = useState<FlowSettings>(loadFlow);
  useEffect(() => saveFlow(flow), [flow]);
  const change = (next: Partial<FlowSettings>) => setFlow((now) => ({ ...now, ...next }));
  const { prefs, change: changeVoice } = useVoicePrefs();
  return (
    <>
      <Card className="settings-card">
        <h2>الدروس</h2>
        <p className="settings-note">بيتحفظ على الجهاز ده لوحده، وبيتطبّق من الدرس الجاي.</p>
        <div className="settings-row">
          <span>الأسئلة</span>
          <Segmented
            label="الأسئلة"
            value={flow.questions}
            onChange={(questions) => change({ questions })}
            options={[
              ['ask', 'اسألني'],
              ['show', 'وريني الإجابة'],
            ]}
          />
        </div>
        <div className="settings-row">
          <span>الدرس بيمشي</span>
          <Segmented<Pace>
            label="الدرس بيمشي"
            value={flow.pace ?? 'manual'}
            onChange={(pace) => change({ pace: pace === 'manual' ? null : pace })}
            options={[
              ['manual', 'لما أدوس التالي'],
              ['slower', 'لوحده بهدوء'],
              ['normal', 'لوحده'],
              ['faster', 'لوحده بسرعة'],
            ]}
          />
        </div>
        <Switch
          checked={flow.narration}
          onChange={(narration) => change({ narration })}
          hint="Nova بتقرأ كل خطوة بصوت."
        >
          الشرح بالصوت
        </Switch>
        <Switch
          checked={flow.handsFree}
          onChange={(handsFree) => change({ handsFree })}
          hint="Nova بتقرأ وإنت بتجاوب بصوتك من غير ما تلمس الشاشة."
        >
          من غير إيدين
        </Switch>
      </Card>
      <Card className="settings-card">
        <h2>Nova</h2>
        <p className="settings-note">بيتحفظ على الجهاز ده لوحده، وبيتطبّق من كلام Nova الجاي.</p>
        <div className="settings-row">
          <PillSelect
            lead="الصوت"
            label="صوت Nova"
            dir="ltr"
            value={prefs.voice}
            onChange={(e) => changeVoice({ voice: e.target.value as (typeof VOICES)[number] })}
            options={VOICES.map((voice) => [voice, voice])}
          />
          <Segmented
            label="سرعة كلام Nova"
            value={prefs.pace}
            onChange={(pace) => changeVoice({ pace })}
            options={SPEECH_PACES.map((pace) => [pace.id, pace.label])}
          />
        </div>
        <Field id="settings-persona" label="تحب Nova تكون إزاي؟">
          <TextInput
            id="settings-persona"
            dir="auto"
            maxLength={PERSONA_MAX}
            placeholder="مثلًا: هادية وصبورة وبتهزر شوية"
            value={prefs.persona}
            onChange={(e) => changeVoice({ persona: e.target.value })}
          />
        </Field>
      </Card>
    </>
  );
}
