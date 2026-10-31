import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../shared/api';
import { AUDIENCES, DEFAULT_CHOICES, FILE_LIMITS, readUpload } from './choices';
import { EXAMPLES, lookOf, suggestLooks, type Look } from './looks';
import { go, type BuildJob } from './types';
import { Composer } from './Composer';
import { LookGallery } from './LookGallery';
import { LookPreview } from './LookPreview';
import { Details } from './Details';
import './looks.css';
import './details.css';
import { Alert, Button, ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';

/** «اعمل كورس»: the idea, who it is for, the look, then one button (docs/visuals/README.md). */
export function StudioForm() {
  const { t } = useI18n();
  const [topic, setTopic] = useState(''),
    [files, setFiles] = useState<File[]>([]),
    [webSearch, setWebSearch] = useState(true),
    [look, setLook] = useState('auto'),
    [choices, setChoices] = useState(DEFAULT_CHOICES),
    [preview, setPreview] = useState<Look | null>(null),
    [dragging, setDragging] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [active, setActive] = useState<BuildJob | null>(null);
  const suggested = useMemo(
    () => suggestLooks(topic.trim().length > 2 ? topic : '', choices.audience),
    [topic, choices.audience],
  );

  useEffect(() => {
    api<{ jobs: BuildJob[] }>('/studio/jobs').then(
      ({ jobs }) =>
        setActive(jobs.find((j) => j.status === 'queued' || j.status === 'running') ?? null),
      () => setActive(null),
    );
  }, []);
  function addFiles(list: FileList | null) {
    setError('');
    const next = [...files, ...Array.from(list ?? [])];
    if (next.length > FILE_LIMITS.count) return setError(t('studio.form.errors.tooMany'));
    if (next.some((f) => f.size > FILE_LIMITS.each))
      return setError(t('studio.form.errors.tooBig'));
    if (next.reduce((n, f) => n + f.size, 0) > FILE_LIMITS.total)
      return setError(t('studio.form.errors.tooBigTogether'));
    setFiles(next);
  }
  // Files can be dropped anywhere on the page.
  useEffect(() => {
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => !e.relatedTarget && setDragging(false);
    const drop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer?.files ?? null);
    };
    addEventListener('dragover', over);
    addEventListener('dragleave', leave);
    addEventListener('drop', drop);
    return () => {
      removeEventListener('dragover', over);
      removeEventListener('dragleave', leave);
      removeEventListener('drop', drop);
    };
  });
  function pick(key: string, value: string, multi?: boolean) {
    setChoices((current) => {
      if (!multi) return { ...current, [key]: value };
      const now = current[key].split(',').filter(Boolean);
      const next = now.includes(value) ? now.filter((v) => v !== value) : [...now, value];
      return next.length && next.length <= 3 ? { ...current, [key]: next.join(',') } : current;
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (topic.trim().length < 3) {
      document.getElementById('studio-topic')?.focus();
      return setError(t('studio.form.errors.noTopic'));
    }
    setBusy(true);
    setError('');
    try {
      const uploads = await Promise.all(files.map(readUpload));
      const job = await api<BuildJob>('/studio/jobs', {
        topic,
        choices: { ...choices, look },
        webSearch,
        files: uploads,
      });
      go(`?studio&job=${job.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : t('studio.form.errors.startFailed'));
      setBusy(false);
    }
  }

  const audience = AUDIENCES.find((a) => a.id === choices.audience);
  const audienceName = audience ? t(audience.name) : '';

  return (
    <form className="studio" onSubmit={submit}>
      <header className="studio-head">
        <span className="eyebrow">{t('studio.form.eyebrow')}</span>
        <h1>{t('studio.form.title')}</h1>
        <p>{t('studio.form.lead')}</p>
      </header>
      {active && (
        <p className="studio-active" role="status">
          <Rich
            k="studio.form.active"
            parts={{
              topic: (
                <strong>
                  <bdi>{active.topic}</bdi>
                </strong>
              ),
              follow: (
                <ButtonLink variant="link" href={`/?studio&job=${active.id}`}>
                  {t('studio.form.follow')}
                </ButtonLink>
              ),
            }}
          />
        </p>
      )}
      <section className="studio-step" aria-labelledby="step-idea">
        <h2 id="step-idea">
          <span>{t('studio.form.ideaNumber')}</span> {t('studio.form.ideaTitle')}
        </h2>
        <Composer
          topic={topic}
          onTopic={setTopic}
          files={files}
          onFiles={addFiles}
          onRemove={(i) => setFiles(files.filter((_, j) => j !== i))}
          webSearch={webSearch}
          onWebSearch={setWebSearch}
        />
        <div className="examples" aria-label={t('studio.form.examples')}>
          <span>{t('studio.form.examplesLead')}</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.topic}
              type="button"
              className="example"
              onClick={() => {
                setTopic(t(example.topic));
                setLook(example.look);
              }}
            >
              <img src={`/styles/${example.look}.webp`} alt="" />
              {t(example.topic)}
            </button>
          ))}
        </div>
      </section>
      <section className="studio-step" aria-labelledby="step-details">
        <h2 id="step-details">
          <span>{t('studio.form.detailsNumber')}</span> {t('studio.form.detailsTitle')}
        </h2>
        <Details choices={choices} onPick={pick} />
      </section>
      <section className="studio-step" aria-labelledby="step-look">
        <h2 id="step-look">
          <span>{t('studio.form.lookNumber')}</span> {t('studio.form.lookTitle')}
        </h2>
        <LookGallery
          selected={look}
          suggested={suggested}
          onSelect={setLook}
          onPreview={setPreview}
        />
      </section>
      <div className="studio-cta">
        <div>
          <strong>{topic.trim() ? topic.trim().slice(0, 60) : t('studio.form.untitled')}</strong>
          <span>
            {t('studio.form.summary', { audience: audienceName, look: t(lookOf(look).name) })}
          </span>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" variant="accent" disabled={busy || Boolean(active)}>
          {busy ? t('studio.form.sending') : t('studio.form.start')}
        </Button>
      </div>
      {dragging && <div className="studio-drop-overlay">{t('studio.form.dropHere')}</div>}
      {preview && (
        <LookPreview
          look={preview}
          onClose={() => setPreview(null)}
          onChoose={(id) => setLook(id)}
        />
      )}
    </form>
  );
}
