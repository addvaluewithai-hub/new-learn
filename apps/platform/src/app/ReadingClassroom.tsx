import { useCallback, useEffect, useState } from 'react';
import { ReadingLesson } from '@learn/lesson-runtime';
import type {
  LessonContext,
  LessonController,
  ReadingPackage,
  RendererRegistry,
} from '@learn/lesson-runtime';
import '@learn/lesson-runtime/style.css';
import { NovaAssistant } from '../features/nova/NovaAssistant';
import '../features/classroom/reading-classroom.css';

export type ReadingModule = { readingLesson: ReadingPackage; readingRenderers: RendererRegistry };

/** Text-first lesson page: the lesson's board, its written explanation, and Nova. */
export default function ReadingClassroom({
  load,
  backHref,
  studentName,
}: {
  load: () => Promise<ReadingModule>;
  backHref: string;
  studentName: string;
}) {
  const [module, setModule] = useState<ReadingModule | null>(null);
  const [error, setError] = useState('');
  const [context, setContext] = useState<LessonContext | null>(null);
  const [controller, setController] = useState<LessonController | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const onReady = useCallback((value: LessonController | null) => setController(value), []);
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setModule(value),
      () => live && setError('تعذّر تحميل الدرس. اتأكد من النت وجرّب تاني.'),
    );
    return () => {
      live = false;
    };
  }, [load]);
  if (error)
    return (
      <main className="platform-ui lesson-entry-message">
        <p role="alert">{error}</p>
        <a href={backHref}>ارجع للمنهج</a>
      </main>
    );
  if (!module) return <p role="status">بنجهّز الدرس…</p>;
  const lesson = module.readingLesson;
  return (
    <div className="reading-classroom">
      <header className="reading-classroom-header">
        <a href={backHref} className="reading-classroom-back">
          <span aria-hidden="true">→</span> ارجع للمنهج
        </a>
        <h1>
          {lesson.title}
          {lesson.englishTitle !== lesson.title ? (
            <small lang="en" dir="ltr">
              {lesson.englishTitle}
            </small>
          ) : null}
        </h1>
      </header>
      <main className="reading-classroom-main">
        <ReadingLesson
          lesson={lesson}
          registry={module.readingRenderers}
          suspended={assistantOpen}
          onContext={setContext}
          onReady={onReady}
          finish={{ label: 'ارجع للمنهج', href: backHref }}
        />
        <NovaAssistant
          lesson={{}}
          studentName={studentName}
          context={context}
          controller={controller}
          onOpen={setAssistantOpen}
        />
      </main>
    </div>
  );
}
