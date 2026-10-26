import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../shared/api';
import { ListenEngine, type ListenPosition, type ListenState } from './ListenEngine';
import { MediaKeys } from './mediaKeys';

export type ListenOutline = {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  wakeWord: string;
  lessons: Array<{
    id: string;
    title: string;
    scenes: Array<{ id: string; title: string; asks: boolean }>;
  }>;
};
export type SpokenLine = { id: number; role: 'tutor' | 'learner'; text: string };

/** Where the learner stopped, per device. Only a place in the course, never answers. */
const savedKey = (courseId: string) => `new-learn:listen:${courseId}`;
function saved(courseId: string): ListenPosition | null {
  try {
    const value = JSON.parse(localStorage.getItem(savedKey(courseId)) ?? 'null');
    return value && typeof value.lessonId === 'string' ? value : null;
  } catch {
    return null;
  }
}
function save(position: ListenPosition) {
  try {
    localStorage.setItem(savedKey(position.courseId), JSON.stringify(position));
  } catch {
    // Storage can be unavailable (private mode); the lesson still works.
  }
}

/** Noisy-place mode is a per-device preference. */
const NOISY_KEY = 'new-learn:listen:noisy';
function savedNoisy() {
  try {
    return localStorage.getItem(NOISY_KEY) === '1';
  } catch {
    return false;
  }
}
function saveNoisy(on: boolean) {
  try {
    localStorage.setItem(NOISY_KEY, on ? '1' : '0');
  } catch {
    // Storage can be unavailable; the setting then lasts for this visit.
  }
}

/** Every scene of the course in order, as positions. */
const flatten = (outline: ListenOutline) =>
  outline.lessons.flatMap((lesson) =>
    lesson.scenes.map((scene) => ({
      courseId: outline.id,
      lessonId: lesson.id,
      sceneId: scene.id,
    })),
  );

export function useListen(courseId: string) {
  const [outline, setOutline] = useState<ListenOutline | null>(null);
  const [loadError, setLoadError] = useState('');
  const [position, setPosition] = useState<ListenPosition | null>(null);
  const [state, setState] = useState<ListenState>('idle');
  const [lines, setLines] = useState<SpokenLine[]>([]);
  const [error, setError] = useState('');
  const [noisy, setNoisy] = useState(savedNoisy);
  const [notes, setNotes] = useState<string[]>([]);
  const keys = useRef(new MediaKeys());
  const order = useMemo(() => (outline ? flatten(outline) : []), [outline]);
  const now = useRef({ order, outline });
  now.current = { order, outline };

  useEffect(() => {
    const controller = new AbortController();
    api<ListenOutline>(`/listen/${encodeURIComponent(courseId)}`, undefined, controller.signal)
      .then((value) => {
        setOutline(value);
        const first = flatten(value)[0];
        const last = saved(courseId);
        const known = flatten(value).some(
          (p) => p.lessonId === last?.lessonId && p.sceneId === last?.sceneId,
        );
        setPosition(known ? last : first);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(e instanceof Error ? e.message : 'تعذّر تحميل المنهج.');
      });
    return () => controller.abort();
  }, [courseId]);

  const add = (role: SpokenLine['role'], text: string) =>
    setLines((all) => {
      const last = all[all.length - 1];
      if (last?.role === role)
        return [...all.slice(0, -1), { ...last, text: last.text + text }].slice(-30);
      return [...all, { id: (last?.id ?? 0) + 1, role, text }].slice(-30);
    });

  const titles = (p: ListenPosition) => {
    const lesson = now.current.outline?.lessons.find((l) => l.id === p.lessonId);
    return {
      lesson: lesson?.title ?? '',
      scene: lesson?.scenes.find((s) => s.id === p.sceneId)?.title ?? '',
    };
  };

  const engine = useRef<ListenEngine | null>(null);
  engine.current ??= new ListenEngine({
    state: setState,
    scene: (p) => {
      setPosition(p);
      save(p);
      setLines([]);
      const t = titles(p);
      keys.current.update(t.scene, t.lesson);
    },
    said: (text) => add('tutor', text),
    heard: (text) => add('learner', text),
    error: setError,
    diag: (note) => setNotes((all) => [...all, note].slice(-8)),
    noisy: (on) => {
      setNoisy(on);
      saveNoisy(on);
    },
    move: (from, step) => {
      const list = now.current.order;
      const at = list.findIndex((p) => p.lessonId === from.lessonId && p.sceneId === from.sceneId);
      return list[at + step] ?? null;
    },
  });
  useEffect(() => engine.current!.noisy(savedNoisy()), []);
  useEffect(
    () => () => {
      engine.current?.stop();
      keys.current.stop();
    },
    [],
  );

  async function start(at = position) {
    if (!at || !outline) return;
    setError('');
    const t = titles(at);
    const run = engine.current!;
    await keys.current.start(t.scene, t.lesson, {
      talk: () => run.talk(),
      next: () => run.next(),
      previous: () => run.previous(),
    });
    try {
      await run.start(at);
    } catch (e) {
      keys.current.stop();
      setError(
        e instanceof Error && e.name === 'NotAllowedError'
          ? 'اسمح بالميكروفون من المتصفح عشان الدرس الصوتي يشتغل.'
          : e instanceof Error
            ? e.message
            : 'تعذّر بدء الدرس.',
      );
    }
  }
  function stop() {
    engine.current?.stop();
    keys.current.stop();
  }

  return {
    outline,
    loadError,
    position,
    state,
    lines,
    error,
    engine: engine.current!,
    start,
    stop,
    noisy,
    setNoisy: (on: boolean) => engine.current!.noisy(on),
    notes,
  };
}
