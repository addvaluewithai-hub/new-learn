import type { ReactNode } from 'react';
import type { LessonContext, LessonController } from '../context';
import type { RendererRegistry } from '../renderers';
import type { LessonLayout } from '../types';
import type { BoardManifests } from './board';
import type { ReadingPosition } from './model';
import type { ThreadNote } from './thread';
import type { ReadingPackage } from './types';

/** How a lesson's questions are met: asked and answered (default), or shown with their answers. */
export type QuestionMode = 'ask' | 'show';

export type ReadingProgress = {
  position: ReadingPosition;
  reachedSceneIds: string[];
  answers: Record<string, string>;
  complete: boolean;
};
export type ReadingLessonProps = {
  lesson: ReadingPackage;
  registry: RendererRegistry;
  /** Manifests of the live boards this lesson may use, by board id (docs/boards.md). */
  boards?: BoardManifests;
  layout?: LessonLayout;
  /** Saved progress to resume from (positions that no longer exist start at the top). */
  initial?: Partial<ReadingProgress>;
  /** Questions are asked and answered (default), or shown with their model answers. */
  questions?: QuestionMode;
  /** Host overlay (e.g. the assistant) is open: keyboard navigation pauses. */
  suspended?: boolean;
  onContext?: (context: LessonContext) => void;
  onReady?: (controller: LessonController | null) => void;
  onProgress?: (progress: ReadingProgress) => void;
  /** Leaving the lesson (top bar close) and the default end action. */
  exit?: { label: string; href: string };
  /** The lesson that follows, offered on the completion screen. */
  next?: { title: string; href: string } | null;
  /** The host's tutor, woven into the lesson conversation. */
  conversation?: ReadingConversation;
  /** Moving on without pressing Next: at a reading pace, or after the host reads aloud. */
  flow?: ReadingFlow;
  /** Host controls in the top bar, e.g. listening settings. */
  tools?: ReactNode;
  /** Small host status in the top bar, e.g. "saved". */
  status?: ReactNode;
};

export type ReadingConversation = {
  tutor: string;
  notes: ThreadNote[];
  busy?: boolean;
  onAsk: (text: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Field and microphone: in the controls on wide screens, under the conversation on phones. */
  composer: ReactNode;
  /** The compact entry in the phone controls. */
  orb: ReactNode;
};

export type ReadingPace = 'slower' | 'normal' | 'faster';
export type ReadingFlow = {
  /** Turn the page alone after a reading time for this pace; null waits for Next. */
  pace: ReadingPace | null;
  /** The host reads each step aloud and calls `next()` when done (pace is ignored). */
  narrating?: boolean;
  /** The host's voice is reading right now. */
  speaking?: boolean;
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
};
