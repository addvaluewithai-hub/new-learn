import { lazy, Suspense } from 'react';
import { useSession } from '../auth/session';
import { useNavigation } from '../../app/navigation';
import { Loading } from '../../shared/Loading';

const AuthPage = lazy(() => import('../auth/AuthPage'));
const ReadingClassroom = lazy(() => import('../../app/ReadingClassroom'));
const load = () => import('../../../../../content/book-guided/physics-ch08/reading/client');

/** The normal classroom and normal authenticated Nova; only the lesson content differs. */
export default function BookLesson() {
  const session = useSession();
  const query = useNavigation();
  if (session.loading) return <Loading text="بنجهّز الدرس…" />;
  return (
    <Suspense fallback={<Loading text="بنجهّز مساحة الدرس…" />}>
      {!session.user ||
      query.has('token') ||
      ['login', 'signup', 'forgot', 'reset'].includes(query.get('auth') ?? '') ? (
        <AuthPage onLogin={session.refresh} error={session.error} />
      ) : (
        <ReadingClassroom load={load} backHref="/" studentName={session.user.name} preview />
      )}
    </Suspense>
  );
}
