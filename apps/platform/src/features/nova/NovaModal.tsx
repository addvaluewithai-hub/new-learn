import { useEffect, useRef } from 'react';
import type { LessonContext } from '@learn/lesson-runtime';
import { NovaIcon } from './NovaIcon';
import { ChatPanel } from './ChatPanel';
import { VoicePanel } from './VoicePanel';
import { QuizPanel } from './QuizPanel';
import { positionOf, type NovaMode, type NovaPurpose } from './types';
import type { useChat } from './useChat';
import type { useQuiz } from './useQuiz';
export function NovaModal({
  open,
  mode,
  purpose,
  context,
  name,
  enabled,
  chat,
  practice,
  onMode,
  onClose,
}: {
  open: boolean;
  mode: NovaMode;
  purpose: NovaPurpose;
  context: LessonContext | null;
  name: string;
  enabled: boolean;
  chat: ReturnType<typeof useChat>;
  practice: ReturnType<typeof useQuiz>;
  onMode: (mode: NovaMode) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const position = context ? positionOf(context) : null;
  return (
    <dialog
      className="nova-modal"
      ref={dialog}
      aria-labelledby="nova-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) {
          const box = dialog.current.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
      dir="rtl"
    >
      {open && (
        <>
          <header className="nova-modal-header">
            <div>
              <span className="nova-avatar">N</span>
              <div>
                <h2 id="nova-title">
                  Nova <small>{purpose === 'quiz' ? 'تدريب على الدرس' : 'مساعدتك في الدرس'}</small>
                </h2>
                <p>
                  <span className="nova-status-dot" />{' '}
                  {mode === 'chat'
                    ? chat.loading
                      ? 'بتجهّز الرد'
                      : 'جاهزة لسؤالك'
                    : 'محادثة صوتية'}
                </p>
              </div>
            </div>
            <button className="nova-icon-button" aria-label="إغلاق نوفا" onClick={onClose}>
              <NovaIcon name="close" />
            </button>
          </header>
          <div className="nova-context">
            <span>
              <NovaIcon name="pause" size={15} />
              الدرس متوقف هنا
            </span>
            <strong>{context?.sceneTitle ?? 'بنجهّز سياق الدرس…'}</strong>
            {context?.excerpt && <p>{context.excerpt}</p>}
          </div>
          <div className="nova-tabs" role="group" aria-label="طريقة المحادثة">
            <button aria-pressed={mode === 'chat'} onClick={() => onMode('chat')}>
              <NovaIcon name="chat" />
              شات
            </button>
            <button aria-pressed={mode === 'voice'} onClick={() => onMode('voice')}>
              <NovaIcon name="voice" />
              صوت
            </button>
          </div>
          <div className={`nova-modal-body ${purpose === 'quiz' ? 'is-quiz' : ''}`}>
            {position && purpose === 'quiz' && (
              <QuizPanel practice={practice} position={position} enabled={enabled} />
            )}
            {position && mode === 'voice' && (
              <VoicePanel
                position={position}
                name={name}
                enabled={enabled && (purpose !== 'quiz' || !!practice.quiz)}
                quiz={purpose === 'quiz' ? practice.quiz : null}
                answer={
                  purpose === 'quiz'
                    ? practice.answer
                    : () => ({
                        error: 'No active voice practice. Help the learner without grading.',
                      })
                }
              />
            )}
            {position && mode === 'chat' && purpose === 'help' && (
              <ChatPanel chat={chat} position={position} name={name} enabled={enabled} />
            )}
          </div>
          {!enabled && (
            <p className="nova-error">
              المعاينة بدون حساب. افتح الدرس من المنهج بعد تسجيل الدخول لاستخدام المساعد.
            </p>
          )}
          <footer className="nova-modal-footer">
            <span>المحادثة والتدريب في الجلسة الحالية فقط.</span>
            <button onClick={onClose}>ارجع للدرس</button>
          </footer>
        </>
      )}
    </dialog>
  );
}
