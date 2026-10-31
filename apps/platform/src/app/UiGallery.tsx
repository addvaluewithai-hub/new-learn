import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Chip,
  ChoiceCard,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  PillSelect,
  Segmented,
  Spinner,
  Switch,
  TextArea,
  TextInput,
} from '../shared/ui';
import { UiTokens } from './UiTokens';
import '../shared/platform.css';
import './ui-gallery.css';
import { useI18n, type TextKey } from '../i18n';

const CHIPS: Array<[string, TextKey]> = [
  ['story', 'ui.choices.story'],
  ['steps', 'ui.choices.steps'],
  ['examples', 'ui.choices.examples'],
];

/** `?preview=ui`: every token and shared part on one page (docs/design-system.md). Change a
 *  token or a part, and this page and every screen built from it change together. */
export default function UiGallery() {
  const [dialog, setDialog] = useState(false);
  const [on, setOn] = useState(true);
  const [chips, setChips] = useState(['story']);
  const [pace, setPace] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [who, setWho] = useState('me');
  const [name, setName] = useState('');
  const { t, dir } = useI18n();
  const toggle = (id: string) =>
    setChips((now) => (now.includes(id) ? now.filter((c) => c !== id) : [...now, id]));
  return (
    <main className="platform-ui ui-gallery" dir={dir}>
      <header className="ui-head">
        <span className="eyebrow">New Learn</span>
        <h1>{t('ui.head.title')}</h1>
        <p>{t('ui.head.lead')}</p>
      </header>
      <UiTokens />
      <section className="ui-section" aria-labelledby="ui-buttons">
        <h2 id="ui-buttons">{t('ui.buttons.title')}</h2>
        <div className="ui-row">
          <Button>{t('ui.buttons.build')}</Button>
          <Button variant="secondary">{t('ui.buttons.openLesson')}</Button>
          <Button variant="ghost">{t('ui.buttons.skip')}</Button>
          <Button variant="danger">{t('ui.buttons.deleteDraft')}</Button>
          <Button disabled>{t('ui.buttons.unavailable')}</Button>
        </div>
        <div className="ui-row ui-dark">
          <Button variant="accent" size="lg">
            {t('ui.buttons.tryFree')}
          </Button>
          <ButtonLink variant="secondary" href="?preview=demos">
            {t('ui.buttons.seeDemos')}
          </ButtonLink>
        </div>
        <div className="ui-row">
          <Button size="sm">{t('ui.buttons.small')}</Button>
          <Button>{t('ui.buttons.normal')}</Button>
          <Button size="lg">{t('ui.buttons.large')}</Button>
          <IconButton label={t('ui.buttons.settings')} variant="secondary">
            ⚙
          </IconButton>
          <IconButton label={t('common.close')}>×</IconButton>
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-choices">
        <h2 id="ui-choices">{t('ui.choices.title')}</h2>
        <div className="ui-row">
          {CHIPS.map(([id, label]) => (
            <Chip key={id} pressed={chips.includes(id)} onToggle={() => toggle(id)}>
              {t(label)}
            </Chip>
          ))}
        </div>
        <Segmented
          label={t('ui.choices.paceLabel')}
          value={pace}
          onChange={setPace}
          options={[
            ['slow', t('ui.choices.slow')],
            ['normal', t('ui.choices.normal')],
            ['fast', t('ui.choices.fast')],
          ]}
        />
        <div className="ui-cards" role="radiogroup" aria-label={t('ui.choices.whoLabel')}>
          <ChoiceCard
            name="who"
            value="me"
            checked={who === 'me'}
            onChange={setWho}
            title={t('ui.choices.meTitle')}
          >
            {t('ui.choices.meText')}
          </ChoiceCard>
          <ChoiceCard
            name="who"
            value="students"
            checked={who === 'students'}
            onChange={setWho}
            title={t('ui.choices.studentsTitle')}
          >
            {t('ui.choices.studentsText')}
          </ChoiceCard>
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-fields">
        <h2 id="ui-fields">{t('ui.fields.title')}</h2>
        <div className="ui-fields">
          <Field id="ui-name" label={t('ui.fields.name')} hint={t('ui.fields.nameHint')}>
            <TextInput id="ui-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="ui-email" label={t('ui.fields.email')} error={t('ui.fields.emailError')}>
            <TextInput id="ui-email" defaultValue="mona@" aria-invalid="true" />
          </Field>
          <Field id="ui-note" label={t('ui.fields.note')}>
            <TextArea id="ui-note" placeholder={t('ui.fields.notePlaceholder')} />
          </Field>
        </div>
        <div className="ui-row">
          <PillSelect
            lead={t('ui.fields.levelLead')}
            label={t('ui.fields.levelLabel')}
            defaultValue="beginner"
            options={[
              ['beginner', t('ui.fields.beginner')],
              ['some', t('ui.fields.some')],
            ]}
          />
          <Switch checked={on} onChange={setOn} hint={t('ui.fields.narrationHint')}>
            {t('ui.fields.narration')}
          </Switch>
        </div>
      </section>
      <section className="ui-section" aria-labelledby="ui-feedback">
        <h2 id="ui-feedback">{t('ui.feedback.title')}</h2>
        <div className="ui-row">
          <Badge>{t('ui.feedback.draft')}</Badge>
          <Badge tone="accent">{t('ui.feedback.fits')}</Badge>
          <Badge tone="success">{t('ui.feedback.right')}</Badge>
          <Badge tone="danger">{t('ui.feedback.wrong')}</Badge>
          <Badge tone="warning">{t('ui.feedback.review')}</Badge>
          <Badge tone="tutor">Nova</Badge>
        </div>
        <Alert tone="error">{t('ui.feedback.error')}</Alert>
        <Alert tone="success" title={t('ui.feedback.savedTitle')}>
          {t('ui.feedback.savedText')}
        </Alert>
        <Alert tone="info">{t('ui.feedback.info')}</Alert>
        <Spinner label={t('ui.feedback.loading')} />
        <EmptyState
          title={t('ui.feedback.emptyTitle')}
          action={<Button size="sm">{t('ui.feedback.emptyAction')}</Button>}
        >
          {t('ui.feedback.emptyText')}
        </EmptyState>
      </section>
      <section className="ui-section" aria-labelledby="ui-surfaces">
        <h2 id="ui-surfaces">{t('ui.surfaces.title')}</h2>
        <div className="ui-cards">
          <Card>
            <strong>{t('ui.surfaces.plain')}</strong>
            <p>{t('ui.surfaces.plainText')}</p>
          </Card>
          <Card tone="soft">
            <strong>{t('ui.surfaces.soft')}</strong>
            <p>{t('ui.surfaces.softText')}</p>
          </Card>
          <Card tone="outline">
            <strong>{t('ui.surfaces.outline')}</strong>
            <p>{t('ui.surfaces.outlineText')}</p>
          </Card>
        </div>
        <Button variant="secondary" onClick={() => setDialog(true)}>
          {t('ui.surfaces.openDialog')}
        </Button>
      </section>
      {dialog && (
        <Dialog
          title={t('ui.surfaces.dialogTitle')}
          description={t('ui.surfaces.dialogText')}
          onClose={() => setDialog(false)}
          footer={
            <>
              <Button variant="danger" onClick={() => setDialog(false)}>
                {t('ui.surfaces.delete')}
              </Button>
              <Button variant="secondary" onClick={() => setDialog(false)}>
                {t('ui.surfaces.back')}
              </Button>
            </>
          }
        />
      )}
    </main>
  );
}
