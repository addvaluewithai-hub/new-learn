import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReadingPackage, ReadingProgress } from '@learn/lesson-runtime';
import { api } from '../../shared/api';
import { currentLocale } from '../../i18n';

type Snapshot = {
  schemaVersion: 1;
  sceneId: string;
  phase: 'narration' | 'attempt' | 'feedback' | 'complete';
  frame: number;
  step?: number;
  reachedSceneIds: string[];
  attempts: { id: string; sceneId: string; questionId: string; written: string }[];
};
type Saved = { revision: number | null; state: Snapshot | null; completed: boolean };
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline';

function toSnapshot(lesson: ReadingPackage, progress: ReadingProgress): Snapshot {
  return {
    schemaVersion: 1,
    ...progress.position,
    frame: 0,
    reachedSceneIds: progress.reachedSceneIds,
    attempts: Object.entries(progress.answers).map(([questionId, written]) => ({
      id: questionId,
      sceneId: lesson.scenes.find((s) => s.question?.id === questionId)!.id,
      questionId,
      written,
    })),
  };
}
function fromSnapshot(saved: Saved): Partial<ReadingProgress> | undefined {
  if (!saved.state) return saved.completed ? { complete: true } : undefined;
  const { sceneId, phase, step = 0, reachedSceneIds, attempts } = saved.state;
  return {
    position: { sceneId, phase, step },
    reachedSceneIds,
    answers: Object.fromEntries(attempts.map((a) => [a.questionId, a.written])),
    complete: saved.completed,
  };
}

/**
 * Loads the learner's saved place and saves changes shortly after they happen, and on
 * leaving the page. Conflicts (another tab) are retried against the server's revision.
 */
export function useReadingProgress(lesson: ReadingPackage | null, enabled = true) {
  const [initial, setInitial] = useState<Partial<ReadingProgress> | undefined | null>(
    enabled ? null : undefined,
  );
  const [status, setStatus] = useState<SaveState>('idle');
  const revision = useRef<number | null>(null);
  const pending = useRef<ReadingProgress | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lessonId = enabled ? lesson?.lessonId : undefined;

  useEffect(() => {
    if (!lessonId) return;
    const controller = new AbortController();
    api<Saved>(`/lessons/${encodeURIComponent(lessonId)}/progress`, undefined, controller.signal)
      .then((saved) => {
        revision.current = saved.revision;
        setInitial(fromSnapshot(saved));
      })
      .catch(() => !controller.signal.aborted && setInitial(undefined)); // start fresh offline
    return () => controller.abort();
  }, [lessonId]);

  const flush = useCallback(
    async (keepalive = false, retried = false): Promise<void> => {
      clearTimeout(timer.current);
      const progress = pending.current;
      if (!enabled || !lesson || !progress) return;
      const writing = generation.current;
      pending.current = null;
      setStatus('saving');
      try {
        const response = await fetch(
          `/api/lessons/${encodeURIComponent(lesson.lessonId)}/progress`,
          {
            method: 'PUT',
            credentials: 'same-origin',
            keepalive,
            headers: { 'content-type': 'application/json', 'x-nl-lang': currentLocale() },
            body: JSON.stringify({
              contentRevision: lesson.contentRevision,
              revision: revision.current,
              complete: progress.complete,
              state: toSnapshot(lesson, progress),
            }),
          },
        );
        const body = await response.json();
        if (response.status === 409 && body.current && !retried) {
          revision.current =
            body.current.revision === null
              ? null
              : Math.max(revision.current ?? -1, body.current.revision);
          if (writing !== generation.current) return;
          pending.current = progress;
          return flush(keepalive, true);
        }
        if (!response.ok) throw new Error(body.error);
        revision.current = Math.max(revision.current ?? -1, body.revision);
        if (writing === generation.current) setStatus(pending.current ? 'saving' : 'saved');
      } catch {
        if (writing !== generation.current) return;
        pending.current ??= progress;
        setStatus('offline');
        timer.current = setTimeout(() => void flush(), 8000);
      }
    },
    [lesson, enabled],
  );

  const record = useCallback(
    (progress: ReadingProgress) => {
      if (!enabled) return;
      pending.current = progress;
      generation.current++;
      // A previous acknowledgement must never label this queued position as saved.
      setStatus('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 900);
    },
    [flush, enabled],
  );

  useEffect(() => {
    const leave = () => void flush(true);
    addEventListener('pagehide', leave);
    return () => {
      removeEventListener('pagehide', leave);
      leave();
    };
  }, [flush]);

  return { initial, record, status };
}
