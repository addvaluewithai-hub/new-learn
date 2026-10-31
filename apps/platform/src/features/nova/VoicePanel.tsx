import { useEffect, useRef } from 'react';
import { useVoice } from './voice/useVoice';
import { NovaIcon } from './NovaIcon';
import { ChatMessages } from './ChatMessages';
import type { Position, Quiz } from './types';
import { currentLocale, useI18n, type TextKey } from '../../i18n';

/** The learner's language for Nova: Egyptian Arabic, or the interface language in English. */
function novaLanguage() {
  const code = currentLocale();
  if (code === 'ar') return 'Egyptian Arabic';
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}
const labels: Record<ReturnType<typeof useVoice>['status'], TextKey> = {
  idle: 'nova.voice.status.idle',
  connecting: 'nova.voice.status.connecting',
  listening: 'nova.voice.status.listening',
  speaking: 'nova.voice.status.speaking',
  paused: 'nova.voice.status.paused',
};
export function practiceInstruction(quiz: Quiz | null) {
  if (!quiz)
    return `The learner opened lesson help. Briefly greet them in ${novaLanguage()} and ask what they want clarified at the current scene.`;
  if (quiz.index >= quiz.questions.length)
    return 'The client practice is complete. Congratulate briefly; do not ask more quiz questions or invent a grade.';
  const q = quiz.questions[quiz.index];
  return `CLIENT PRACTICE STATE: ${JSON.stringify({ questionIndex: quiz.index, answered: quiz.revealed, english: q.english, arabic: q.arabic, options: q.options, ...(quiz.revealed ? { englishAnswer: q.englishAnswer, explanation: q.explanation } : {}) })}. ${quiz.revealed ? 'Explain feedback and wait for the Next button.' : `Ask the English question with brief ${novaLanguage()} clarification; wait for their answer. Call answer_question only for an explicit option.`}`;
}
export function VoicePanel({
  position,
  name,
  enabled,
  quiz,
  answer,
}: {
  position: Position;
  name: string;
  enabled: boolean;
  quiz: Quiz | null;
  answer: (index: number, choice: number) => unknown;
}) {
  const { t } = useI18n();
  const voice = useVoice(position, answer);
  const sent = useRef('');
  const instruction = practiceInstruction(quiz);
  const ready = voice.status !== 'idle' && voice.status !== 'connecting';
  useEffect(() => {
    if (ready && instruction !== sent.current) {
      sent.current = instruction;
      voice.text(instruction);
    }
  }, [instruction, ready, voice.text]);
  return (
    <div className="nova-voice-panel">
      <div className={`nova-voice-orb ${voice.status}`} aria-hidden="true">
        <NovaIcon name={voice.muted ? 'muted' : 'mic'} size={34} />
      </div>
      <p role="status" className="nova-voice-status">
        {t(labels[voice.status])}
      </p>
      {voice.error && (
        <p role="alert" className="nl-alert nl-alert--error">
          {voice.error}
        </p>
      )}
      <div className="nova-voice-controls">
        {voice.status === 'idle' ? (
          <button
            className="nl-button nl-button--primary nl-button--sm"
            disabled={!enabled}
            onClick={() => {
              sent.current = instruction;
              void voice.connect(instruction);
            }}
          >
            <NovaIcon name="voice" />
            {t('nova.voice.start')}
          </button>
        ) : (
          <>
            <button
              className="nl-button nl-button--secondary nl-button--sm"
              disabled={voice.status === 'connecting'}
              aria-pressed={voice.muted}
              onClick={voice.mute}
            >
              <NovaIcon name={voice.muted ? 'muted' : 'mic'} />
              {voice.muted ? t('nova.voice.unmute') : t('nova.voice.mute')}
            </button>
            <button
              className="nl-button nl-button--secondary nl-button--sm"
              disabled={voice.status === 'connecting'}
              onClick={() => void voice.pause()}
            >
              {voice.status === 'paused' ? t('nova.voice.resume') : t('nova.voice.pause')}
            </button>
            <button className="nova-hangup" onClick={voice.stop}>
              {t('nova.voice.hangup')}
            </button>
          </>
        )}
      </div>
      <small className="nova-footnote">{t('nova.voice.footnote')}</small>
      {!!voice.messages.length && (
        <ChatMessages messages={voice.messages} loading={false} name={name} />
      )}
    </div>
  );
}
