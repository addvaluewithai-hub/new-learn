import { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import type { Message, Position } from './types';
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const history = useRef<Message[]>([]);
  function stop() {
    pending.current?.abort();
    pending.current = null;
    setLoading(false);
  }
  useEffect(() => () => pending.current?.abort(), []);
  async function send(text: string, position: Position) {
    if (pending.current || !text.trim()) return false;
    const next = [
      ...history.current,
      { id: crypto.randomUUID(), role: 'user' as const, text: text.trim() },
    ];
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError('');
    setMessages(next);
    try {
      // Retain completed pairs only. An interrupted request never becomes history.
      const payload = next.slice(-15).map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }));
      const reply = await api<{ text: string }>(
        '/nova/chat',
        { ...position, messages: payload },
        controller.signal,
      );
      if (controller.signal.aborted) return false;
      history.current = [
        ...next,
        { id: crypto.randomUUID(), role: 'assistant' as const, text: reply.text },
      ].slice(-40);
      setMessages(history.current);
      return true;
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'تعذّر إرسال الرسالة.');
      return false;
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setLoading(false);
      }
    }
  }
  return { messages, loading, error, send, stop };
}
