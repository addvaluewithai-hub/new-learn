import { useEffect, useState } from 'react';
import type { LessonContext, LessonController } from '@learn/lesson-runtime';
import { NovaIcon } from './NovaIcon';
import { NovaModal } from './NovaModal';
import { useChat } from './useChat';
import { useQuiz } from './useQuiz';
import { positionOf, type NovaMode, type NovaPurpose } from './types';
import './nova.css';
import './nova-chat.css';
import './nova-practice.css';
export function NovaAssistant({
  lesson,
  studentName,
  context,
  controller,
  onOpen,
  ask,
  hideCapsule,
}: {
  lesson: { guide?: { image: string } };
  studentName?: string;
  context: LessonContext | null;
  controller: LessonController | null;
  onOpen: (open: boolean) => void;
  /** A question typed in the lesson's own bar: opens the chat and sends it. */
  ask?: { id: number; text: string; mode?: NovaMode } | null;
  /** The host shows its own entry point (e.g. the lesson bar). */
  hideCapsule?: boolean;
}) {
  const [mode, setMode] = useState<NovaMode>('chat'),
    [purpose, setPurpose] = useState<NovaPurpose>('help'),
    [open, setOpen] = useState(false),
    [snapshot, setSnapshot] = useState<LessonContext | null>(null);
  const chat = useChat(),
    practice = useQuiz();
  function show(next: NovaMode, goal: NovaPurpose) {
    controller?.pause();
    setSnapshot(controller?.getContext() ?? context);
    setMode(next);
    setPurpose(goal);
    setOpen(true);
    onOpen(true);
  }
  useEffect(() => {
    if (!ask) return;
    const snap = controller?.getContext() ?? context;
    show(ask.mode ?? 'chat', 'help');
    if (snap && ask.mode !== 'voice' && ask.text.trim()) void chat.send(ask.text, positionOf(snap));
    // Only a new request (id) opens the chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask?.id]);
  function close() {
    chat.stop();
    practice.stop();
    setOpen(false);
    onOpen(false);
  }
  function switchMode(next: NovaMode) {
    chat.stop();
    setMode(next);
  }
  return (
    <>
      {context?.phase === 'complete' && (
        <section className="nova-end-practice">
          <span className="nova-eyebrow">ثبّت اللي اتعلمته</span>
          <h2>جاهز لاختبار سريع على الدرس؟</h2>
          <p>عشر أسئلة، ومع كل إجابة نفهم السبب. اختار الطريقة اللي تريحك.</p>
          <div>
            <button onClick={() => show('voice', 'quiz')}>
              <NovaIcon name="voice" size={26} />
              <span>
                اختبار بالصوت<small>اتكلم مع Nova</small>
              </span>
            </button>
            <button onClick={() => show('chat', 'quiz')}>
              <NovaIcon name="chat" size={26} />
              <span>
                اختبار بالشات<small>سؤال وإجابة خطوة بخطوة</small>
              </span>
            </button>
          </div>
        </section>
      )}
      {!open && !hideCapsule && (
        <aside className="nova-capsule" aria-label="مساعدة نوفا">
          <img
            src={lesson.guide?.image ?? '/lesson-assets/nova.webp'}
            alt=""
            width={48}
            height={48}
          />
          <span>اسأل Nova</span>
          <button onClick={() => show('voice', 'help')} aria-label="كلم نوفا بالصوت">
            <NovaIcon name="voice" />
          </button>
          <button onClick={() => show('chat', 'help')} aria-label="افتح شات نوفا">
            <NovaIcon name="chat" />
          </button>
        </aside>
      )}
      <NovaModal
        open={open}
        mode={mode}
        purpose={purpose}
        context={snapshot}
        name={studentName ?? 'يا صديقي'}
        enabled={!!studentName}
        chat={chat}
        practice={practice}
        onMode={switchMode}
        onClose={close}
      />
    </>
  );
}
