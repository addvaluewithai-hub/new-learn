import type { BoardManifest, BoardValues, VisualProps } from '@learn/lesson-runtime';
import { HtmlBoard } from '../boards/HtmlBoard';
import { BoardSourcesProvider, teacherSources } from '../boards/sources';
import { Badge } from '../../shared/ui';
import { useI18n } from '../../i18n';
import type { BuildBoard } from './types';

/** One board as it stands: its own first state, live but not for playing. */
function props(board: BuildBoard) {
  const variables = Object.fromEntries(
    Object.entries(board.manifest.variables ?? {}).map(([k, v]) => [k, v.default]),
  ) as BoardValues;
  return {
    spec: { renderer: 'html-board', params: { board: board.boardId } },
    layout: 'landscape',
    reducedMotion: true,
    board: {
      view: {
        variables,
        highlight: [],
        reveal: [],
        notes: [],
        input: 'locked',
        phase: 'teach',
        step: 0,
      },
      onValues: () => {},
      onObservation: () => {},
    },
  } as unknown as VisualProps;
}

/** The storyboard: each board the builder makes appears here, live, as soon as it is uploaded. */
export function BuildBoards({ boards, working }: { boards: BuildBoard[]; working: boolean }) {
  const { t } = useI18n();
  if (!boards.length && !working) return null;
  const sources = teacherSources(
    Object.fromEntries(
      boards.map((b) => [b.boardId, { hash: b.hash, manifest: b.manifest as BoardManifest }]),
    ),
  );
  return (
    <section className="build-boards" aria-labelledby="build-boards-title">
      <h2 id="build-boards-title">
        {t('studio.boards.title')} <Badge>{boards.length}</Badge>
      </h2>
      <BoardSourcesProvider value={sources}>
        <ul>
          {boards.map((board) => (
            <li key={`${board.boardId}-${board.hash}`} className="build-board">
              <div className="build-board-frame">
                <HtmlBoard {...props(board)} />
              </div>
              <strong>
                <bdi>{board.title}</bdi>
              </strong>
            </li>
          ))}
          {working && (
            <li className="build-board build-board-next">
              <div className="build-board-frame" />
              <span>
                {boards.length ? t('studio.boards.drawingNext') : t('studio.boards.drawingFirst')}
              </span>
            </li>
          )}
        </ul>
      </BoardSourcesProvider>
    </section>
  );
}
