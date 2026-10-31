import { useEffect, useState } from 'react';
import type { LessonContext, LessonController } from '@learn/lesson-runtime';
import { NovaIcon } from './NovaIcon';
import { NovaModal } from './NovaModal';
import { useChat } from './useChat';
import { useQuiz } from './useQuiz';
import { positionOf, type NovaMode, type NovaPurpose } from './types';
import { useI18n } from '../../i18n';
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
  const { t, dir } = useI18n();
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
          <span className="nova-eyebrow">{t('nova.assistant.endEyebrow')}</span>
          <h2>{t('nova.assistant.endTitle')}</h2>
          <p>{t('nova.assistant.endLead')}</p>
          <div>
            <button onClick={() => show('voice', 'quiz')}>
              <NovaIcon name="voice" size={26} />
              <span>
                {t('nova.assistant.voiceQuiz')}
                <small>{t('nova.assistant.voiceQuizHint')}</small>
              </span>
            </button>
            <button onClick={() => show('chat', 'quiz')}>
              <NovaIcon name="chat" size={26} />
              <span>
                {t('nova.assistant.chatQuiz')}
                <small>{t('nova.assistant.chatQuizHint')}</small>
              </span>
            </button>
          </div>
        </section>
      )}
      {!open && !hideCapsule && (
        <aside className="nova-capsule" aria-label={t('nova.assistant.capsule')} dir={dir}>
          <img
            src={lesson.guide?.image ?? '/lesson-assets/nova.webp'}
            alt=""
            width={48}
            height={48}
          />
          <span>{t('nova.assistant.ask')}</span>
          <button onClick={() => show('voice', 'help')} aria-label={t('nova.assistant.talkVoice')}>
            <NovaIcon name="voice" />
          </button>
          <button onClick={() => show('chat', 'help')} aria-label={t('nova.assistant.openChat')}>
            <NovaIcon name="chat" />
          </button>
        </aside>
      )}
      <NovaModal
        open={open}
        mode={mode}
        purpose={purpose}
        context={snapshot}
        name={studentName ?? t('nova.defaultName')}
        enabled={!!studentName}
        chat={chat}
        practice={practice}
        onMode={switchMode}
        onClose={close}
      />
    </>
  );
}
