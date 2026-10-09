import type { ReactNode } from 'react';
import type { StateKind } from '../statesLesson';
export type SceneContext = {
  p: string;
  has: (id: string) => boolean;
  progress: (id: string, seconds?: number) => number;
  portrait: boolean;
  frame: number;
  reducedMotion: boolean;
  heading: string;
  model: (kind: StateKind, moving?: boolean, motionPhase?: string) => ReactNode;
  prompt: (english: string, arabic?: string) => ReactNode;
};
