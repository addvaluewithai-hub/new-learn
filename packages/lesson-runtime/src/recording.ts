import type { LessonPackage, LessonRecording } from './types';

export const framesForRecording = (recording: LessonRecording, fps: number) =>
  Math.ceil((recording.durationMs / 1000) * fps);
export function recordingFor(pkg: LessonPackage, id: string) {
  const recording = pkg.recordings.find((r) => r.id === id);
  if (!recording) throw new Error(`Missing recording: ${id}`);
  return recording;
}
