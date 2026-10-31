import { CourseArt } from '../../shared/CourseArt';
import { stats } from './plan';
import type { Curriculum } from './types';
import { ButtonLink, EmptyState } from '../../shared/ui';
import { useI18n } from '../../i18n';

/** Courses as calm rows: what it is, how far you are, one way in. */
export function CurriculumCards({ curricula }: { curricula: Curriculum[] }) {
  const { t } = useI18n();
  return (
    <section className="courses" aria-labelledby="courses-title">
      <div className="section-heading">
        <h2 id="courses-title">{t('catalog.cards.title')}</h2>
        <span>{t('catalog.cards.count', { count: curricula.length })}</span>
      </div>
      <ul className="course-list">
        {curricula.map((group) => {
          const s = stats(group);
          const percent = s.lessons ? Math.round((100 * s.completed) / s.lessons) : 0;
          const href = `/?curriculum=${encodeURIComponent(group.id)}`;
          return (
            <li className="course-row" key={group.id}>
              <span className="course-badge" aria-hidden="true">
                <CourseArt badge subject={group.subject} math={/math|رياض/i.test(group.subject)} />
              </span>
              <div className="course-copy">
                <span className="eyebrow">{group.subject}</span>
                <h3>
                  <a href={href}>{group.title}</a>
                </h3>
                <p>{group.description}</p>
                <div className="course-progress">
                  <span className="pick-bar" aria-hidden="true">
                    <i style={{ inlineSize: `${percent}%` }} />
                  </span>
                  <span>
                    {t('catalog.cards.done', { completed: s.completed, total: s.lessons })}
                    <span className="course-available">
                      {' '}
                      · {t('catalog.cards.available', { count: s.available })}
                    </span>
                  </span>
                </div>
              </div>
              <ButtonLink variant="secondary" className="course-open" href={href}>
                {t('catalog.cards.open')}
              </ButtonLink>
            </li>
          );
        })}
      </ul>
      {!curricula.length && (
        <EmptyState title={t('catalog.cards.emptyTitle')}>
          {t('catalog.cards.emptyText')}
        </EmptyState>
      )}
    </section>
  );
}
