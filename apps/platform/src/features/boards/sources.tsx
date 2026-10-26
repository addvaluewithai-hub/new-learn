import { createContext, useContext } from 'react';
import type { BoardManifest } from '@learn/lesson-runtime';
import { boardEdition, boardOrigin } from './editions';

// Where a board key comes from: built course boards (editions.generated.json), or a teacher's
// uploaded board ("u:<hash>"), served by content hash from the board origin.

export type BoardSource = { key: string; hash: string; url: string; manifest: BoardManifest };
export type BoardReport = {
  layout: 'landscape' | 'portrait';
  width: number;
  problems: Array<{ check: string; element?: string; detail: string }>;
};
export type BoardSources = {
  get: (key: string) => BoardSource | null;
  /** Draft previews ask each board to check its own drawing and collect the reports here. */
  onReport?: (source: BoardSource, report: BoardReport) => void;
};

export function builtSource(key: string): BoardSource | null {
  const edition = boardEdition(key);
  return edition
    ? {
        key,
        hash: edition.hash,
        url: `${boardOrigin()}/e/${edition.hash}/index.html`,
        manifest: edition.manifest,
      }
    : null;
}

export function teacherSources(
  boards: Record<string, { hash: string; manifest: BoardManifest }>,
  onReport?: BoardSources['onReport'],
): BoardSources {
  return {
    get: (key) => {
      const board = boards[key];
      if (!board) return builtSource(key);
      return {
        key,
        hash: board.hash,
        url: `${boardOrigin()}/u/${board.hash}/index.html`,
        manifest: board.manifest,
      };
    },
    onReport,
  };
}

const Sources = createContext<BoardSources>({ get: builtSource });
export const BoardSourcesProvider = Sources.Provider;
export const useBoardSources = () => useContext(Sources);

/** The rules board:check uses, per layout (docs/boards.md "The canvas"). */
export const checkRules = (layout: 'landscape' | 'portrait') => ({
  minText: layout === 'portrait' ? 32 : 24,
  minControl: 88,
  edge: 8,
});

/** A board's own drawing report, read defensively (it comes from a sandboxed page). */
export function readReport(data: unknown): BoardReport | null {
  const m = data as Record<string, unknown> | null;
  if (!m || m.nl !== 1 || m.type !== 'report' || !Array.isArray(m.problems)) return null;
  if (m.layout !== 'landscape' && m.layout !== 'portrait') return null;
  const problems = m.problems.slice(0, 50).flatMap((p) => {
    const x = p as Record<string, unknown>;
    if (typeof x?.check !== 'string' || typeof x.detail !== 'string') return [];
    return [
      {
        check: x.check.slice(0, 40),
        detail: x.detail.slice(0, 300),
        ...(typeof x.element === 'string' ? { element: x.element.slice(0, 80) } : {}),
      },
    ];
  });
  return { layout: m.layout, width: Number(m.width) || 0, problems };
}
