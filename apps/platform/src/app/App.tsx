import { lazy, Suspense } from 'react';
import { useSession } from '../features/auth/session';
import { useNavigation } from './navigation';
import { sitePage } from '../features/site/routes';
import { Loading } from '../shared/Loading';
import { RuntimeTextProvider } from '@learn/lesson-runtime';
import { useI18n, useRuntimeText } from '../i18n';

const DevelopmentLesson = lazy(() => import('./DevelopmentLesson'));
const ChemistryLesson = lazy(() => import('./ChemistryLesson'));
const BoardPreview = lazy(() => import('./BoardPreview'));
const DemoGallery = lazy(() => import('./DemoGallery'));
const UiGallery = lazy(() => import('./UiGallery'));
const BookLesson = lazy(() => import('../features/book/BookLesson'));
const AuthPage = lazy(() => import('../features/auth/AuthPage'));
const CatalogPage = lazy(() => import('../features/catalog/CatalogPage'));
const LessonEntry = lazy(() => import('../features/catalog/LessonEntry'));
const DraftLesson = lazy(() => import('../features/authoring/DraftLesson'));
const Consent = lazy(() => import('../features/authoring/Consent'));
const StudioPage = lazy(() => import('../features/studio/StudioPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const Landing = lazy(() => import('../features/landing/Landing'));
const TeachPage = lazy(() => import('../features/teach/TeachPage'));
const CoursePage = lazy(() => import('../features/courses/CoursePage'));
const CourseLesson = lazy(() => import('../features/courses/CourseLesson'));
const SitePages = lazy(() => import('../features/site/SitePages'));
const CreditsPage = lazy(() => import('../features/credits/CreditsPage'));
const ReviewPage = lazy(() => import('../features/review/ReviewPage'));

function StudentApp() {
  const session = useSession(),
    query = useNavigation();
  const { t } = useI18n();
  if (session.loading) return <Loading text={t('common.loadingSpace')} />;
  // A visitor at the bare address (a language choice aside) sees the front page; any other
  // address still asks to sign in.
  const bare = [...new URLSearchParams(location.search).keys()].every((key) => key === 'lang');
  if (!session.user && bare) return <Landing />;
  if (
    !session.user ||
    query.has('token') ||
    ['login', 'signup', 'forgot', 'reset'].includes(query.get('auth') ?? '')
  )
    return <AuthPage onLogin={session.refresh} error={session.error} />;
  if (query.get('oauth') === 'consent')
    return <Consent query={query} userName={session.user.name} />;
  if (query.has('settings'))
    return (
      <SettingsPage user={session.user} onSignOut={session.signOut} onSaved={session.refresh} />
    );
  if (query.has('credits')) return <CreditsPage user={session.user} onSignOut={session.signOut} />;
  if (query.has('review'))
    return (
      <ReviewPage
        user={session.user}
        onSignOut={session.signOut}
        item={query.get('review') || null}
      />
    );
  if (query.has('teach'))
    return (
      <TeachPage user={session.user} onSignOut={session.signOut} courseId={query.get('course')} />
    );
  const courseId = query.get('course');
  if (courseId && query.get('lesson'))
    return (
      <CourseLesson
        key={query.get('lesson')}
        courseId={courseId}
        lessonId={query.get('lesson')!}
        studentName={session.user.name}
      />
    );
  if (courseId)
    return <CoursePage user={session.user} onSignOut={session.signOut} courseId={courseId} />;
  if (query.has('studio'))
    return <StudioPage user={session.user} onSignOut={session.signOut} jobId={query.get('job')} />;
  const draftId = query.get('draft');
  if (draftId)
    return <DraftLesson key={draftId} lessonId={draftId} studentName={session.user.name} />;
  const lessonId = query.get('lesson'),
    curriculumId = query.get('curriculum');
  return lessonId ? (
    <LessonEntry
      key={lessonId}
      lessonId={lessonId}
      curriculumId={curriculumId}
      studentName={session.user.name}
    />
  ) : (
    <CatalogPage user={session.user} onSignOut={session.signOut} curriculumId={curriculumId} />
  );
}

export function App() {
  const { t } = useI18n();
  const runtimeText = useRuntimeText();
  const preview = new URLSearchParams(location.search).get('preview');
  // The website's own pages (/teachers, /privacy, …) are public; the app lives at `/`.
  const site = sitePage(location.pathname);
  return (
    <div className="app-shell">
      {/* The lesson player's own texts follow the app's language. */}
      <RuntimeTextProvider value={runtimeText}>
        <Suspense fallback={<Loading text={t('common.loadingLesson')} />}>
          {site ? (
            <SitePages page={site} />
          ) : preview === 'book-ch08' ? (
            <BookLesson />
          ) : preview === 'book-ch09' ? (
            <BookLesson chapter={9} />
          ) : preview === 'probe' ? (
            <DevelopmentLesson />
          ) : preview === 'chemistry' ? (
            <ChemistryLesson />
          ) : preview === 'board' ? (
            <BoardPreview />
          ) : preview === 'demo' ? (
            <BoardPreview demo={new URLSearchParams(location.search).get('id')} />
          ) : preview === 'demos' || preview === 'visuals' ? (
            <DemoGallery />
          ) : preview === 'ui' ? (
            <UiGallery />
          ) : preview === 'landing' ? (
            <Landing />
          ) : (
            <StudentApp />
          )}
        </Suspense>
      </RuntimeTextProvider>
    </div>
  );
}
