// Board contract v1 (docs/boards.md). A board is teacher-made HTML that runs in a sandbox;
// the lesson owns its state, and our code (never the board) grades answers from it.
export const BOARD_API_VERSION = 1;

export type BoardVariable =
  | {
      type: 'number';
      min: number;
      max: number;
      step?: number;
      unit?: string;
      label?: string;
      default: number;
    }
  | { type: 'choice'; options: string[]; label?: string; default: string };

export type BoardLayout = 'landscape' | 'portrait';
/**
 * The fixed canvases every board draws on, in canvas pixels. The board helper scales the
 * whole canvas uniformly to fit the frame; every board supports both layouts.
 */
export const BOARD_CANVAS: Readonly<Record<BoardLayout, { width: number; height: number }>> = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
};

/** `board.json`: what a board declares about itself. */
export type BoardManifest = {
  apiVersion: typeof BOARD_API_VERSION;
  id: string;
  title: string;
  description: string;
  libraries: string[];
  variables: Record<string, BoardVariable>;
  targets: string[];
};

export type BoardValue = number | string;
export type BoardValues = Record<string, BoardValue>;
export type BoardNote = { target: string; text: string };
export type BoardInput = 'locked' | 'open';

/** The board as one reading step declares it. `state` carries forward; the rest does not. */
export type StepBoard = {
  state?: BoardValues;
  highlight?: string[];
  reveal?: string[];
  notes?: BoardNote[];
  input?: BoardInput;
};

export type BoardNumberCheck = {
  variable: string;
  kind: 'number';
  target: number;
  tolerance: number;
};
export type BoardChoiceCheck = { variable: string; kind: 'choice'; value: string };
export type BoardCheck =
  | BoardNumberCheck
  | BoardChoiceCheck
  | { kind: 'set'; checks: Array<BoardNumberCheck | BoardChoiceCheck> };

/** A question answered on the board: its starting state and how our code checks it. */
export type BoardQuestion = { state?: BoardValues; check: BoardCheck };

export type BoardPhase = 'teach' | 'ask' | 'attempt' | 'feedback';

/** Everything the board draws from, sent whole on every change (protocol `state`). */
export type BoardView = {
  variables: BoardValues;
  highlight: string[];
  reveal: string[];
  notes: BoardNote[];
  input: BoardInput;
  phase: BoardPhase;
  step: number;
};

/** What a board says about itself, for the tutor only; never used for grading. */
export type BoardObservation = { summary: string; details?: unknown };

/** A live board's link to the lesson, given to `html-board` renderers through VisualProps. */
export type BoardLink = {
  view: BoardView;
  /** The learner changed values on an open board (the host clamps them first). */
  onValues: (values: BoardValues) => void;
  onObservation: (observation: BoardObservation) => void;
};

/** A saved board answer: the values our code graded, and the text the learner saw. */
export type BoardAnswer = { values: BoardValues; text: string };
