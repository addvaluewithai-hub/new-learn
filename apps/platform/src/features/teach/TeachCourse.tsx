import { useState } from 'react';
import { Badge, ButtonLink, Segmented } from '../../shared/ui';
import { PublishCard } from './PublishCard';
import { Outline } from './Outline';
import { NotesInbox } from './NotesInbox';
import { previewHref, statusOf, type Workspace } from './types';

type Tab = 'publish' | 'outline' | 'notes';

/** One course's workspace: publish, the outline, and the notes, each on its own tab. */
export function TeachCourse({
  work,
  onChanged,
}: {
  work: Workspace;
  onChanged: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>(work.published ? 'publish' : 'outline');
  const status = statusOf(work);
  const preview = previewHref(work);
  const open = work.notes.filter((n) => n.status === 'open' || n.status === 'review').length;
  return (
    <>
      <div className="page-heading">
        <ButtonLink variant="link" href="/?teach">
          ← كورساتك
        </ButtonLink>
        <span className="eyebrow">{work.subject || 'كورس'}</span>
        <h1>{work.title}</h1>
        <p className="teach-course-line">
          <Badge tone={status.tone}>{status.text}</Badge>
          <span>{work.lessons.length} دروس</span>
          {work.published && <span>{work.published.students} طالب</span>}
          {preview && (
            <ButtonLink variant="link" href={preview}>
              معاينة الدرس الأول
            </ButtonLink>
          )}
        </p>
      </div>
      <Segmented<Tab>
        label="أقسام الكورس"
        value={tab}
        onChange={setTab}
        options={[
          ['publish', 'النشر'],
          ['outline', 'الترتيب'],
          ['notes', open ? `الملاحظات (${open})` : 'الملاحظات'],
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
