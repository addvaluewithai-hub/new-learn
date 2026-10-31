import type { LessonPackage } from '@learn/lesson-runtime';
import type { GuideTool } from './LessonTools';
import { ClassroomIcon } from './ClassroomIcon';
import { useI18n, type TextKey } from '../../i18n';
import './lesson-guide.css';
const titles: Record<GuideTool, TextKey> = {
  guide: 'classroom.guide.titles.guide',
  terms: 'classroom.guide.titles.terms',
  notes: 'classroom.guide.titles.notes',
  source: 'classroom.guide.titles.source',
};
export function LessonGuide({
  lesson,
  tool,
  notes,
  onNotes,
  onClose,
  onTerms,
}: {
  lesson: LessonPackage;
  tool: GuideTool;
  notes: string;
  onNotes: (value: string) => void;
  onClose: () => void;
  onTerms: () => void;
}) {
  const { t, dir } = useI18n();
  return (
    <aside className="classroom-guide" aria-label={t('classroom.guide.label')} dir={dir}>
      <header>
        {lesson.guide && <img src={lesson.guide.image} alt="" width={48} height={48} />}
        <div>
          <strong>{t('classroom.guide.title')}</strong>
          <span>{t('classroom.guide.subtitle')}</span>
        </div>
        <button aria-label={t('classroom.guide.close')} onClick={onClose}>
          <ClassroomIcon name="close" size={18} />
        </button>
      </header>
      <div className="guide-body">
        <span className="guide-eyebrow">
          {tool === 'guide' ? t('classroom.guide.eyebrowGuide') : t('classroom.guide.eyebrowTools')}
        </span>
        <h2>{t(titles[tool])}</h2>
        {tool === 'guide' && (
          <>
            <p className="guide-bubble">
              <bdi>{lesson.review.summary}</bdi>
            </p>
            <div className="guide-prompt">
              <ClassroomIcon name="guide" />
              <strong>{t('classroom.guide.promptTitle')}</strong>
              <p>{t('classroom.guide.promptText')}</p>
            </div>
            <button className="guide-link" onClick={onTerms}>
              {t('classroom.guide.reviewTerms')} <ClassroomIcon name="book" size={18} />
            </button>
          </>
        )}
        {tool === 'terms' && (
          <dl className="guide-glossary">
            {lesson.glossary.map(({ term, meaning }) => (
              <div key={term}>
                <dt lang="en" dir="ltr">
                  {term}
                </dt>
                <dd>
                  <bdi>{meaning}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        )}
        {tool === 'notes' && (
          <>
            <label htmlFor="lesson-notes">{t('classroom.guide.notesLabel')}</label>
            <textarea
              id="lesson-notes"
              rows={8}
              maxLength={10000}
              value={notes}
              onChange={(event) => onNotes(event.target.value)}
              placeholder={t('classroom.guide.notesPlaceholder')}
            />
            <p className="guide-small">{t('classroom.guide.notesHint')}</p>
          </>
        )}
        {tool === 'source' && (
          <>
            <p>
              <bdi>{lesson.curriculumTitle}</bdi> · <bdi>{lesson.title}</bdi>
            </p>
            {lesson.sources.map((source) => (
              <section key={`${source.title}/${source.locator}`}>
                <p className="guide-bubble">
                  <b>
                    <bdi>{source.title}</bdi>
                  </b>
                  <br />
                  <bdi>{source.locator}</bdi>
                  <br />
                  <bdi>{source.availability}</bdi>
                </p>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {t('classroom.guide.openSource')}
                  </a>
                )}
              </section>
            ))}
            <p className="guide-small">{t('classroom.guide.sourceNote')}</p>
          </>
        )}
      </div>
      <footer>{t('classroom.guide.footer')}</footer>
    </aside>
  );
}
