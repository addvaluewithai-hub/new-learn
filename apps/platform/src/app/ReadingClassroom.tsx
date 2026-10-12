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
import { useReadingProgress, type SaveState } from '../features/progress/useReadingProgress';
import { NovaBar } from '../features/classroom/NovaBar';
import { lessonHref, nextImported } from '../features/catalog/plan';
import '../features/classroom/reading-classroom.css';

export type ReadingModule = { readingLesson: ReadingPackage; readingRenderers: RendererRegistry };
const SAVE: Record<SaveState, string> = {
  idle: '',
  saving: 'بنحفظ…',
  saved: 'اتحفظ',
  offline: 'مش متصل',
};

/** Full-screen reading lesson: the runtime stage, saved progress and Nova in the controls. */
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
  const [ask, setAsk] = useState<{ id: number; text: string; mode?: 'chat' | 'voice' } | null>(
    null,
  );
  const onReady = useCallback((value: LessonController | null) => setController(value), []);
  const saved = useReadingProgress(module?.readingLesson ?? null);
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
  useEffect(() => {
    document.documentElement.classList.add('in-lesson');
    return () => document.documentElement.classList.remove('in-lesson');
  }, []);
  if (error)
    return (
      <main className="platform-ui lesson-entry-message">
        <p role="alert">{error}</p>
        <a href={backHref}>ارجع للمنهج</a>
      </main>
    );
  if (!module || saved.initial === null)
    return (
      <div className="reading-classroom reading-loading" role="status">
        <span className="reading-spinner" aria-hidden />
        بنجهّز الدرس…
      </div>
    );
  const lesson = module.readingLesson;
  const next = nextImported(lesson.curriculumId, lesson.lessonId);
  return (
    <div className="reading-classroom">
      <ReadingLesson
        lesson={lesson}
        registry={module.readingRenderers}
        initial={saved.initial}
        suspended={assistantOpen}
        onContext={setContext}
        onReady={onReady}
        onProgress={saved.record}
        exit={{ label: 'ارجع للمنهج', href: backHref }}
        next={next ? { title: next.title, href: lessonHref(lesson.curriculumId, next.id) } : null}
        status={
          SAVE[saved.status] ? (
            <span className="reading-save" data-state={saved.status}>
              {SAVE[saved.status]}
            </span>
          ) : null
        }
        assistant={<NovaBar onAsk={(text, mode) => setAsk({ id: Date.now(), text, mode })} />}
      />
      <NovaAssistant
        lesson={{}}
        studentName={studentName}
        context={context}
        controller={controller}
        onOpen={setAssistantOpen}
        ask={ask}
        hideCapsule
      />
    </div>
  );
}
