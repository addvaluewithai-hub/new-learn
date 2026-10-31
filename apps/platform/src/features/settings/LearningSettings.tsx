import { useEffect, useState } from 'react';
import { Card, PillSelect, Segmented, Switch, TextInput, Field } from '../../shared/ui';
import { loadFlow, saveFlow, type FlowSettings } from '../nova/lesson/useLessonFlow';
import { PERSONA_MAX, SPEECH_PACES, VOICES, useVoicePrefs } from '../nova/voice/voicePrefs';
import { useI18n } from '../../i18n';
import { LanguagePicker } from '../../i18n/LanguagePicker';

type Pace = 'manual' | 'slower' | 'normal' | 'faster';

/** How lessons run and how Nova sounds. These live on this device, like the lesson's own
 *  settings menu, and the lesson reads them when it opens. */
export function LearningSettings() {
  const [flow, setFlow] = useState<FlowSettings>(loadFlow);
  useEffect(() => saveFlow(flow), [flow]);
  const change = (next: Partial<FlowSettings>) => setFlow((now) => ({ ...now, ...next }));
  const { prefs, change: changeVoice } = useVoicePrefs();
  const { t } = useI18n();
  return (
    <>
      <Card className="settings-card">
        <h2>{t('common.language')}</h2>
        <p className="settings-note">{t('settings.language.hint')}</p>
        <div className="settings-row">
          <LanguagePicker />
        </div>
      </Card>
      <Card className="settings-card">
        <h2>{t('settings.lessons.title')}</h2>
        <p className="settings-note">{t('settings.lessons.note')}</p>
        <div className="settings-row">
          <span>{t('settings.lessons.questions')}</span>
          <Segmented
            label={t('settings.lessons.questions')}
            value={flow.questions}
            onChange={(questions) => change({ questions })}
            options={[
              ['ask', t('settings.lessons.ask')],
              ['show', t('settings.lessons.show')],
            ]}
          />
        </div>
        <div className="settings-row">
          <span>{t('settings.lessons.pace')}</span>
          <PillSelect
            label={t('settings.lessons.pace')}
            value={flow.pace ?? 'manual'}
            onChange={(e) => {
              const pace = e.target.value as Pace;
              change({ pace: pace === 'manual' ? null : pace });
            }}
            options={[
              ['manual', t('settings.lessons.paceManual')],
              ['slower', t('settings.lessons.paceSlower')],
              ['normal', t('settings.lessons.paceNormal')],
              ['faster', t('settings.lessons.paceFaster')],
            ]}
          />
        </div>
        <Switch
          checked={flow.narration}
          onChange={(narration) => change({ narration })}
          hint={t('settings.lessons.narrationHint')}
        >
          {t('settings.lessons.narration')}
        </Switch>
        <Switch
          checked={flow.handsFree}
          onChange={(handsFree) => change({ handsFree })}
          hint={t('settings.lessons.handsFreeHint')}
        >
          {t('settings.lessons.handsFree')}
        </Switch>
      </Card>
      <Card className="settings-card">
        <h2>{t('settings.nova.title')}</h2>
        <p className="settings-note">{t('settings.nova.note')}</p>
        <div className="settings-row">
          <PillSelect
            lead={t('settings.nova.voice')}
            label={t('settings.nova.voiceLabel')}
            dir="ltr"
            value={prefs.voice}
            onChange={(e) => changeVoice({ voice: e.target.value as (typeof VOICES)[number] })}
            options={VOICES.map((voice) => [voice, voice])}
          />
          <Segmented
            label={t('settings.nova.paceLabel')}
            value={prefs.pace}
            onChange={(pace) => changeVoice({ pace })}
            options={SPEECH_PACES.map((pace) => [pace.id, t(pace.label)])}
          />
        </div>
        <Field id="settings-persona" label={t('settings.nova.persona')}>
          <TextInput
            id="settings-persona"
            dir="auto"
            maxLength={PERSONA_MAX}
            placeholder={t('settings.nova.personaPlaceholder')}
            value={prefs.persona}
            onChange={(e) => changeVoice({ persona: e.target.value })}
          />
        </Field>
      </Card>
    </>
  );
}
