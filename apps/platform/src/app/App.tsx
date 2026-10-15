import { lazy, Suspense } from 'react';
import { useSession } from '../features/auth/session';
import { useNavigation } from './navigation';
import { Loading } from '../shared/Loading';

const DevelopmentLesson = lazy(() => import('./DevelopmentLesson'));
const ChemistryLesson = lazy(() => import('./ChemistryLesson'));
const BookLesson = lazy(() => import('../features/book/BookLesson'));
const AuthPage = lazy(() => import('../features/auth/AuthPage'));
const CatalogPage = lazy(() => import('../features/catalog/CatalogPage'));
const LessonEntry = lazy(() => import('../features/catalog/LessonEntry'));

function StudentApp() {
  const session = useSession(),
    query = useNavigation();
  if (session.loading) return <Loading text="بنجهّز مساحة تعلّمك…" />;
  if (
    !session.user ||
    query.has('token') ||
    ['login', 'signup', 'forgot', 'reset'].includes(query.get('auth') ?? '')
  )
    return <AuthPage onLogin={session.refresh} error={session.error} />;
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
  const preview = new URLSearchParams(location.search).get('preview');
  return (
    <div className="app-shell">
      <Suspense fallback={<Loading text="بنجهّز مساحة الدرس…" />}>
        {preview === 'book-ch08' ? (
          <BookLesson />
        ) : preview === 'probe' ? (
          <DevelopmentLesson />
        ) : preview === 'chemistry' ? (
          <ChemistryLesson />
        ) : (
          <StudentApp />
        )}
      </Suspense>
    </div>
  );
}
