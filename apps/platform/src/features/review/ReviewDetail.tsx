import { useCallback, useEffect, useState } from 'react';
import type { ReadingPackage } from '@learn/lesson-runtime';
import { api } from '../../shared/api';
import { Alert, Badge, Button, ButtonLink, Card, Field, Spinner, TextArea } from '../../shared/ui';
import { useI18n, type TextKey } from '../../i18n';
import { formatPrice } from '../credits/format';
import { ReviewLessons } from './ReviewLessons';

type Finding = { severity: string; kind: string; lesson: string; where: string; note: string };
export type Detail = {
  courseId: string;
  version: number;
  title: string;
  subject: string;
  description: string;
  teacher: string;
  language: string;
  priceCents: number;
  currency: string;
  status: 'pending' | 'approved' | 'changes';
  notes: string;
  aiReport: { summary: string; findings: Finding[]; at: string } | null;
  lessons: Array<{ id: string; title: string; position: number; package: ReadingPackage }>;
};

const TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

/** One paid version in full: the AI's first pass, every lesson, and the decision. */
export function ReviewDetail({ courseId, version }: { courseId: string; version: number }) {
  const { t, locale } = useI18n();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<'' | 'ai' | 'decide'>('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const path = `/review/courses/${courseId}/${version}`;
  const load = useCallback(
    () =>
      api<Detail>(path).then(setDetail, (e) =>
        setMessage({ tone: 'error', text: (e as Error).message }),
      ),
    [path],
  );
  useEffect(() => void load(), [load]);
  const run = async (kind: 'ai' | 'decide', call: () => Promise<unknown>, done?: string) => {
    setBusy(kind);
    setMessage(null);
    try {
      await call();
      await load();
      if (done) setMessage({ tone: 'success', text: done });
    } catch (e) {
      setMessage({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  };
  const decide = (status: 'approved' | 'changes') =>
    run('decide', () => api(path, { status, notes }), t(`review.decided.${status}`));
  if (!detail)
    return message ? (
      <Alert tone="error">{message.text}</Alert>
    ) : (
      <Spinner label={t('review.loading')} />
    );
  const report = detail.aiReport;
  return (
    <div className="review-detail">
      <div className="page-heading">
        <ButtonLink variant="link" href="/?review">
          {t('common.backLink')} {t('review.back')}
        </ButtonLink>
        <h1>
          <bdi>{detail.title}</bdi>
        </h1>
        <p>
          {t('review.item', {
            teacher: detail.teacher,
            version: detail.version,
            price: detail.priceCents
              ? formatPrice(detail.priceCents, detail.currency, locale)
              : t('review.forListing'),
          })}
        </p>
      </div>
      <Card className="review-ai">
        <h2>{t('review.aiTitle')}</h2>
        <p className="review-hint">{t('review.aiHint')}</p>
        {!report ? (
          <p>{t('review.aiNone')}</p>
        ) : (
          <>
            <p>
              <bdi>{report.summary}</bdi>
            </p>
            {report.findings.length === 0 ? (
              <p>{t('review.aiClean')}</p>
            ) : (
              <ul className="review-findings">
                {report.findings.map((f, i) => (
                  <li key={i}>
                    <Badge tone={TONE[f.severity]}>
                      {t(`review.severity.${f.severity}` as TextKey)}
                    </Badge>
                    <Badge>{t(`review.kind.${f.kind}` as TextKey)}</Badge>
                    <small>
                      <bdi>
                        {f.lesson} · {f.where}
                      </bdi>
                    </small>
                    <p>
                      <bdi>{f.note}</bdi>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <Button
          variant="secondary"
          disabled={busy !== ''}
          onClick={() => void run('ai', () => api(`${path}/ai`, {}))}
        >
          {busy === 'ai' ? t('review.aiRunning') : t('review.aiRun')}
        </Button>
      </Card>
      <ReviewLessons lessons={detail.lessons} language={detail.language} />
      {detail.status === 'pending' && (
        <Card className="review-decision">
          <h2>{t('review.decisionTitle')}</h2>
          <Field id="review-notes" label={t('review.notesLabel')} hint={t('review.notesHelp')}>
            <TextArea
              id="review-notes"
              rows={5}
              value={notes}
              maxLength={4000}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <div className="review-actions">
            <Button variant="accent" disabled={busy !== ''} onClick={() => void decide('approved')}>
              {t('review.approve')}
            </Button>
            <Button
              variant="secondary"
              disabled={busy !== ''}
              onClick={() => void decide('changes')}
            >
              {t('review.requestChanges')}
            </Button>
          </div>
        </Card>
      )}
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </div>
  );
}
