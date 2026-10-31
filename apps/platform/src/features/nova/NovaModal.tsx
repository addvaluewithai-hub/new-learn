import { useEffect, useRef } from 'react';
import type { LessonContext } from '@learn/lesson-runtime';
import { NovaIcon } from './NovaIcon';
import { ChatPanel } from './ChatPanel';
import { VoicePanel } from './VoicePanel';
import { QuizPanel } from './QuizPanel';
import { positionOf, type NovaMode, type NovaPurpose } from './types';
import type { useChat } from './useChat';
import type { useQuiz } from './useQuiz';
import { useI18n } from '../../i18n';
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
  const { t, dir } = useI18n();
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
      dir={dir}
    >
      {open && (
        <>
          <header className="nova-modal-header">
            <div>
              <span className="nova-avatar">N</span>
              <div>
                <h2 id="nova-title">
                  Nova{' '}
                  <small>
                    {purpose === 'quiz' ? t('nova.modal.purposeQuiz') : t('nova.modal.purposeHelp')}
                  </small>
                </h2>
                <p>
                  <span className="nova-status-dot" />{' '}
                  {mode === 'chat'
                    ? chat.loading
                      ? t('nova.modal.statusLoading')
                      : t('nova.modal.statusReady')
                    : t('nova.modal.statusVoice')}
                </p>
              </div>
            </div>
            <button
              className="nova-icon-button"
              aria-label={t('nova.modal.close')}
              onClick={onClose}
            >
              <NovaIcon name="close" />
            </button>
          </header>
          <div className="nova-context">
            <span>
              <NovaIcon name="pause" size={15} />
              {t('nova.modal.paused')}
            </span>
            <strong>
              {context?.sceneTitle != null ? (
                <bdi>{context.sceneTitle}</bdi>
              ) : (
                t('nova.modal.loadingContext')
              )}
            </strong>
            {context?.excerpt && (
              <p>
                <bdi>{context.excerpt}</bdi>
              </p>
            )}
          </div>
          <div className="nova-tabs" role="group" aria-label={t('nova.modal.modes')}>
            <button aria-pressed={mode === 'chat'} onClick={() => onMode('chat')}>
              <NovaIcon name="chat" />
              {t('nova.modal.chat')}
            </button>
            <button aria-pressed={mode === 'voice'} onClick={() => onMode('voice')}>
              <NovaIcon name="voice" />
              {t('nova.modal.voice')}
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
          {!enabled && <p className="nl-alert nl-alert--error">{t('nova.modal.previewOnly')}</p>}
          <footer className="nova-modal-footer">
            <span>{t('nova.modal.sessionOnly')}</span>
            <button onClick={onClose}>{t('nova.modal.backToLesson')}</button>
          </footer>
        </>
      )}
    </dialog>
  );
}
