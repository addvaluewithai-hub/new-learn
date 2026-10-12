import type { ReactNode } from 'react';
import type { LessonContext, LessonController } from '../context';
import type { RendererRegistry } from '../renderers';
import type { LessonLayout } from '../types';
import type { ReadingPosition } from './model';
import type { ThreadNote } from './thread';
import type { ReadingPackage } from './types';

export type ReadingProgress = {
  position: ReadingPosition;
  reachedSceneIds: string[];
  answers: Record<string, string>;
  complete: boolean;
};
export type ReadingLessonProps = {
  lesson: ReadingPackage;
  registry: RendererRegistry;
  layout?: LessonLayout;
  /** Saved progress to resume from (positions that no longer exist start at the top). */
  initial?: Partial<ReadingProgress>;
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
