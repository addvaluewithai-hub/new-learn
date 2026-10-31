import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ReadingLesson } from '@learn/lesson-runtime';
import type {
  BoardManifest,
  LessonContext,
  LessonController,
  ReadingPackage,
  ReadingProgress,
  RendererRegistry,
} from '@learn/lesson-runtime';
import '@learn/lesson-runtime/style.css';
import { NovaAssistant } from '../features/nova/NovaAssistant';
import { useReadingProgress, type SaveState } from '../features/progress/useReadingProgress';
import { NovaOrb, TalkComposer } from '../features/nova/lesson/TalkControls';
import { useLessonTalk } from '../features/nova/lesson/useLessonTalk';
import { useSpaceToTalk } from '../features/nova/lesson/useSpaceToTalk';
import { LessonSettings } from '../features/nova/lesson/LessonSettings';
import { useLessonFlow, useNarrator } from '../features/nova/lesson/useLessonFlow';
import { useVoicePrefs } from '../features/nova/voice/voicePrefs';
import { useHandsFree, useVoiceHooks } from '../features/nova/handsfree/useHandsFree';
import { lessonControl } from '../features/nova/lesson/lessonControl';
import { lessonHref, nextImported } from '../features/catalog/plan';
import '../features/classroom/reading-classroom.css';
import { HtmlBoard } from '../features/boards/HtmlBoard';
import { boardManifests } from '../features/boards/editions';
import { useI18n, type TextKey } from '../i18n';

export type ReadingModule = {
  readingLesson: ReadingPackage;
  readingRenderers: RendererRegistry;
  /** Manifests of the live boards the lesson uses (docs/boards.md). */
  readingBoards?: Readonly<Record<string, BoardManifest>>;
};
const SAVE: Record<SaveState, TextKey | ''> = {
  idle: '',
  saving: 'app.classroom.saving',
  saved: 'app.classroom.saved',
  offline: 'app.classroom.offline',
};

/** How long after Nova's last word the lesson waits before reading on (room for a follow-up). */
const RESUME_GRACE_MS = 1500;

