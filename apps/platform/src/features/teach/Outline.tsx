import { useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Button, Field, IconButton, TextArea, TextInput } from '../../shared/ui';
import type { Part, Workspace } from './types';

/** The course's name and its lessons in parts: rename, move up and down, regroup, then save. */
export function Outline({ work, onChanged }: { work: Workspace; onChanged: () => Promise<void> }) {
  const [title, setTitle] = useState(work.title);
  const [subject, setSubject] = useState(work.subject);
  const [description, setDescription] = useState(work.description);
  const [parts, setParts] = useState<Part[]>(() => initialParts(work));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const titleOf = (id: string) => work.lessons.find((l) => l.id === id)?.title ?? id;
  const update = (at: number, next: Partial<Part>) =>
    setParts((now) => now.map((p, i) => (i === at ? { ...p, ...next } : p)));
  const move = (at: number, from: number, to: number) =>
    update(at, { lessonIds: swap(parts[at].lessonIds, from, to) });
  const send = (at: number, from: number, toPart: number) => {
    const id = parts[at].lessonIds[from];
    setParts((now) =>
      now.map((p, i) => {
        if (i === at) return { ...p, lessonIds: p.lessonIds.filter((x) => x !== id) };
        if (i === toPart) return { ...p, lessonIds: [...p.lessonIds, id] };
        return p;
      }),
    );
  };
  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/teach/courses/${work.id}`, { title, subject, description, parts });
      await onChanged();
      setMessage({ tone: 'success', text: 'اتحفظ. التعديل يوصل لطلابك مع النشر الجاي.' });
    } catch (e) {
      setMessage({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="teach-outline">
      <div className="teach-fields">
        <Field id="course-title" label="اسم الكورس">
          <TextInput
            id="course-title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field id="course-subject" label="المادة">
          <TextInput
            id="course-subject"
            value={subject}
            maxLength={80}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <Field id="course-description" label="وصف قصير" hint="بيظهر لطلابك على صفحة الكورس.">
          <TextArea
            id="course-description"
            value={description}
            maxLength={600}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
      <ol className="teach-parts">
        {parts.map((part, at) => (
          <li key={at} className="teach-part">
            <div className="teach-part-head">
              <TextInput
                value={part.title}
                maxLength={120}
                aria-label={`اسم الجزء ${at + 1}`}
                onChange={(e) => update(at, { title: e.target.value })}
              />
              {!part.lessonIds.length && parts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParts(parts.filter((_, i) => i !== at))}
                >
                  شيل الجزء
                </Button>
              )}
            </div>
            <ol className="teach-lessons">
              {part.lessonIds.map((id, i) => (
                <li key={id}>
                  <span className="teach-lesson-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <a href={`/?draft=${id}`}>{titleOf(id)}</a>
                  <span className="teach-lesson-moves">
                    <IconButton
                      label="فوق"
                      size="sm"
                      disabled={i === 0}
                      onClick={() => move(at, i, i - 1)}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label="تحت"
                      size="sm"
                      disabled={i === part.lessonIds.length - 1}
                      onClick={() => move(at, i, i + 1)}
                    >
                      ↓
                    </IconButton>
                    {parts.length > 1 && (
                      <select
                        aria-label="انقل لجزء"
                        value=""
                        onChange={(e) => e.target.value && send(at, i, Number(e.target.value))}
                      >
                        <option value="">انقل لـ…</option>
                        {parts.map((p, j) =>
                          j === at ? null : (
                            <option key={j} value={j}>
                              {p.title || `الجزء ${j + 1}`}
                            </option>
                          ),
                        )}
                      </select>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      <div className="teach-outline-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setParts([...parts, { title: `الجزء ${parts.length + 1}`, lessonIds: [] }])
          }
        >
          + جزء جديد
        </Button>
        <Button disabled={busy || title.trim().length < 3} onClick={save}>
          {busy ? 'بنحفظ…' : 'احفظ الترتيب'}
        </Button>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </div>
  );
}

/** The saved parts, plus one for lessons in none of them, so every lesson has a place. */
function initialParts(work: Workspace): Part[] {
  const placed = new Set(work.parts.flatMap((p) => p.lessonIds));
  const rest = work.lessons.filter((l) => !placed.has(l.id)).map((l) => l.id);
  const parts = work.parts.map((p) => ({
    ...p,
    lessonIds: p.lessonIds.filter((id) => work.lessons.some((l) => l.id === id)),
  }));
  if (rest.length) parts.push({ title: parts.length ? 'دروس تانية' : 'الدروس', lessonIds: rest });
  return parts.length ? parts : [{ title: 'الدروس', lessonIds: [] }];
}
function swap<T>(list: T[], a: number, b: number) {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
