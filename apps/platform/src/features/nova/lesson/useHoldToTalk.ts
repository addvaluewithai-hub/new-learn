import { useEffect, useRef, useState } from 'react';
import { api } from '../../../shared/api';
import { AudioSession } from '../voice/AudioSession';
import { LiveConnection, type LiveToken } from '../voice/LiveConnection';
import type { Position } from '../types';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';
type Session = { audio: AudioSession; live: LiveConnection; ready: boolean; buffer: string[] };
export type HoldHandlers = {
  position: () => Position | null;
  /** Silent context sent when a session opens: earlier talk and where the learner is. */
  primer: () => string[];
  begin: () => void;
  heard: (text: string) => void;
  said: (text: string) => void;
  done: () => void;
  failed: (message: string) => void;
};
const IDLE_CLOSE_MS = 120_000;
const REPLY_WAIT_MS = 20_000;

/**
 * Hold-to-talk with the live tutor. The microphone streams only while held; the session
 * opens on the first hold, stays warm between questions, and closes after two quiet minutes.
 * A dropped session is reopened by the next hold instead of interrupting the lesson.
 */
export function useHoldToTalk(handlers: HoldHandlers) {
  const [state, setState] = useState<VoiceState>('idle');
  const on = useRef(handlers);
  on.current = handlers;
  const session = useRef<Session | null>(null);
  const holding = useRef(false);
  const turn = useRef(false);
  const timers = useRef<{ idle?: number; reply?: number }>({});

  function close() {
    const s = session.current;
    session.current = null;
    s?.live.close();
    s?.audio.close();
    clearTimeout(timers.current.idle);
    clearTimeout(timers.current.reply);
    holding.current = false;
    setState('idle');
  }
  useEffect(() => close, []);
  function finish(message?: string) {
    clearTimeout(timers.current.reply);
    if (!turn.current) return;
    turn.current = false;
    if (message) on.current.failed(message);
    else on.current.done();
  }
  function armIdle() {
    clearTimeout(timers.current.idle);
    timers.current.idle = window.setTimeout(() => !holding.current && close(), IDLE_CLOSE_MS);
  }

  const opening = useRef<Promise<Session> | null>(null);
  /** One connection at a time: a second hold while connecting waits for the same one. */
  function open() {
    if (session.current?.ready) return Promise.resolve(session.current);
    opening.current ??= connect().finally(() => (opening.current = null));
    return opening.current;
  }
  async function connect() {
    const position = on.current.position();
    if (!position) throw new Error('الدرس لسه بيحمّل.');
    const s = { ready: false, buffer: [] } as unknown as Session;
    s.audio = new AudioSession(() => {
      if (session.current === s && !holding.current) setState('idle');
    });
    s.live = new LiveConnection({
      audio: (data, rate) => {
        if (holding.current) return;
        clearTimeout(timers.current.reply);
        setState('speaking');
        s.audio.enqueue(data, rate);
      },
      interrupted: () => s.audio.interrupt(),
      complete: () => {
        s.audio.finish();
        finish();
        armIdle();
      },
      transcript: (role, text) =>
        role === 'user' ? on.current.heard(text) : on.current.said(text),
      error: (message) => {
        if (session.current !== s) return;
        const mid = turn.current;
        close();
        if (mid) finish(message);
      },
      answer: () => ({ error: 'Not available in lesson talk.' }),
    });
    session.current = s;
    try {
      await s.audio.capture((chunk) => {
        if (!holding.current) return;
        if (s.ready) s.live.audio(chunk);
        else s.buffer.push(chunk);
      });
      const token = await api<LiveToken>('/nova/live', { ...position, purpose: 'talk' });
      if (session.current !== s) throw new Error('المكالمة اتقفلت.');
      await s.live.connect(token);
      s.ready = true;
      for (const text of on.current.primer()) if (text) s.live.note(text);
      return s;
    } catch (error) {
      if (session.current === s) close();
      throw error;
    }
  }

  function press() {
    if (holding.current) return;
    holding.current = true;
    clearTimeout(timers.current.idle);
    const s = session.current;
    // Speaking over the tutor stops it, like a real conversation.
    s?.audio.interrupt();
    finish();
    turn.current = true;
    on.current.begin();
    s?.audio.setMuted(false);
    if (s?.ready) {
      s.live.activity(true);
      setState('listening');
      return;
    }
    setState('connecting');
    // The first hold's continuation starts the turn once connected; it reads `holding` then.
    if (opening.current) return;
    open().then(
      (ready) => {
        ready.audio.setMuted(!holding.current);
        ready.live.activity(true);
        for (const chunk of ready.buffer.splice(0)) ready.live.audio(chunk);
        if (holding.current) setState('listening');
        else answer(ready);
      },
      (error: unknown) => {
        holding.current = false;
        setState('idle');
        finish(
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'اسمح بالميكروفون من المتصفح، أو اكتب سؤالك.'
            : error instanceof Error
              ? error.message
              : 'تعذّر بدء الكلام مع Nova.',
        );
      },
    );
  }
  function answer(s: Session) {
    s.live.activity(false);
    setState('thinking');
    clearTimeout(timers.current.reply);
    timers.current.reply = window.setTimeout(() => {
      setState('idle');
      finish('Nova مردتش المرة دي. جرّب تاني.');
    }, REPLY_WAIT_MS);
    armIdle();
  }
  function release() {
    if (!holding.current) return;
    holding.current = false;
    const s = session.current;
    s?.audio.setMuted(true);
    // Still connecting: the open() continuation sends the end once it is ready.
    if (s?.ready) answer(s);
  }
  function stop() {
    session.current?.audio.interrupt();
    finish();
    setState('idle');
  }
  return {
    state,
    press,
    release,
    stop,
    /** Silent context while a session is open (e.g. the learner moved on). */
    tell: (text: string) => session.current?.ready && session.current.live.note(text),
  };
}
