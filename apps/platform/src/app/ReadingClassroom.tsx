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
import { NovaOrb, TalkComposer } from '../features/nova/lesson/TalkControls';
import { useLessonTalk } from '../features/nova/lesson/useLessonTalk';
import { useSpaceToTalk } from '../features/nova/lesson/useSpaceToTalk';
import { LessonSettings } from '../features/nova/lesson/LessonSettings';
import { useLessonFlow, useNarrator } from '../features/nova/lesson/useLessonFlow';
import { lessonHref, nextImported } from '../features/catalog/plan';
import '../features/classroom/reading-classroom.css';

export type ReadingModule = { readingLesson: ReadingPackage; readingRenderers: RendererRegistry };
const SAVE: Record<SaveState, string> = {
  idle: '',
  saving: 'بنحفظ…',
  saved: 'اتحفظ',
  offline: 'مش متصل',
};

/** Full-screen reading lesson: the runtime stage, saved progress, and Nova in the conversation. */
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
  const flow = useLessonFlow();
  const moving = flow.settings.narration || flow.settings.pace !== null;
  // Asking Nova pauses a lesson that moves alone, so the answer can be read in peace.
  const talk = useLessonTalk(context, () => moving && flow.setPaused(true));
  useSpaceToTalk(talk.voice, Boolean(module) && !assistantOpen);
  const { setVolume, read, stopReading } = talk.voice;
  useEffect(() => setVolume(flow.settings.volume), [flow.settings.volume, setVolume]);
  useNarrator({
    enabled: flow.settings.narration && !assistantOpen,
    paused: flow.paused,
    context,
    controller,
    read,
    stop: stopReading,
    onFail: () => {
      flow.change({ narration: false });
      talk.notify('مقدرتش أقرا الدرس بصوتي دلوقتي، فقفلت القراية. جرّب تشغّلها تاني بعد شوية.');
    },
  });
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
        flow={{
          pace: flow.settings.pace,
          narrating: flow.settings.narration,
          speaking: talk.voice.state === 'reading',
          paused: flow.paused,
          onPausedChange: flow.setPaused,
        }}
        tools={<LessonSettings settings={flow.settings} onChange={flow.change} />}
        conversation={{
          tutor: 'Nova',
          notes: talk.notes,
          busy: talk.busy,
          onAsk: talk.ask,
          open: talk.open,
          onOpenChange: talk.setOpen,
          composer: <TalkComposer voice={talk.voice} busy={talk.busy} onAsk={talk.ask} />,
          orb: <NovaOrb voice={talk.voice} onTap={() => talk.setOpen(!talk.open)} />,
        }}
      />
      <NovaAssistant
        lesson={{}}
        studentName={studentName}
        context={context}
        controller={controller}
        onOpen={setAssistantOpen}
        hideCapsule
      />
    </div>
  );
}
