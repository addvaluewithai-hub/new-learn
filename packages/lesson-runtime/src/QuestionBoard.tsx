import { AbsoluteFill } from 'remotion';
import { visibleQuestionParts } from './cues';
import type { LessonLayout, LessonQuestion, LessonRecording } from './types';

export function QuestionBoard({
  question,
  recording,
  frame,
  fps,
  layout,
  feedback,
}: {
  question: LessonQuestion;
  recording: LessonRecording;
  frame: number;
  fps: number;
  layout: LessonLayout;
  feedback: boolean;
}) {
  const portrait = layout === 'portrait';
  const answerAt =
    recording.cues.find((cue) => cue.id === 'answer')?.atMs ?? recording.words![0].start_ms;
  const parts = feedback
    ? (
        question.feedbackParts ?? [
          { text: question.englishAnswer, language: 'en', atMs: answerAt },
          { text: question.explanation, language: 'ar', atMs: answerAt },
        ]
      ).filter((part) => (frame * 1000) / fps >= part.atMs)
    : visibleQuestionParts(question, recording, frame, fps);
  return (
    <AbsoluteFill
      data-board-phase={feedback ? 'feedback' : 'question-reading'}
      style={{
        background: '#fafbf4',
        color: '#193a35',
        padding: portrait ? '110px 46px' : '44px 72px',
        fontFamily: 'Tahoma, Arial, sans-serif',
        overflow: 'hidden',
        justifyContent: 'center',
        gap: 28,
      }}
    >
      <p dir="rtl" style={{ fontSize: 24, color: '#146e57', margin: 0 }}>
        {feedback ? 'نراجع الفكرة ونكمل' : 'خلّينا نجرب'}
      </p>
      {parts.map((part, index) => (
        <p
          key={index}
          data-safe-element="question-part"
          lang={part.language}
          dir={part.language === 'ar' ? 'rtl' : 'ltr'}
          style={{
            fontSize: portrait ? 38 : 36,
            lineHeight: 1.55,
            margin: 0,
            overflowWrap: 'anywhere',
          }}
        >
          {part.text}
        </p>
      ))}
    </AbsoluteFill>
  );
}
