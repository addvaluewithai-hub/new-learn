import { lazy, Suspense } from 'react';
import { useSession } from '../auth/session';
import { useNavigation } from '../../app/navigation';
import { Loading } from '../../shared/Loading';
import type { LessonContext } from '@learn/lesson-runtime';
import { BookReference } from './BookReference';
import { referencePart as reference9 } from '../../../../../content/book-guided/physics-ch09/reference';
const reference = (context: LessonContext | null) => <BookReference context={context} />;

const referenceChapter9 = (context: LessonContext | null) => (
  <BookReference context={context} resolve={reference9} assetBase="/book-ch09" />
);
const loadChapter9 = () => import('../../../../../content/book-guided/physics-ch09/reading/client');

const AuthPage = lazy(() => import('../auth/AuthPage'));
const ReadingClassroom = lazy(() => import('../../app/ReadingClassroom'));
const load = () => import('../../../../../content/book-guided/physics-ch08/reading/client');

/** The normal classroom and normal authenticated Nova; only the lesson content differs. */
export default function BookLesson({ chapter = 8 }: { chapter?: 8 | 9 }) {
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
        <ReadingClassroom
          load={chapter === 9 ? loadChapter9 : load}
          backHref="/"
          studentName={session.user.name}
          reference={chapter === 9 ? referenceChapter9 : reference}
          preview
        />
      )}
    </Suspense>
  );
}
