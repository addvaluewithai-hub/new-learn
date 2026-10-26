import { useEffect, useRef, useState } from 'react';
import {
  BOARD_API_VERSION,
  clampValues,
  readBoardMessage,
  type HostMessage,
  type VisualProps,
} from '@learn/lesson-runtime';
import { checkRules, readReport, useBoardSources, type BoardReport } from './sources';
import './html-board.css';

const READY_MS = 5000;

/**
 * A teacher-made board (docs/boards.md): its own sandboxed page on the board origin. The
 * lesson sends the whole state on every change; the board may report the learner's values
 * (clamped here) and one line about what it shows. It never grades or reads answers.
 */
export function HtmlBoard({ spec, board, reducedMotion, layout }: VisualProps) {
  const id = typeof spec.params.board === 'string' ? spec.params.board : '';
  const sources = useBoardSources();
  const edition = sources.get(id);
  const src = edition?.url;
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!edition);
  const [said, setSaid] = useState('');
  const link = useRef(board);
  link.current = board;
  // Sources build a fresh object per render; the board is identified by its address.
  const source = useRef(edition);
  source.current = edition;
  const report_ = useRef<((r: BoardReport) => void) | null>(null);
  report_.current = edition && sources.onReport ? (r) => sources.onReport!(edition, r) : null;
  const send = (message: HostMessage) => frame.current?.contentWindow?.postMessage(message, '*');

  useEffect(() => {
    if (!source.current) return;
    const readyRef = { current: false };
    const timer = setTimeout(() => setFailed((f) => f || !readyRef.current), READY_MS);
    const onMessage = (event: MessageEvent) => {
      // A sandboxed board has an opaque origin, so its window identity is the check.
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const report = readReport(event.data);
      if (report) return void report_.current?.(report);
      const message = readBoardMessage(event.data);
      if (!message) return;
      if (message.type === 'ready') {
        readyRef.current = message.apiVersion === BOARD_API_VERSION;
        if (readyRef.current) setReady(true);
        else setFailed(true);
      } else if (message.type === 'error') {
        console.warn(`Board ${id}: ${message.message}`);
        setFailed(true);
      } else if (message.type === 'variables') {
        const values = clampValues(source.current!.manifest, message.values);
        if (Object.keys(values).length) link.current?.onValues(values);
      } else {
        setSaid(message.observation.summary);
        link.current?.onObservation(message.observation);
      }
    };
    addEventListener('message', onMessage);
    return () => {
      clearTimeout(timer);
      removeEventListener('message', onMessage);
    };
  }, [src, id]);

  // A new layout (the phone turned) is a new init: the board switches canvas and redraws.
  useEffect(() => {
    if (ready) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, reducedMotion]);
  const view = board?.view;
  const key = JSON.stringify(view ?? null);
  useEffect(() => {
    if (!ready || !view) return;
    send({ nl: 1, type: 'state', view });
    // In a draft preview the board checks its own drawing after every state.
    if (report_.current)
      frame.current?.contentWindow?.postMessage(
        { nl: 1, type: 'check', rules: checkRules(layout) },
        '*',
      );
    // `key` is the view's content; the object itself is rebuilt on every lesson render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  const init = () =>
    send({
      nl: 1,
      type: 'init',
      apiVersion: BOARD_API_VERSION,
      lang: 'ar',
      dir: 'rtl',
      theme: 'dark',
      reducedMotion,
      layout,
    });
  return (
    <div
      className="html-board"
      data-board={id}
      data-ready={ready || undefined}
      data-failed={failed || undefined}
    >
      {src && !failed ? (
        <iframe
          ref={frame}
          src={src}
          title={edition?.manifest.title ?? 'Board'}
          sandbox="allow-scripts"
          allow=""
          referrerPolicy="no-referrer"
          onLoad={init}
        />
      ) : (
        <p className="html-board-fallback" role="status">
          البورد ده مش شغال دلوقتي. كمّل بالشرح المكتوب.
        </p>
      )}
      <p className="html-board-said" aria-live="polite">
        {edition ? `${edition.manifest.description} ${said}` : ''}
      </p>
    </div>
  );
}
