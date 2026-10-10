import { useEffect, useRef } from 'react';
import { useVoice } from './voice/useVoice';
import { NovaIcon } from './NovaIcon';
import { ChatMessages } from './ChatMessages';
import type { Position, Quiz } from './types';
const labels = {
  idle: 'جاهزة لما تحب تبدأ',
  connecting: 'بنوصل المكالمة…',
  listening: 'Nova بتسمعك',
  speaking: 'Nova بتتكلم',
  paused: 'المكالمة متوقفة مؤقتًا',
};
export function practiceInstruction(quiz: Quiz | null) {
  if (!quiz)
    return 'The learner opened lesson help. Briefly greet them in Egyptian Arabic and ask what they want clarified at the current scene.';
  if (quiz.index >= quiz.questions.length)
    return 'The client practice is complete. Congratulate briefly; do not ask more quiz questions or invent a grade.';
  const q = quiz.questions[quiz.index];
  return `CLIENT PRACTICE STATE: ${JSON.stringify({ questionIndex: quiz.index, answered: quiz.revealed, english: q.english, arabic: q.arabic, options: q.options, ...(quiz.revealed ? { englishAnswer: q.englishAnswer, explanation: q.explanation } : {}) })}. ${quiz.revealed ? 'Explain feedback and wait for the Next button.' : 'Ask the English question with brief Arabic clarification; wait for their answer. Call answer_question only for an explicit option.'}`;
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
        {labels[voice.status]}
      </p>
      {voice.error && (
        <p role="alert" className="nova-error">
          {voice.error}
        </p>
      )}
      <div className="nova-voice-controls">
        {voice.status === 'idle' ? (
          <button
            className="nova-primary"
            disabled={!enabled}
            onClick={() => {
              sent.current = instruction;
              void voice.connect(instruction);
            }}
          >
            <NovaIcon name="voice" />
            ابدأ المكالمة
          </button>
        ) : (
          <>
            <button
              className="nova-secondary"
              disabled={voice.status === 'connecting'}
              aria-pressed={voice.muted}
              onClick={voice.mute}
            >
              <NovaIcon name={voice.muted ? 'muted' : 'mic'} />
              {voice.muted ? 'افتح الميكروفون' : 'كتم الميكروفون'}
            </button>
            <button
              className="nova-secondary"
              disabled={voice.status === 'connecting'}
              onClick={() => void voice.pause()}
            >
              {voice.status === 'paused' ? 'كمّل المكالمة' : 'توقف مؤقتًا'}
            </button>
            <button className="nova-hangup" onClick={voice.stop}>
              إنهاء الاتصال
            </button>
          </>
        )}
      </div>
      <small className="nova-footnote">
        الميكروفون يبدأ بإذنك فقط. تقدر تقاطع Nova أثناء الكلام.
      </small>
      {!!voice.messages.length && (
        <ChatMessages messages={voice.messages} loading={false} name={name} />
      )}
    </div>
  );
}
