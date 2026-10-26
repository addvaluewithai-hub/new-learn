import { useEffect, useState } from 'react';
import type { ListenEngine } from './ListenEngine';

/**
 * For testing on a real phone: what the microphone hears right now (loudness, the voice
 * detector's probability, whether an utterance is open) and why recent turns were or were
 * not taken as the learner's words. Polls only while open.
 */
export function ListenDiagnostics({ engine, notes }: { engine: ListenEngine; notes: string[] }) {
  const [heard, setHeard] = useState(engine.heard);
  useEffect(() => {
    const timer = window.setInterval(() => setHeard(engine.heard), 250);
    return () => clearInterval(timer);
  }, [engine]);
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  return (
    <section className="listen-diag" aria-label="تفاصيل الميكروفون">
      <p>
        كاشف الصوت: <strong>{heard.detector === 'silero' ? 'Silero VAD' : 'شدة الصوت فقط'}</strong>
      </p>
      <p>
        شدة الصوت: {percent(Math.min(1, heard.level * 10))} · احتمال إنه كلام:{' '}
        {heard.voice === null ? '—' : percent(heard.voice)} · {heard.speaking ? 'بتتكلم' : 'ساكت'}
      </p>
      <p>جمل اتعادت عشان اتغيرت: {heard.drifts}</p>
      {notes.length > 0 && (
        <ul>
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
