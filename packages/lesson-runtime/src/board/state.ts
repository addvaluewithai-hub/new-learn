import { BOARD_TARGET } from './manifest';
import type {
  BoardAnswer,
  BoardCheck,
  BoardInput,
  BoardPhase,
  BoardValues,
  BoardView,
  StepBoard,
} from './types';

/**
 * The board at step `step` of a clip: `state` merged from the first step to this one over
 * `base`; highlight, reveal, notes and input belong to the step itself. Pure, so going back
 * or reloading always gives the same board.
 */
export function boardViewAt(
  steps: ReadonlyArray<{ board?: StepBoard }>,
  step: number,
  phase: BoardPhase,
  base: BoardValues = {},
  input?: BoardInput,
): BoardView {
  const variables = { ...base };
  for (const item of steps.slice(0, step + 1)) Object.assign(variables, item.board?.state);
  const own = steps[step]?.board;
  return {
    variables,
    highlight: own?.highlight ?? [],
    reveal: own?.reveal ?? [],
    notes: own?.notes ?? [],
    input: input ?? own?.input ?? 'locked',
    phase,
    step,
  };
}

/** Values our code accepts from a board answer, checked against the question. */
export function gradeBoard(check: BoardCheck, values: BoardValues): boolean {
  if (check.kind === 'set') return check.checks.every((c) => gradeBoard(c, values));
  const value = values[check.variable];
  if (check.kind === 'choice') return value === check.value;
  return typeof value === 'number' && Math.abs(value - check.target) <= check.tolerance + 1e-9;
}

export function encodeBoardAnswer(answer: BoardAnswer) {
  return JSON.stringify({ board: answer.values, text: answer.text });
}

/** A saved board answer, or null for a skipped or non-board answer. */
export function decodeBoardAnswer(raw: string | undefined): BoardAnswer | null {
  if (!raw?.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(raw) as { board?: unknown; text?: unknown };
    const values = parsed.board;
    if (!values || typeof values !== 'object' || Array.isArray(values)) return null;
    const clean: BoardValues = {};
    for (const [k, v] of Object.entries(values))
      if (typeof v === 'number' || typeof v === 'string') clean[k] = v;
    return { values: clean, text: typeof parsed.text === 'string' ? parsed.text : '' };
  } catch {
    return null;
  }
}

const isValues = (v: unknown) =>
  v === undefined ||
  (Boolean(v) &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.values(v as object).every(
      (x) => (typeof x === 'number' && Number.isFinite(x)) || typeof x === 'string',
    ));
const targets = (v: unknown) =>
  v === undefined ||
  (Array.isArray(v) && v.every((t) => typeof t === 'string' && BOARD_TARGET.test(t)));

/** Structural check of a step's board; names are checked against the manifest by the host. */
export function validStepBoard(board: StepBoard | undefined): boolean {
  if (board === undefined) return true;
  if (!board || typeof board !== 'object') return false;
  const notes = board.notes;
  return (
    isValues(board.state) &&
    targets(board.highlight) &&
    targets(board.reveal) &&
    (board.input === undefined || board.input === 'locked' || board.input === 'open') &&
    (notes === undefined ||
      (Array.isArray(notes) &&
        notes.every(
          (n) =>
            n && BOARD_TARGET.test(n.target) && typeof n.text === 'string' && n.text.length <= 200,
        )))
  );
}

export function validBoardCheck(check: BoardCheck | undefined): boolean {
  if (!check || typeof check !== 'object') return false;
  if (check.kind === 'set')
    return (
      Array.isArray(check.checks) &&
      check.checks.length > 0 &&
      check.checks.every((c) => c.kind !== ('set' as string) && validBoardCheck(c))
    );
  if (typeof check.variable !== 'string' || !check.variable) return false;
  if (check.kind === 'choice') return typeof check.value === 'string';
  return (
    check.kind === 'number' &&
    Number.isFinite(check.target) &&
    Number.isFinite(check.tolerance) &&
    check.tolerance >= 0
  );
}

/** Every variable name a lesson's step boards and checks refer to, for the host to verify. */
export function checkedVariables(check: BoardCheck): string[] {
  return check.kind === 'set' ? check.checks.map((c) => c.variable) : [check.variable];
}
