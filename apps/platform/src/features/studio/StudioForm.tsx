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

/** «اعمل كورس»: the idea, who it is for, the look, then one button (docs/visuals/README.md). */
export function StudioForm() {
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
    if (next.length > FILE_LIMITS.count) return setError('5 ملفات بالكتير.');
    if (next.some((f) => f.size > FILE_LIMITS.each))
      return setError('كل ملف لازم يكون أقل من 4 ميجا.');
    if (next.reduce((n, f) => n + f.size, 0) > FILE_LIMITS.total)
      return setError('الملفات مع بعض لازم تكون أقل من 10 ميجا.');
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
      return setError('اكتب الكورس عن إيه.');
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
      setError(error instanceof Error ? error.message : 'تعذر بدء البناء.');
      setBusy(false);
    }
  }

  return (
    <form className="studio" onSubmit={submit}>
      <header className="studio-head">
        <span className="eyebrow">استوديو الكورسات</span>
        <h1>اعمل درس تفاعلي من فكرة</h1>
        <p>
          اكتب عايز تتعلم أو تشرح إيه، وقول لمين، واختار شكله. هنبني لك درس فيه بوردات تلعب فيها
          وأسئلة، وتقدر تراجعه قبل ما حد تاني يشوفه.
        </p>
      </header>
      {active && (
        <p className="studio-active" role="status">
          فيه كورس بيتبني دلوقتي: <strong>{active.topic}</strong>{' '}
          <ButtonLink variant="link" href={`/?studio&job=${active.id}`}>
            تابعه
          </ButtonLink>
        </p>
      )}
      <section className="studio-step" aria-labelledby="step-idea">
        <h2 id="step-idea">
          <span>١</span> الفكرة
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
        <div className="examples" aria-label="أمثلة">
          <span>أو ابدأ من مثال:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.topic}
              type="button"
              className="example"
              onClick={() => {
                setTopic(example.topic);
                setLook(example.look);
              }}
            >
              <img src={`/styles/${example.look}.webp`} alt="" />
              {example.topic}
            </button>
          ))}
        </div>
      </section>
      <section className="studio-step" aria-labelledby="step-details">
        <h2 id="step-details">
          <span>٢</span> لمين؟
        </h2>
        <Details choices={choices} onPick={pick} />
      </section>
      <section className="studio-step" aria-labelledby="step-look">
        <h2 id="step-look">
          <span>٣</span> الشكل
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
          <strong>{topic.trim() ? topic.trim().slice(0, 60) : 'درس جديد'}</strong>
          <span>
            {AUDIENCES.find((a) => a.id === choices.audience)?.name} · {lookOf(look).name} · بياخد
            من ٥ لـ٢٠ دقيقة، وتقدر تقفل الصفحة
          </span>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" variant="accent" disabled={busy || Boolean(active)}>
          {busy ? 'بنبعت طلبك…' : 'ابدأ البناء'}
        </Button>
      </div>
      {dragging && <div className="studio-drop-overlay">سيب الملفات هنا</div>}
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
