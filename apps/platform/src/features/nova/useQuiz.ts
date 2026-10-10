import { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import type { Position, PracticeQuestion, Quiz } from './types';
export function applyAnswer(quiz: Quiz, index: number, choice: number): Quiz {
  if (
    quiz.revealed ||
    index !== quiz.index ||
    !Number.isInteger(choice) ||
    choice < 0 ||
    choice >= quiz.questions[index]?.options.length
  )
    return quiz;
  return { ...quiz, revealed: true, answers: [...quiz.answers, choice] };
}
export function useQuiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const current = useRef(quiz);
  current.current = quiz;
  const pending = useRef<AbortController | null>(null);
  function stop() {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
  }
  useEffect(() => () => pending.current?.abort(), []);
  async function prepare(position: Position) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await api<{ questions: PracticeQuestion[] }>(
        '/nova/quiz',
        position,
        controller.signal,
      );
      if (!controller.signal.aborted)
        setQuiz({ questions: result.questions, answers: [], index: 0, revealed: false });
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'تعذّر تجهيز الاختبار.');
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setLoading(false);
      }
    }
  }
  function answer(index: number, choice: number) {
    if (!current.current) return { error: 'There is no active practice.' };
    const before = current.current,
      next = applyAnswer(before, index, choice);
    if (next === before)
      return { error: 'Not the current unanswered question. Do not grade or advance.' };
    current.current = next;
    setQuiz(next);
    const question = next.questions[index];
    return {
      correct: choice === question.correct,
      englishAnswer: question.englishAnswer,
      explanation: question.explanation,
      instruction:
        'Explain the feedback, then ask the learner to press Next. Do not call answer_question again until the next supplied question.',
    };
  }
  function next() {
    setQuiz((q) => (q?.revealed ? { ...q, index: q.index + 1, revealed: false } : q));
  }
  return { quiz, loading, error, prepare, answer, next, stop };
}
