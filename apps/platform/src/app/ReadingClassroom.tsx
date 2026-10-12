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
import { NovaIcon } from '../features/nova/NovaIcon';
import { useReadingProgress } from '../features/progress/useReadingProgress';
import '../features/classroom/reading-classroom.css';

export type ReadingModule = { readingLesson: ReadingPackage; readingRenderers: RendererRegistry };
const SAVE_LABEL = {
  idle: '',
  saving: 'بنحفظ…',
  saved: 'اتحفظ تقدمك',
  offline: 'مش متصل، هنحفظ تاني',
};

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
  const [question, setQuestion] = useState('');
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
  if (error)
    return (
      <main className="platform-ui lesson-entry-message">
        <p role="alert">{error}</p>
        <a href={backHref}>ارجع للمنهج</a>
      </main>
    );
  if (!module || saved.initial === null) return <p role="status">بنجهّز الدرس…</p>;
  const lesson = module.readingLesson;
  const send = (mode: 'chat' | 'voice') => {
    setAsk({ id: Date.now(), text: mode === 'chat' ? question : '', mode });
    setQuestion('');
  };
  const dock = (
    <form
      className="reading-ask"
      onSubmit={(event) => {
        event.preventDefault();
        send('chat');
      }}
    >
      <input
        aria-label="اسأل Nova عن الخطوة دي"
        placeholder="اسأل Nova عن الخطوة دي…"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <button type="button" aria-label="كلّم Nova بالصوت" onClick={() => send('voice')}>
        <NovaIcon name="voice" />
      </button>
      <button type="submit" aria-label="ابعت السؤال لـ Nova" disabled={!question.trim()}>
        <NovaIcon name="send" />
      </button>
    </form>
  );
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
        <span className="reading-save" role="status" data-state={saved.status}>
          {SAVE_LABEL[saved.status]}
        </span>
      </header>
      <main className="reading-classroom-main">
        <ReadingLesson
          lesson={lesson}
          registry={module.readingRenderers}
          initial={saved.initial}
          suspended={assistantOpen}
          onContext={setContext}
          onReady={onReady}
          onProgress={saved.record}
          dock={dock}
          finish={{ label: 'ارجع للمنهج', href: backHref }}
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
      </main>
    </div>
  );
}
