import { useState } from 'react';
import { ReadText } from './ReadText';
import type { ReadingQuestion } from './types';

/** The learner's own attempt. The model answer is never part of this screen. */
export function ReadingAttempt({
  question,
  onSubmit,
}: {
  question: ReadingQuestion;
  onSubmit: (answer: string) => void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div className="reading-attempt">
      <p className="reading-question-en" dir="ltr" lang="en">
        <ReadText text={question.english} />
      </p>
      <p className="reading-question-ar" dir="rtl">
        <ReadText text={question.arabic} />
      </p>
      {question.options.length > 0 && question.attempt !== 'written' ? (
        <div className="reading-options" role="group" aria-label="الاختيارات">
          {question.options.map((option, i) => (
            <button key={i} type="button" onClick={() => onSubmit(option)}>
              <ReadText text={option} />
            </button>
          ))}
        </div>
      ) : null}
      {question.attempt !== 'choice' ? (
        <>
          <textarea
            aria-label="إجابتك"
            dir="auto"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="اكتب حلّك هنا… Your answer"
          />
          <div className="reading-attempt-actions">
            <button
              type="button"
              className="reading-primary"
              disabled={!draft.trim()}
              onClick={() => onSubmit(draft.trim())}
            >
              ابعت وشوف الحل
            </button>
            <button type="button" className="reading-quiet" onClick={() => onSubmit('')}>
              معرفتش، وريني الحل
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
