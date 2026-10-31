import { useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Button, Card, TextInput } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { shareLink, type Workspace } from './types';
import { initialPrice, priceCents, PriceFields, ReviewStatus } from './PriceFields';

/** The self-check, the publish or update button, the share link, and who got how far. */
export function PublishCard({
  work,
  onChanged,
}: {
  work: Workspace;
  onChanged: () => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [price, setPrice] = useState(() => initialPrice(work.published));
  const paid = price.paid;
  const live = work.published && !work.published.withdrawn;
  const act = async (path: string, done: string, data: object = {}) => {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/teach/courses/${work.id}/${path}`, data);
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
        <h2>{t('teach.publish.before')}</h2>
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
        <PriceFields value={price} onChange={setPrice} />
        {work.published && <ReviewStatus published={work.published} />}
        <div className="teach-publish-actions">
          <Button
            disabled={busy || !work.check.ready}
            onClick={() =>
              act(
                'publish',
                paid
                  ? t('teach.price.sent')
                  : live
                    ? t('teach.publish.updated')
                    : t('teach.publish.published'),
                { priceCents: priceCents(price), currency: price.currency },
              )
            }
          >
            {busy
              ? t('teach.publish.wait')
              : paid
                ? t('teach.price.submit')
                : live
                  ? work.published?.stale
                    ? t('teach.publish.publishChanges')
                    : t('teach.publish.publishNew')
                  : work.published
                    ? t('teach.publish.republish')
                    : t('teach.publish.publish')}
          </Button>
          {live && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => act('withdraw', t('teach.publish.withdrawDone'))}
            >
              {t('teach.publish.withdraw')}
            </Button>
          )}
        </div>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        {work.published && !live && (
          <p className="teach-note">{t('teach.publish.withdrawnNote')}</p>
        )}
      </Card>
      {live && (
        <Card className="teach-share">
          <h2>{t('teach.publish.linkTitle')}</h2>
          <p className="teach-note">{t('teach.publish.linkNote')}</p>
          <div className="teach-share-row">
            <TextInput
              value={link}
              readOnly
              dir="ltr"
              onFocus={(e) => e.currentTarget.select()}
              aria-label={t('teach.publish.linkTitle')}
            />
            <Button variant="secondary" onClick={copy}>
              {copied ? t('teach.publish.copied') : t('teach.publish.copy')}
            </Button>
          </div>
          <p className="teach-note">
            {t('teach.publish.version', {
              version: work.published!.version,
              date: new Intl.DateTimeFormat(locale).format(new Date(work.published!.publishedAt)),
            })}
          </p>
        </Card>
      )}
      {live && (
        <Card className="teach-students">
          <h2>{t('teach.publish.students')}</h2>
          {work.published!.students ? (
            <table className="teach-table">
              <thead>
                <tr>
                  <th>{t('teach.publish.lesson')}</th>
                  <th>{t('teach.publish.started')}</th>
                  <th>{t('teach.publish.finished')}</th>
                </tr>
              </thead>
              <tbody>
                {work.lessons.map((l) => {
                  const p = work.progress.find((x) => x.lessonId === l.id);
                  return (
                    <tr key={l.id}>
                      <td>
                        <bdi>{l.title}</bdi>
                      </td>
                      <td>{p?.started ?? 0}</td>
                      <td>{p?.completed ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="teach-note">{t('teach.publish.noStudents')}</p>
          )}
        </Card>
      )}
    </div>
  );
}
