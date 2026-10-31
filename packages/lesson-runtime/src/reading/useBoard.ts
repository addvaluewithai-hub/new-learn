import { useMemo, useRef, useState } from 'react';
import { clampValues, describeValues } from '../board/manifest';
import { checkedVariables, encodeBoardAnswer } from '../board/state';
import type { BoardLink, BoardObservation, BoardValues } from '../board/types';
import type { LessonContext } from '../context';
import { boardManifest, readingBoardView, type BoardManifests, type LearnerValues } from './board';
import type { ReadingPackage, ReadingPage } from './types';
import { useRuntimeText } from '../text';

/**
 * The live board of the current page: what it shows, the learner's own changes, and what the
 * board last said about itself. `answer()` is the learner's board answer, built by our code.
 */
export function useReadingBoard(
  lesson: ReadingPackage,
  pages: ReadingPage[],
  index: number,
  answers: Record<string, string>,
  boards?: BoardManifests,
) {
  const { listSeparator } = useRuntimeText();
  const page = pages[index];
  const scene = lesson.scenes[page.scene];
  const q = scene.question;
  const manifest = boardManifest(
    page.kind === 'feedback' ? q!.feedback.visual : scene.visual,
    boards,
  );
  const [learner, setLearner] = useState<LearnerValues>({});
  const [said, setSaid] = useState<{ id: string; observation: BoardObservation } | null>(null);
  // A board's report belongs to that board; another board starts with none.
  const observation = said && said.id === manifest?.id ? said.observation : null;
  const view = manifest ? readingBoardView(lesson, pages, index, answers, learner, manifest) : null;
  const key = JSON.stringify(view);
  const now = useRef({ view, index });
  now.current = { view, index };
  const link = useMemo<BoardLink | null>(
    () =>
      view && manifest
        ? {
            view,
            onValues: (values: BoardValues) => {
              const current = now.current;
              if (current.view?.input !== 'open') return;
              const clean = clampValues(manifest, values);
              setLearner((all) => {
                const next = { ...all };
                for (const [name, value] of Object.entries(clean))
                  next[name] = { value, page: current.index };
                return next;
              });
            },
            onObservation: (observation) => setSaid({ id: manifest.id, observation }),
          }
        : null,
    // The view is rebuilt every render; its content decides when the link changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, manifest],
  );
  const answer = () => {
    if (!view || !manifest || !q?.board) return '';
    const names = checkedVariables(q.board.check);
    const shown = Object.fromEntries(names.map((n) => [n, view.variables[n]]));
    return encodeBoardAnswer({
      values: view.variables,
      text: describeValues(manifest, shown, listSeparator),
    });
  };
  const context: LessonContext['board'] =
    view && manifest
      ? { id: manifest.id, variables: view.variables, observation: observation?.summary ?? null }
      : undefined;
  return { link, answer, context, observed: observation?.summary ?? '' };
}
