import { useEffect, useRef, useState } from 'react';
import { api } from '../../../shared/api';
import { AudioSession } from './AudioSession';
import { LiveConnection, type LiveToken } from './LiveConnection';
import type { Message, Position } from '../types';
export function useVoice(position: Position, answer: (index: number, choice: number) => unknown) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'paused'>(
      'idle',
    ),
    [error, setError] = useState(''),
    [muted, setMuted] = useState(false),
    [messages, setMessages] = useState<Message[]>([]);
  const active = useRef<{
    audio: AudioSession;
    live: LiveConnection;
    abort: AbortController;
  } | null>(null);
  const action = useRef(answer);
  action.current = answer;
  const held = useRef(false);
  function stop() {
    const session = active.current;
    active.current = null;
    session?.abort.abort();
    session?.live.close();
    session?.audio.close();
    held.current = false;
    setStatus('idle');
    setMuted(false);
  }
  useEffect(
    () => () => {
      const session = active.current;
      active.current = null;
      session?.abort.abort();
      session?.live.close();
      session?.audio.close();
    },
    [],
  );
  async function connect(initial: string) {
    if (active.current) return;
    setError('');
    setStatus('connecting');
    setMessages([]);
    let owned: { audio: AudioSession; live: LiveConnection; abort: AbortController } | null = null;
    try {
      const audio = new AudioSession(() => {
        if (!held.current && active.current?.audio === audio) setStatus('listening');
      });
      const abort = new AbortController();
      const live = new LiveConnection({
        audio: (data, rate) => {
          if (!held.current) setStatus('speaking');
          audio.enqueue(data, rate);
        },
        interrupted: () => {
          audio.interrupt();
          if (!held.current) setStatus('listening');
        },
        complete: () => audio.finish(),
        transcript: (role, text) =>
          setMessages((rows) => {
            const last = rows.at(-1);
            return last?.role === role
              ? [...rows.slice(0, -1), { ...last, text: last.text + text }]
              : [...rows, { id: crypto.randomUUID(), role, text }].slice(-40);
          }),
        error: (message) => {
          if (active.current?.live !== live) return;
          stop();
          setError(message);
        },
        answer: (index, choice) => action.current(index, choice),
      });
      owned = { audio, live, abort };
      active.current = owned;
      await audio.capture((chunk) => live.audio(chunk));
      if (abort.signal.aborted) return;
      const token = await api<LiveToken>('/nova/live', position, abort.signal);
      if (abort.signal.aborted) return;
      await live.connect(token);
      if (abort.signal.aborted) return;
      setStatus('listening');
      live.text(initial);
    } catch (e) {
      if (active.current && active.current === owned) {
        stop();
        setError(
          e instanceof Error && e.name === 'NotAllowedError'
            ? 'اسمح بالميكروفون من المتصفح أو استخدم الشات.'
            : e instanceof Error
              ? e.message
              : 'تعذّر بدء المكالمة.',
        );
      }
    }
  }
  function mute() {
    const next = !muted;
    setMuted(next);
    active.current?.audio.setMuted(next);
    if (next) active.current?.live.endAudio();
  }
  async function pause() {
    if (!active.current) return;
    held.current = !held.current;
    await active.current.audio.setPaused(held.current);
    if (held.current) active.current.live.endAudio();
    setStatus(held.current ? 'paused' : 'listening');
  }
  return {
    status,
    error,
    muted,
    messages,
    connect,
    stop,
    mute,
    pause,
    text: (value: string) => active.current?.live.text(value),
  };
}
