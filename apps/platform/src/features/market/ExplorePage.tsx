import { useEffect, useMemo, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { Alert, Badge, EmptyState, PageSkeleton, TextInput } from '../../shared/ui';
import { useI18n, type TextKey } from '../../i18n';
import { formatPrice } from '../credits/format';
import { courseHref } from '../courses/types';
import { isGrade } from './grades';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import './market.css';

type Listed = {
  id: string;
  title: string;
  subject: string;
  description: string;
  language: string;
  grade: string;
  teacher: string;
  priceCents: number;
  currency: string;
  lessons: number;
};
type Facets = { subjects: string[]; languages: string[]; grades: string[] };
type Filters = { q: string; subject: string; language: string; grade: string };
const EMPTY: Filters = { q: '', subject: '', language: '', grade: '' };

/** `?explore`: the marketplace, the courses teachers listed and the platform reviewed (M1). */
export default function ExplorePage({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [courses, setCourses] = useState<Listed[] | null>(null);
  const [facets, setFacets] = useState<Facets>({ subjects: [], languages: [], grades: [] });
  const [error, setError] = useState('');
  useEffect(() => {
    // Typing waits a moment before asking; the selects ask at once.
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v.trim()) as string[][],
      );
      api<{ courses: Listed[]; facets: Facets }>(`/courses/market?${query}`).then(
        (r) => {
          setCourses(r.courses);
          setFacets(r.facets);
          setError('');
        },
        (e) => setError(e.message),
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters]);
  const languages = useMemo(() => {
    try {
      const names = new Intl.DisplayNames([locale], { type: 'language' });
      return (code: string) => names.of(code) ?? code;
    } catch {
      return (code: string) => code;
    }
  }, [locale]);
  const grade = (g: string) => (isGrade(g) ? t(`market.grades.${g}`) : '');
  const set = (key: keyof Filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const select = (key: 'subject' | 'language' | 'grade', label: TextKey, values: string[]) => (
    <label>
      <span>{t(label)}</span>
      <select value={filters[key]} onChange={(e) => set(key)(e.target.value)}>
        <option value="">{t('market.explore.any')}</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {key === 'language' ? languages(v) : key === 'grade' ? grade(v) : v}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="explore">
      <div className="page-heading">
        <h1>{t('market.explore.title')}</h1>
        <p>{t('market.explore.lead')}</p>
      </div>
      <div className="market-filters" role="search">
        <label className="market-search">
          <span>{t('market.explore.search')}</span>
          <TextInput
            type="search"
            value={filters.q}
            onChange={(e) => set('q')(e.target.value)}
            placeholder={t('market.explore.searchHint')}
          />
        </label>
        {select('subject', 'market.explore.subject', facets.subjects)}
        {select('grade', 'market.explore.grade', facets.grades)}
        {select('language', 'market.explore.language', facets.languages)}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {!courses ? (
        !error && <PageSkeleton label={t('market.explore.loading')} rows={3} />
      ) : courses.length === 0 ? (
        <EmptyState
          title={t(
            Object.values(filters).some(Boolean)
              ? 'market.explore.noMatch'
              : 'market.explore.empty',
          )}
        />
      ) : (
        <ul className="market-grid">
          {courses.map((c) => (
            <li key={c.id} className="market-card">
              <span className="eyebrow">
                <bdi>{[c.subject, grade(c.grade)].filter(Boolean).join(' · ')}</bdi>
              </span>
              <h2>
                <a href={courseHref(c.id)}>
                  <bdi>{c.title}</bdi>
                </a>
              </h2>
              {c.description && (
                <p>
                  <bdi>{c.description}</bdi>
                </p>
              )}
              <footer>
                <span>
                  <bdi>{c.teacher}</bdi> · {t('market.explore.lessons', { count: c.lessons })} ·{' '}
                  {languages(c.language)}
                </span>
                <Badge tone={c.priceCents ? 'accent' : 'success'}>
                  {c.priceCents ? formatPrice(c.priceCents, c.currency, locale) : t('market.free')}
                </Badge>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </LibraryShell>
  );
}
