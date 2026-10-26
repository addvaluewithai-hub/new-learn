import { BOARD_API_VERSION } from './types';
import type { BoardObservation, BoardView } from './types';

// postMessage protocol v1 between the lesson (host) and a sandboxed board. Every message is
// { nl: 1, type, ... }. Unknown types are ignored so later versions can add messages.
export const OBSERVATION_MAX_BYTES = 8192;

export type BoardEnvironment = {
  apiVersion: typeof BOARD_API_VERSION;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  theme: 'light' | 'dark';
  reducedMotion: boolean;
};
export type HostMessage =
  | ({ nl: 1; type: 'init' } & BoardEnvironment)
  | { nl: 1; type: 'state'; view: BoardView };

export type BoardMessage =
  | { type: 'ready'; apiVersion: number }
  | { type: 'variables'; values: Record<string, unknown> }
  | { type: 'observation'; observation: BoardObservation }
  | { type: 'error'; message: string };

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

/** Read one untrusted message from a board; anything malformed or oversized is null. */
export function readBoardMessage(data: unknown): BoardMessage | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.nl !== 1) return null;
  if (m.type === 'ready' && typeof m.apiVersion === 'number')
    return { type: 'ready', apiVersion: m.apiVersion };
  if (
    m.type === 'variables' &&
    m.values &&
    typeof m.values === 'object' &&
    !Array.isArray(m.values)
  )
    return { type: 'variables', values: m.values as Record<string, unknown> };
  if (m.type === 'error')
    return { type: 'error', message: String(m.message ?? 'Board error').slice(0, 300) };
  if (m.type !== 'observation') return null;
  const o = m.observation as BoardObservation | undefined;
  if (!o || typeof o.summary !== 'string' || !o.summary.trim()) return null;
  try {
    if (bytes(o) > OBSERVATION_MAX_BYTES) return null;
  } catch {
    return null;
  }
  return {
    type: 'observation',
    observation: { summary: o.summary.slice(0, 400), details: o.details },
  };
}
