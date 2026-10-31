import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  BoardManifest,
  LessonContext,
  ReadingPackage,
  ReadingProgress,
} from '@learn/lesson-runtime';
import ReadingClassroom, { type ReadingModule } from '../../app/ReadingClassroom';
import { api } from '../../shared/api';
import { TextBoard } from '../boards/TextBoard';
import { BoardSourcesProvider, teacherSources, type BoardReport } from '../boards/sources';
import { FeedbackPanel, type Note } from './FeedbackPanel';
import { EditChat } from './EditChat';
import './edits.css';

type Draft = {
  lessonId: string;
  revision: number;
  package: ReadingPackage;
  boards: Record<string, { hash: string; manifest: BoardManifest }>;
  feedback: Note[];
};

/** What the preview shows: the lesson's revision and its boards' versions. */
const versionOf = (d: Draft) =>
  JSON.stringify([d.revision, Object.values(d.boards).map((b) => b.hash)]);

/**
 * `?draft=<id>`: a teacher's own draft, played like a lesson (no saved progress), with notes
 * on every step, a side chat that edits it (S2), and each board checking its own drawing on
 * this screen. An edit reloads the preview where the teacher was.
 */
export default function DraftLesson({
  lessonId,
  studentName,
}: {
  lessonId: string;
  studentName: string;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [panel, setPanel] = useState<'notes' | 'edits' | null>(null);
  const [reload, setReload] = useState(0);
  const version = useRef('');
  const [start, setStart] = useState<Partial<ReadingProgress>>();
  const place = useRef<LessonContext | null>(null);
  const load = useCallback(
    () =>
      api<Draft>(`/authoring/lessons/${lessonId}`).then((d): ReadingModule => {
        setDraft(d);
        setNotes(d.feedback);
        version.current = versionOf(d);
        return {
          readingLesson: d.package,
          readingRenderers: { 'text-board': TextBoard },
          readingBoards: Object.fromEntries(
            Object.entries(d.boards).map(([k, b]) => [k, b.manifest]),
          ),
        };
      }),
    [lessonId],
  );
  const refresh = useCallback(
    () => api<Draft>(`/authoring/lessons/${lessonId}`).then((d) => setNotes(d.feedback)),
    [lessonId],
  );
  // The side chat saved something: open the new version at the step the teacher is on.
  const onEdited = useCallback(async () => {
    const d = await api<Draft>(`/authoring/lessons/${lessonId}`);
    setNotes(d.feedback);
    if (versionOf(d) === version.current) return;
    version.current = versionOf(d);
    const at = place.current;
    if (at && at.phase !== 'complete')
      setStart({ position: { sceneId: at.sceneId, phase: at.phase, step: at.step ?? 0 } });
    setReload((n) => n + 1);
  }, [lessonId]);
  // Problems of each board and layout, gathered over every step and sent once things settle.
  const found = useRef(new Map<string, { hash: string; report: BoardReport; sent: string }>());
  const timer = useRef(0);
  const onReport = useCallback((source: { hash: string; key: string }, report: BoardReport) => {
    if (!source.key.startsWith('u:')) return;
    const key = `${source.hash}:${report.layout}`;
    const entry = found.current.get(key) ?? {
      hash: source.hash,
      report: { ...report, problems: [] },
      sent: '',
    };
    const seen = new Set(entry.report.problems.map((p) => JSON.stringify(p)));
    for (const p of report.problems)
      if (!seen.has(JSON.stringify(p))) entry.report.problems.push(p);
    entry.report.width = report.width;
    found.current.set(key, entry);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      for (const item of found.current.values()) {
        const body = JSON.stringify(item.report);
        if (body === item.sent) continue;
        item.sent = body;
        void api(`/authoring/boards/${item.hash}/report`, item.report).catch(
          () => (item.sent = ''),
        );
      }
    }, 1500);
  }, []);
  const sources = useMemo(() => teacherSources(draft?.boards ?? {}, onReport), [draft, onReport]);
  return (
    <BoardSourcesProvider value={sources}>
      <ReadingClassroom
        key={reload}
        start={start}
        load={load}
        backHref="/"
        studentName={studentName}
        preview
        reference={(context) => {
          place.current = context;
          return draft ? (
            <div className="draft-dock">
              <EditChat
                lessonId={lessonId}
                open={panel === 'edits'}
                onOpen={(open) => setPanel(open ? 'edits' : null)}
                onEdited={onEdited}
              />
              <FeedbackPanel
                lessonId={lessonId}
                revision={draft.revision}
                notes={notes}
                context={context}
                onChanged={refresh}
                open={panel === 'notes'}
                onOpen={(open) => setPanel(open ? 'notes' : null)}
              />
            </div>
          ) : null;
        }}
      />
    </BoardSourcesProvider>
  );
}
