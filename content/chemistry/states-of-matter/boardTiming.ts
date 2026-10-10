import S01 from './data/board/S01.json';
import S02 from './data/board/S02.json';
import S03 from './data/board/S03.json';
import S04 from './data/board/S04.json';
import S09 from './data/board/S09.json';
import S05 from './data/board/S05.json';
import S06 from './data/board/S06.json';
import S07 from './data/board/S07.json';
import S08 from './data/board/S08.json';
import S11 from './data/board/S11.json';
import S10 from './data/board/S10.json';
import edition from './data/board/edition.json';
const timeline = { ...edition, beats: [S01, S02, S03, S04, S09, S05, S06, S07, S08, S11, S10] };
import { STATES_FPS, type StatesRecording } from './statesLesson';

export const STATES_BOARD_TIMELINE = timeline;
export function boardTiming(recording: StatesRecording) {
  const beat = timeline.beats.find((b) => b.id === recording.id);
  if (!beat) throw new Error(`Missing board choreography: ${recording.id}`);
  // A retake needs re-alignment; never apply old visual timing to a new voice file.
  if (
    recording.audioHash &&
    (recording.audioHash !== beat.audioHash || recording.durationMs !== beat.durationMs)
  )
    throw new Error(`Board/audio mismatch: ${recording.id}`);
  return beat;
}
export function boardAt(recording: StatesRecording, frame: number) {
  const beat = boardTiming(recording);
  const ms = (frame / STATES_FPS) * 1000;
  const active = [...beat.phases].reverse().find((p) => p.atMs <= ms);
  const at = (id: string) => {
    const phase = beat.phases.find((p) => p.id === id);
    if (!phase) throw new Error(`Missing board phrase: ${beat.id}/${id}`);
    return phase.atMs;
  };
  return {
    phase: active?.id ?? 'opening',
    has: (id: string) => ms >= at(id),
    frameSince: (id: string) => Math.max(0, frame - (at(id) / 1000) * STATES_FPS),
    progress: (id: string, seconds = 1.4) =>
      Math.max(0, Math.min(1, (ms - at(id)) / (seconds * 1000))),
    age: active ? (ms - active.atMs) / 1000 : 0,
  };
}
