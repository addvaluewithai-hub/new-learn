import { useEffect, useRef, useState } from 'react';
import type { LessonContext, ThreadNote } from '@learn/lesson-runtime';
import { api } from '../../../shared/api';
import { t } from '../../../i18n';
import { positionOf } from '../types';
import { atOf, chatTurns, earlierText, whereText } from './notes';
import { voiceStyle } from '../voice/voicePrefs';
import {
  LessonVoice,
  type TeachEvents,
  type TeachLine,
  type VoiceEvents,
  type VoiceState,
} from './LessonVoice';

const id = () => crypto.randomUUID();

/**
 * Nova inside the lesson conversation. Typed questions go to the chat tutor; held-down
 * speech goes to the live tutor. Both land in the same thread, pinned to the step they
 * were asked on, so the lesson and the talk read as one conversation.
 */
export function useLessonTalk(
  context: LessonContext | null,
  onEngage?: () => void,
  /** Hands-free mode's hooks into the voice (microphone, reply gate, tools, setup). */
  hooks?: { current: Partial<Pick<VoiceEvents, 'capture' | 'reply' | 'tool' | 'setup'>> },
) {
  const [notes, setNotes] = useState<ThreadNote[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const now = useRef({ context, notes });
  now.current = { context, notes };
  const engage = useRef(onEngage);
  engage.current = onEngage;
  const [state, setState] = useState<VoiceState>('idle');
  const chat = useRef<AbortController | null>(null);
  const spoken = useRef<{ learner?: string; tutor?: string }>({});
  useEffect(() => () => chat.current?.abort(), []);

  const add = (...items: ThreadNote[]) => setNotes((all) => [...all, ...items].slice(-200));
  const patch = (key: string | undefined, change: (note: ThreadNote) => Partial<ThreadNote>) =>
    key && setNotes((all) => all.map((n) => (n.id === key ? { ...n, ...change(n) } : n)));

  async function ask(text: string) {
    const c = now.current.context;
    if (!c || chat.current || !text.trim()) return;
    const at = atOf(c);
    const question: ThreadNote = { id: id(), role: 'learner', text: text.trim(), at };
    const reply: ThreadNote = { id: id(), role: 'tutor', text: '', at, pending: true };
    const messages = chatTurns([...now.current.notes, question]);
    engage.current?.();
    add(question, reply);
    setOpen(true);
    setBusy(true);
    const controller = new AbortController();
    chat.current = controller;
    try {
      const answer = await api<{ text: string }>(
        '/nova/chat',
        { ...positionOf(c), messages, style: voiceStyle() },
        controller.signal,
      );
      patch(reply.id, () => ({ text: answer.text, pending: false }));
    } catch (error) {
      if (controller.signal.aborted) return;
      patch(reply.id, () => ({
        text: error instanceof Error ? error.message : t('nova.talk.askFailed'),
        pending: false,
        failed: true,
      }));
    } finally {
      if (chat.current === controller) chat.current = null;
      setBusy(false);
    }
  }

  const handlers: VoiceEvents = {
    state: setState,
    position: () => (now.current.context ? positionOf(now.current.context) : null),
    primer: () => [
      earlierText(now.current.notes),
      now.current.context ? whereText(now.current.context) : '',
    ],
    begin: () => {
      engage.current?.();
      const c = now.current.context;
      if (!c) return;
      const learner: ThreadNote = {
        id: id(),
        role: 'learner',
        text: '',
        at: atOf(c),
        voice: true,
        pending: true,
      };
      spoken.current = { learner: learner.id };
      add(learner);
      setOpen(true);
    },
    heard: (text) => patch(spoken.current.learner, (n) => ({ text: n.text + text })),
    said: (text) => {
      const turn = spoken.current;
      if (!turn.tutor) {
        const learner = now.current.notes.find((n) => n.id === turn.learner);
        const at = learner?.at ?? (now.current.context && atOf(now.current.context));
        if (!at) return;
        turn.tutor = id();
        patch(turn.learner, () => ({ pending: false }));
        add({ id: turn.tutor, role: 'tutor', text, at, pending: true });
        return;
      }
      patch(turn.tutor, (n) => ({ text: n.text + text }));
    },
    capture: (chunk, level, samples) => hooks?.current.capture?.(chunk, level, samples),
    get reply() {
      return hooks?.current.reply;
    },
    tool: (name, args) => hooks?.current.tool?.(name, args),
    ended: (seconds, reason) =>
      void api('/nova/ended', {
        seconds,
        reason,
        handsFree: hooks?.current.setup?.().handsFree === true,
      }).catch(() => undefined),
    setup: () => hooks?.current.setup?.() ?? {},
    done: () => settle(),
    failed: (message) => {
      const at = now.current.context && atOf(now.current.context);
      settle();
      if (at) add({ id: id(), role: 'tutor', text: message, at, failed: true });
    },
  };
  const live = useRef(handlers);
  live.current = handlers;
  const [engine] = useState(() => new LessonVoice(() => live.current));
  useEffect(() => () => engine.close(), [engine]);
  const [actions] = useState(() => ({
    press: () => engine.press(),
    release: () => engine.release(),
    stop: () => engine.stop(),
    teach: (lines: TeachLine[], on: TeachEvents) => engine.teach(lines, on),
    stopTeaching: () => engine.endTeach('cut'),
    setVolume: (value: number) => engine.setVolume(value),
    restyle: () => engine.restyle(),
    play: (data: string, rate: number) => engine.play(data, rate),
    pushTurn: (chunks: string[]) => engine.pushTurn(chunks),
    listen: (on: boolean) => engine.listen(on),
  }));
  const voice = { state, ...actions };

  function settle() {
    const turn = spoken.current;
    patch(turn.learner, (n) => ({
      pending: false,
      text: n.text.trim() || t('nova.talk.voiceQuestion'),
    }));
    patch(turn.tutor, () => ({ pending: false }));
    spoken.current = {};
  }

  const where = context ? whereText(context) : '';
  useEffect(() => {
    if (where) engine.tell(where);
    // Only a new position is news to the tutor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [where]);

  /** A tutor-side notice in the conversation (e.g. narration stopped). */
  function notify(text: string) {
    const c = now.current.context;
    if (c) add({ id: id(), role: 'tutor', text, at: atOf(c), failed: true });
  }

  return {
    notify,
    notes,
    busy,
    open,
    setOpen,
    ask,
    voice,
  };
}
