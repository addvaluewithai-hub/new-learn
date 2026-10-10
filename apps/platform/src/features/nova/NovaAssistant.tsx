import { useState } from 'react';
import type { LessonContext, LessonController, LessonPackage } from '@learn/lesson-runtime';
import { NovaIcon } from './NovaIcon';
import { NovaModal } from './NovaModal';
import { useChat } from './useChat';
import { useQuiz } from './useQuiz';
import type { NovaMode, NovaPurpose } from './types';
import './nova.css';
import './nova-chat.css';
import './nova-practice.css';
export function NovaAssistant({
  lesson,
  studentName,
  context,
  controller,
  onOpen,
}: {
  lesson: LessonPackage;
  studentName?: string;
  context: LessonContext | null;
  controller: LessonController | null;
  onOpen: (open: boolean) => void;
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
      {!open && (
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
