import { lazy, Suspense } from 'react';

const DevelopmentLesson = lazy(() => import('./DevelopmentLesson'));

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <strong lang="en" dir="ltr">
          learn<span>.</span>
        </strong>
        <span>مساحة تجربة المنصة الجديدة</span>
      </header>
      <Suspense fallback={<p role="status">بنجهّز مساحة الدرس…</p>}>
        <DevelopmentLesson />
      </Suspense>
    </div>
  );
}
