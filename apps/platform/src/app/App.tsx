import { lazy, Suspense } from 'react';

const DevelopmentLesson = lazy(() => import('./DevelopmentLesson'));
const ChemistryLesson = lazy(() => import('./ChemistryLesson'));
const isProbe = new URLSearchParams(window.location.search).get('preview') === 'probe';

export function App() {
  return (
    <div className="app-shell">
      <Suspense fallback={<p role="status">بنجهّز مساحة الدرس…</p>}>
        {isProbe ? <DevelopmentLesson /> : <ChemistryLesson />}
      </Suspense>
    </div>
  );
}
