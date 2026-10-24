import { useEffect, useRef } from 'react';
import { Loading } from '../../shared/Loading';
import type { ListenState } from './ListenEngine';
import { useListen } from './useListen';
import '../../shared/platform.css';
import './listen.css';

const STATUS: Record<ListenState, string> = {
  idle: 'جاهز',
  connecting: 'بنوصّل بالمدرّس…',
  teaching: 'بيشرح',
  floor: 'دورك: اتكلم',
  listening: 'سامعك…',
  thinking: 'بيفكّر…',
  paused: 'متوقف مؤقتًا',
  finished: 'خلّصت المنهج 🎉',
};

/**
 * Listen mode: an audio-only lesson with the live tutor. No board and no choices; the page
 * only starts the run and mirrors what is happening, so the screen can be turned off.
 */
export default function ListenPage({ courseId }: { courseId: string }) {
  const run = useListen(courseId);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [run.lines]);
  if (run.loadError) return <p className="listen-error">{run.loadError}</p>;
  if (!run.outline || !run.position) return <Loading text="بنجهّز الدرس الصوتي…" />;
  const { outline, position, state, engine } = run;
  const lessonIndex = outline.lessons.findIndex((l) => l.id === position.lessonId);
  const lesson = outline.lessons[lessonIndex];
  const sceneIndex = lesson.scenes.findIndex((s) => s.id === position.sceneId);
  const running = !['idle', 'finished'].includes(state);
  const go = (lessonId: string) => {
    const target = outline.lessons.find((l) => l.id === lessonId)!;
    const at = { courseId: outline.id, lessonId, sceneId: target.scenes[0].id };
    void run.start(at);
  };

  return (
    <main className="platform-ui listen" dir="rtl">
      <header className="listen-head">
        <a href="/" className="listen-back">
          المكتبة
        </a>
        <h1>{outline.title}</h1>
        <p>{outline.description}</p>
      </header>

      <section className={`listen-stage is-${state}`} aria-live="polite">
        <p className="listen-where">
          الدرس {lessonIndex + 1} من {outline.lessons.length} · {lesson.title}
        </p>
        <h2>{lesson.scenes[sceneIndex]?.title}</h2>
        <div className="listen-orb" aria-hidden="true" />
        <p className="listen-status">{STATUS[state]}</p>

        {!running ? (
          <button className="listen-primary" onClick={() => void run.start()}>
            {state === 'finished' ? 'ابدأ من الأول' : 'ابدأ الدرس الصوتي'}
          </button>
        ) : (
          <div className="listen-controls">
            <button
              className="listen-primary"
              onClick={() => (state === 'paused' ? engine.resume() : engine.pause())}
            >
              {state === 'paused' ? 'كمّل' : 'إيقاف مؤقت'}
            </button>
            <button
              className="listen-talk"
              onClick={() => engine.talk()}
              disabled={!['teaching', 'thinking', 'floor'].includes(state)}
            >
              عايز أتكلم
            </button>
          </div>
        )}
        {running && (
          <div className="listen-steps">
            <button onClick={() => engine.previous()}>المشهد اللي فات</button>
            <button onClick={() => engine.restart()}>عيد المشهد</button>
            <button onClick={() => engine.next()}>المشهد الجاي</button>
            <button onClick={run.stop}>إنهاء</button>
          </div>
        )}
        {run.error && <p className="listen-error">{run.error}</p>}
      </section>

      <section className="listen-help">
        <h3>إزاي تستخدمه من غير شاشة</h3>
        <ul>
          <li>دوس «ابدأ» واسمح بالميكروفون، وبعدها اقفل الشاشة عادي.</li>
          <li>
            عشان تقاطع المدرّس قول «{outline.wakeWord}» وبعدها سؤالك، أو دوس زرار السماعة مرة.
          </li>
          <li>لما يسألك، رد على طول من غير ما تقول أي كلمة. ولو سكت شوية هيساعدك.</li>
          <li>تقدر تقول له «عيد» أو «كمّل» أو «فوّت المشهد ده».</li>
          <li>أحسن تجربة بسماعة: الميكروفون مش هيلقط صوت المدرّس.</li>
        </ul>
      </section>

      {run.lines.length > 0 && (
        <section className="listen-log" ref={log} aria-label="اللي اتقال">
          {run.lines.map((line) => (
            <p key={line.id} className={`is-${line.role}`}>
              {line.text}
            </p>
          ))}
        </section>
      )}

      <nav className="listen-lessons" aria-label="الدروس">
        {outline.lessons.map((l, i) => (
          <button
            key={l.id}
            className={l.id === lesson.id ? 'is-current' : ''}
            onClick={() => go(l.id)}
          >
            <span>{i + 1}</span>
            {l.title}
          </button>
        ))}
      </nav>
    </main>
  );
}
