import { useState } from 'react';
import { Badge, ButtonLink, Segmented } from '../../shared/ui';
import { PublishCard } from './PublishCard';
import { Outline } from './Outline';
import { NotesInbox } from './NotesInbox';
import { previewHref, statusOf, type Workspace } from './types';
import { useI18n } from '../../i18n';

type Tab = 'publish' | 'outline' | 'notes';

/** One course's workspace: publish, the outline, and the notes, each on its own tab. */
export function TeachCourse({
  work,
  onChanged,
}: {
  work: Workspace;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>(work.published ? 'publish' : 'outline');
  const status = statusOf(work);
  const preview = previewHref(work);
  const open = work.notes.filter((n) => n.status === 'open' || n.status === 'review').length;
  return (
    <>
      <div className="page-heading">
        <ButtonLink variant="link" href="/?teach">
          {t('common.backLink')} {t('teach.course.back')}
        </ButtonLink>
        <span className="eyebrow">
          {work.subject ? <bdi>{work.subject}</bdi> : t('teach.course.subjectFallback')}
        </span>
        <h1>{work.title}</h1>
        <p className="teach-course-line">
          <Badge tone={status.tone}>{status.text}</Badge>
          <span>{t('teach.lessonCount', { count: work.lessons.length })}</span>
          {work.published && (
            <span>{t('teach.studentCount', { count: work.published.students })}</span>
          )}
          {preview && (
            <ButtonLink variant="link" href={preview}>
              {t('teach.course.previewFirst')}
            </ButtonLink>
          )}
        </p>
      </div>
      <Segmented<Tab>
        label={t('teach.course.tabsLabel')}
        value={tab}
        onChange={setTab}
        options={[
          ['publish', t('teach.course.tabs.publish')],
          ['outline', t('teach.course.tabs.outline')],
          [
            'notes',
            open
              ? t('teach.course.tabs.notesCount', { count: open })
              : t('teach.course.tabs.notes'),
          ],
        ]}
      />
      <div className="teach-tab">
        {tab === 'publish' && <PublishCard work={work} onChanged={onChanged} />}
        {tab === 'outline' && <Outline work={work} onChanged={onChanged} />}
        {tab === 'notes' && <NotesInbox work={work} onChanged={onChanged} />}
      </div>
    </>
  );
}
