import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../shared/api';
import { CHOICES, DEFAULT_CHOICES, FILE_LIMITS, FILE_TYPES, readUpload } from './choices';
import { go, type BuildJob } from './types';

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} ميجا`;

export function StudioForm() {
  const [topic, setTopic] = useState(''),
    [choices, setChoices] = useState(DEFAULT_CHOICES),
    [files, setFiles] = useState<File[]>([]),
    [webSearch, setWebSearch] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [active, setActive] = useState<BuildJob | null>(null);
  useEffect(() => {
    api<{ jobs: BuildJob[] }>('/studio/jobs').then(
      ({ jobs }) =>
        setActive(jobs.find((j) => j.status === 'queued' || j.status === 'running') ?? null),
      () => setActive(null),
    );
  }, []);

  function pick(key: string, value: string, multi?: boolean) {
    setChoices((current) => {
      if (!multi) return { ...current, [key]: value };
      const now = current[key].split(',').filter(Boolean);
      const next = now.includes(value) ? now.filter((v) => v !== value) : [...now, value];
      return next.length && next.length <= 3 ? { ...current, [key]: next.join(',') } : current;
    });
  }

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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (topic.trim().length < 3) return setError('اكتب الكورس عن إيه.');
    setBusy(true);
    setError('');
    try {
      const uploads = await Promise.all(files.map(readUpload));
      const job = await api<BuildJob>('/studio/jobs', {
        topic,
        choices,
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
      <div className="page-heading">
        <span className="eyebrow">استوديو الكورسات</span>
        <h1>اعمل كورس جديد</h1>
        <p>
          اكتب عايز تشرح إيه، ارفع ملفاتك لو عندك، واختار طريقة الشرح. هنبني لك مسودة تراجعها قبل ما
          الطلاب يشوفوها.
        </p>
      </div>
      {active && (
        <p className="studio-active" role="status">
          فيه كورس بيتبني دلوقتي: <strong>{active.topic}</strong>{' '}
          <a className="text-button" href={`/?studio&job=${active.id}`}>
            تابعه
          </a>
        </p>
      )}
      <label className="studio-field">
        <span>الكورس عن إيه؟</span>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={4000}
          rows={4}
          placeholder="مثلًا: الفايدة المركبة لطلاب أولى تجارة، مع أمثلة من البنوك المصرية"
        />
      </label>
      <div className="studio-field">
        <span>ملفاتك (اختياري)</span>
        <label className="studio-drop">
          <input
            type="file"
            multiple
            accept={FILE_TYPES}
            onChange={(e) => addFiles(e.target.files)}
          />
          ارفع PDF أو Word أو صور أو نص. لحد 5 ملفات، 4 ميجا للملف.
        </label>
        {files.length > 0 && (
          <ul className="studio-files">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`}>
                <span>{file.name}</span>
                <small>{megabytes(file.size)}</small>
                <button
                  type="button"
                  className="text-button"
                  aria-label={`شيل ${file.name}`}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                >
                  شيل
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {CHOICES.map((choice) => (
        <fieldset key={choice.key} className="studio-choice">
          <legend>
            {choice.title}
            {choice.multi && <small> (لحد 3)</small>}
          </legend>
          <div className="studio-chips">
            {choice.options.map(([value, label]) => {
              const on = choices[choice.key].split(',').includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  className="studio-chip"
                  aria-pressed={on}
                  onClick={() => pick(choice.key, value, choice.multi)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <label className="studio-toggle">
        <input
          type="checkbox"
          checked={webSearch}
          onChange={(e) => setWebSearch(e.target.checked)}
        />
        يدوّر على النت عشان يتأكد من المعلومات ويجيب أمثلة
      </label>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy || Boolean(active)}>
        {busy ? 'بنبعت طلبك…' : 'ابدأ البناء'}
      </button>
    </form>
  );
}
