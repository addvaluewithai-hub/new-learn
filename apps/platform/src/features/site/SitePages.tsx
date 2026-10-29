import { lazy } from 'react';
import type { SitePage } from './routes';

const TeachersPage = lazy(() => import('./TeachersPage'));
const SupportPage = lazy(() => import('./SupportPage'));
const Legal = lazy(() => import('./LegalPage').then((m) => ({ default: m.PrivacyPage })));
const Terms = lazy(() => import('./LegalPage').then((m) => ({ default: m.TermsPage })));

/** One of the website's pages, by its path (routes.ts). */
export default function SitePages({ page }: { page: SitePage }) {
  if (page === 'teachers') return <TeachersPage />;
  if (page === 'support') return <SupportPage />;
  if (page === 'privacy') return <Legal />;
  return <Terms />;
}