/** Full-screen reading lesson: the runtime stage, saved progress, and Nova in the conversation. */
export default function ReadingClassroom({
  load,
  backHref,
  studentName,
  preview = false,
  reference,
  start,
}: {
  load: () => Promise<ReadingModule>;
  backHref: string;
  studentName: string;
  preview?: boolean;
  reference?: (context: LessonContext | null) => ReactNode;
  /** Preview only: where to open (the teacher's place, kept across an edit). */
  start?: Partial<ReadingProgress>;
}) {
  const [module, setModule] = useState<ReadingModule | null>(null);
  const [error, setError] = useState(false);
  const { t } = useI18n();
  const [context, setContext] = useState<LessonContext | null>(null);
  const [controller, setController] = useState<LessonController | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const flow = useLessonFlow();
  const moving = flow.settings.narration || flow.settings.pace !== null;
  // After a spoken skip, answer, step or "continue", a moving lesson goes on once Nova is quiet.
  const carry = useRef(false);
  // Holding to talk pauses a lesson that moves alone, so the answer can be heard in peace;
  // `held` remembers where, so the lesson can go on by itself afterwards (see below).
  const held = useRef<{ sceneId: string; step: number } | null>(null);
  // Set when the lesson stepped back for the resume: it reads on once that page is in place.
  const resumeNext = useRef(false);
  const now = useRef({ context, controller, paused: flow.paused, moving });
  now.current = { context, controller, paused: flow.paused, moving };
  const hooks = useVoiceHooks();
  const talk = useLessonTalk(
    context,
    () => {
      const c = now.current;
      if (!c.moving || c.paused) return;
      held.current = c.context ? { sceneId: c.context.sceneId, step: c.context.step ?? 0 } : null;
      flow.setPaused(true);
    },
    hooks,
  );
  useSpaceToTalk(talk.voice, Boolean(module) && !assistantOpen);
  const { setVolume, teach, stopTeaching, restyle } = talk.voice;
  const voicePrefs = useVoicePrefs(restyle);
  useEffect(() => setVolume(flow.settings.volume), [flow.settings.volume, setVolume]);
  useNarrator({
    enabled: flow.settings.narration && !assistantOpen,
    paused: flow.paused,
    asking: flow.settings.questions === 'ask',
    lesson: module?.readingLesson ?? null,
    context,
    controller,
    teach,
    stop: stopTeaching,
    onFail: () => {
      flow.change({ narration: false });
      talk.notify(t('app.classroom.readAloudFailed'));
    },
  });
  // Audio mode: the same lesson, answered by voice, the screen may be off.
  useHandsFree({
    hooks,
    settings: flow.settings,
    change: flow.adjust,
    voice: talk.voice,
    controller,
    context,
    act: (args) =>
      lessonControl(args, {
        controller,
        context,
        moving,
        pause: () => flow.setPaused(true),
        carryOn: () => void (carry.current = true),
      }),
    resume: () => flow.setPaused(false),
    title: {
      lesson: module?.readingLesson.title ?? '',
      course: module?.readingLesson.curriculumTitle ?? '',
    },
    onNotice: (text) => {
      talk.notify(text);
      talk.voice.teach([{ n: -1, text, question: false }], {
        show: () => undefined,
        done: () => undefined,
        failed: () => undefined,
      });
    },
  });
  useEffect(() => {
    if (talk.voice.state !== 'idle') return;
    if (carry.current) {
      carry.current = false;
      held.current = null;
      if (moving) flow.setPaused(false);
      return;
    }
    // The conversation is over: unless the learner holds again within a moment, the lesson
    // goes on by itself, from one line before the one they interrupted, so it reads in context.
    const was = held.current;
    if (!was) return;
    const timer = window.setTimeout(() => {
      held.current = null;
      const c = now.current;
      if (!c.moving || !c.paused) return;
      const same = c.context?.sceneId === was.sceneId && (c.context?.step ?? 0) === was.step;
      if (same && c.context?.phase === 'narration' && was.step > 0) {
        // One line back first; the reading starts once that page has arrived (below).
        resumeNext.current = true;
        c.controller?.back?.();
      } else flow.setPaused(false);
    }, RESUME_GRACE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talk.voice.state]);
  useEffect(() => {
    if (!resumeNext.current) return;
    resumeNext.current = false;
    if (now.current.paused) flow.setPaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.sceneId, context?.step]);
  const onReady = useCallback((value: LessonController | null) => setController(value), []);
  const saved = useReadingProgress(module?.readingLesson ?? null, !preview);
  // Every reading lesson may use live teacher-made boards (docs/boards.md).
  const registry = useMemo(
    () => ({ 'html-board': HtmlBoard, ...module?.readingRenderers }),
    [module],
  );
  useEffect(() => {
    let live = true;
    load().then(
      (value) => live && setModule(value),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [load]);
  useEffect(() => {
    document.documentElement.classList.add('in-lesson');
    return () => document.documentElement.classList.remove('in-lesson');
  }, []);
  if (error)
    return (
      <main className="platform-ui lesson-entry-message">
        <p role="alert">{t('app.classroom.loadFailed')}</p>
        <a href={backHref}>{t('app.classroom.backToCurriculum')}</a>
      </main>
    );
  if (!module || saved.initial === null)
    return (
      <div className="reading-classroom reading-loading" role="status">
        <span className="reading-spinner" aria-hidden />
        {t('app.classroom.loading')}
      </div>
    );
  const lesson = module.readingLesson;
  const saveKey = SAVE[saved.status];
  const next = preview ? null : nextImported(lesson.curriculumId, lesson.lessonId);
  return (
    <div className="reading-classroom">
      <ReadingLesson
        lesson={lesson}
        registry={registry}
        boards={module.readingBoards ?? boardManifests}
        initial={preview && start ? start : saved.initial}
        questions={flow.settings.questions}
        suspended={assistantOpen}
        onContext={setContext}
        onReady={onReady}
        onProgress={preview ? undefined : saved.record}
        exit={{
          label: t(preview ? 'app.classroom.backToPlatform' : 'app.classroom.backToCurriculum'),
          href: backHref,
        }}
        next={next ? { title: next.title, href: lessonHref(lesson.curriculumId, next.id) } : null}
        status={
          preview ? (
            <span
              className="reading-save"
              title={t('app.classroom.previewTitle')}
              aria-label={t('app.classroom.previewLabel')}
            >
              {t('app.classroom.preview')}
            </span>
          ) : saveKey ? (
            <span className="reading-save" data-state={saved.status}>
              {t(saveKey)}
            </span>
          ) : null
        }
        flow={{
          pace: flow.settings.pace,
          narrating: flow.settings.narration,
          speaking: talk.voice.state === 'reading',
          paused: flow.paused,
          onPausedChange: flow.setPaused,
        }}
        tools={
          <LessonSettings
            settings={flow.settings}
            onChange={flow.change}
            voice={voicePrefs.prefs}
            onVoice={voicePrefs.change}
          />
        }
        conversation={{
          tutor: 'Nova',
          notes: talk.notes,
          busy: talk.busy,
          onAsk: talk.ask,
          open: talk.open,
          onOpenChange: talk.setOpen,
          composer: <TalkComposer voice={talk.voice} busy={talk.busy} onAsk={talk.ask} />,
          orb: <NovaOrb voice={talk.voice} onTap={() => talk.setOpen(!talk.open)} />,
        }}
      />
      {reference?.(context)}
      <NovaAssistant
        lesson={{}}
        studentName={studentName}
        context={context}
        controller={controller}
        onOpen={setAssistantOpen}
        hideCapsule
      />
    </div>
  );
}
