import { useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Button, Card, TextInput } from '../../shared/ui';
import { shareLink, type Workspace } from './types';

/** The self-check, the publish or update button, the share link, and who got how far. */
export function PublishCard({
  work,
  onChanged,
}: {
  work: Workspace;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const live = work.published && !work.published.withdrawn;
  const act = async (path: string, done: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/teach/courses/${work.id}/${path}`, {});
      await onChanged();
      setMessage({ tone: 'success', text: done });
    } catch (e) {
      setMessage({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink(work.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const link = shareLink(work.id);
  return (
    <div className="teach-publish">
      <Card className="teach-check">
        <h2>قبل النشر</h2>
        <ul className="teach-checklist">
          {[...work.check.checks, ...work.check.warnings].map((c) => (
            <li
              key={c.text}
              data-ok={c.ok}
              data-warn={work.check.warnings.includes(c) || undefined}
            >
              <span aria-hidden="true">
                {c.ok ? '✓' : work.check.warnings.includes(c) ? '!' : '✗'}
              </span>
              {c.text}
            </li>
          ))}
        </ul>
        <div className="teach-publish-actions">
          <Button
            disabled={busy || !work.check.ready}
            onClick={() =>
              act(
                'publish',
                live ? 'النسخة الجديدة وصلت لطلابك.' : 'الكورس اتنشر. ابعت اللينك لطلابك.',
              )
            }
          >
            {busy
              ? 'لحظة…'
              : live
                ? work.published?.stale
                  ? 'انشر التعديلات'
                  : 'انشر نسخة جديدة'
                : work.published
                  ? 'انشر تاني'
                  : 'انشر لطلابك'}
          </Button>
          {live && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => act('withdraw', 'الكورس اتسحب من طلابك.')}
            >
              اسحب الكورس
            </Button>
          )}
        </div>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        {work.published && !live && (
          <p className="teach-note">
            الكورس مسحوب: طلابك مش شايفينه دلوقتي، وتقدمهم محفوظ لحد ما تنشره تاني.
          </p>
        )}
      </Card>
      {live && (
        <Card className="teach-share">
          <h2>لينك الكورس</h2>
          <p className="teach-note">أي حد يفتحه ويدخل بحسابه يقدر يبدأ الكورس.</p>
          <div className="teach-share-row">
            <TextInput
              value={link}
              readOnly
              dir="ltr"
              onFocus={(e) => e.currentTarget.select()}
              aria-label="لينك الكورس"
            />
            <Button variant="secondary" onClick={copy}>
              {copied ? 'اتنسخ' : 'انسخ'}
            </Button>
          </div>
          <p className="teach-note">
            نسخة {work.published!.version} · اتنشرت{' '}
            {new Date(work.published!.publishedAt).toLocaleDateString('ar-EG')}
          </p>
        </Card>
      )}
      {live && (
        <Card className="teach-students">
          <h2>طلابك</h2>
          {work.published!.students ? (
            <table className="teach-table">
              <thead>
                <tr>
                  <th>الدرس</th>
                  <th>بدأوا</th>
                  <th>خلّصوا</th>
                </tr>
              </thead>
              <tbody>
                {work.lessons.map((l) => {
                  const p = work.progress.find((x) => x.lessonId === l.id);
                  return (
                    <tr key={l.id}>
                      <td>{l.title}</td>
                      <td>{p?.started ?? 0}</td>
                      <td>{p?.completed ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="teach-note">لسه محدش بدأ. ابعت اللينك لطلابك.</p>
          )}
        </Card>
      )}
    </div>
  );
}
