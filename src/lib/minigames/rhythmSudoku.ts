// Rhythm Sudoku — a sudoku whose symbols are rhythmic values instead of digits.
//
// Two boards ship:
//   • "mini"  — 6×6, boxes 3 wide × 2 tall, six values (one of them a rest)
//   • "full"  — 9×9, boxes 3 wide × 3 tall, nine values (two of them rests)
//
// Everything here is pure logic: value tables, a randomized generator that
// guarantees a single solution, a solver, conflict detection and scoring. The
// page component owns all rendering and interaction.

// ── Rhythm values ─────────────────────────────────────────────────────────────

// Glyph shapes the renderer knows how to draw. `dotted` is carried separately so
// a dotted half and a half share one head/stem recipe.
export type RhythmShape = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'rest_quarter' | 'rest_eighth';

export interface RhythmValue {
  id: string;
  /** What a band director would call it. */
  name: string;
  /** Short form for tight labels ("dotted 1/2"). */
  short: string;
  shape: RhythmShape;
  dotted: boolean;
  /** Duration in beats, counting a quarter note as one beat. */
  beats: number;
  /** True for rests — the value is counted, not played. */
  rest: boolean;
}

// The order here is the palette order (longest to shortest, rests last), and the
// index into it is what the board stores.
export const MINI_VALUES: RhythmValue[] = [
  { id: 'w',   name: 'Whole note',        short: 'whole',      shape: 'whole',        dotted: false, beats: 4,   rest: false },
  { id: 'hd',  name: 'Dotted half note',  short: 'dot. half',  shape: 'half',         dotted: true,  beats: 3,   rest: false },
  { id: 'h',   name: 'Half note',         short: 'half',       shape: 'half',         dotted: false, beats: 2,   rest: false },
  { id: 'q',   name: 'Quarter note',      short: 'quarter',    shape: 'quarter',      dotted: false, beats: 1,   rest: false },
  { id: 'e',   name: 'Eighth note',       short: 'eighth',     shape: 'eighth',       dotted: false, beats: 0.5, rest: false },
  { id: 'qr',  name: 'Quarter rest',      short: 'qtr rest',   shape: 'rest_quarter', dotted: false, beats: 1,   rest: true },
];

export const FULL_VALUES: RhythmValue[] = [
  { id: 'w',   name: 'Whole note',          short: 'whole',      shape: 'whole',        dotted: false, beats: 4,    rest: false },
  { id: 'hd',  name: 'Dotted half note',    short: 'dot. half',  shape: 'half',         dotted: true,  beats: 3,    rest: false },
  { id: 'h',   name: 'Half note',           short: 'half',       shape: 'half',         dotted: false, beats: 2,    rest: false },
  { id: 'qd',  name: 'Dotted quarter note', short: 'dot. qtr',   shape: 'quarter',      dotted: true,  beats: 1.5,  rest: false },
  { id: 'q',   name: 'Quarter note',        short: 'quarter',    shape: 'quarter',      dotted: false, beats: 1,    rest: false },
  { id: 'e',   name: 'Eighth note',         short: 'eighth',     shape: 'eighth',       dotted: false, beats: 0.5,  rest: false },
  { id: 's',   name: 'Sixteenth note',      short: 'sixteenth',  shape: 'sixteenth',    dotted: false, beats: 0.25, rest: false },
  { id: 'qr',  name: 'Quarter rest',        short: 'qtr rest',   shape: 'rest_quarter', dotted: false, beats: 1,    rest: true },
  { id: 'er',  name: 'Eighth rest',         short: '8th rest',   shape: 'rest_eighth',  dotted: false, beats: 0.5,  rest: true },
];

// ── Board shape ───────────────────────────────────────────────────────────────

export type VariantId = 'mini' | 'full';

export interface VariantDef {
  id: VariantId;
  name: string;
  blurb: string;
  size: number;    // cells per row/column
  boxW: number;    // box width in cells
  boxH: number;    // box height in cells
  values: RhythmValue[];
}

export const VARIANTS: Record<VariantId, VariantDef> = {
  mini: {
    id: 'mini',
    name: 'Mini Staff',
    blurb: '6×6 board · six values · a warm-up for the rhythm section',
    size: 6, boxW: 3, boxH: 2,
    values: MINI_VALUES,
  },
  full: {
    id: 'full',
    name: 'Full Score',
    blurb: '9×9 board · nine values · the concert-hall challenge',
    size: 9, boxW: 3, boxH: 3,
    values: FULL_VALUES,
  },
};

export type Difficulty = 'apprentice' | 'performer' | 'maestro';

export const DIFFICULTIES: { id: Difficulty; name: string; blurb: string }[] = [
  { id: 'apprentice', name: 'Apprentice', blurb: 'Lots of givens — good for a first read' },
  { id: 'performer',  name: 'Performer',  blurb: 'A fair sight-read' },
  { id: 'maestro',    name: 'Maestro',    blurb: 'Sparse clues — think ahead' },
];

// Target number of givens left on the board. The digger stops early if removing
// more would cost the puzzle its single solution, so these are goals, not vows.
const CLUE_TARGETS: Record<VariantId, Record<Difficulty, number>> = {
  mini: { apprentice: 20, performer: 16, maestro: 12 },
  full: { apprentice: 40, performer: 32, maestro: 26 },
};

/** A cell holds a value index (0-based, into the variant's value list) or null. */
export type Cell = number | null;

export interface Puzzle {
  variant: VariantId;
  difficulty: Difficulty;
  /** Row-major starting board; non-null entries are the givens. */
  givens: Cell[];
  /** Row-major completed board. */
  solution: number[];
}

// ── Solver ────────────────────────────────────────────────────────────────────

/** Index of the box containing (row, col). */
export function boxIndex(v: VariantDef, row: number, col: number): number {
  const perRow = v.size / v.boxW;
  return Math.floor(row / v.boxH) * perRow + Math.floor(col / v.boxW);
}

/** Whether `value` may legally go in (row, col) given the rest of the board. */
export function isLegal(v: VariantDef, board: Cell[], row: number, col: number, value: number): boolean {
  for (let c = 0; c < v.size; c++) {
    if (c !== col && board[row * v.size + c] === value) return false;
  }
  for (let r = 0; r < v.size; r++) {
    if (r !== row && board[r * v.size + col] === value) return false;
  }
  const r0 = Math.floor(row / v.boxH) * v.boxH;
  const c0 = Math.floor(col / v.boxW) * v.boxW;
  for (let r = r0; r < r0 + v.boxH; r++) {
    for (let c = c0; c < c0 + v.boxW; c++) {
      if ((r !== row || c !== col) && board[r * v.size + c] === value) return false;
    }
  }
  return true;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Count solutions, stopping as soon as `limit` are found. Used both to fill a
 * blank grid (limit 1) and to prove uniqueness while digging (limit 2).
 * Always branches on the most-constrained empty cell, which keeps the 9×9
 * search cheap enough to run dozens of times per generated puzzle.
 */
function countSolutions(v: VariantDef, board: Cell[], limit: number, rng: () => number, out?: number[]): number {
  let bestIdx = -1;
  let bestCandidates: number[] | null = null;

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue;
    const row = Math.floor(i / v.size);
    const col = i % v.size;
    const candidates: number[] = [];
    for (let val = 0; val < v.size; val++) {
      if (isLegal(v, board, row, col, val)) candidates.push(val);
    }
    if (candidates.length === 0) return 0;      // dead end
    if (bestCandidates === null || candidates.length < bestCandidates.length) {
      bestIdx = i;
      bestCandidates = candidates;
      if (candidates.length === 1) break;       // can't do better than forced
    }
  }

  if (bestCandidates === null) {                // no empties left — a solution
    if (out) for (let i = 0; i < board.length; i++) out[i] = board[i] as number;
    return 1;
  }

  let found = 0;
  for (const val of shuffled(bestCandidates, rng)) {
    board[bestIdx] = val;
    found += countSolutions(v, board, limit - found, rng, out);
    board[bestIdx] = null;
    if (found >= limit) break;
  }
  return found;
}

/** Solve a board completely, or return null if it has no solution. */
export function solveBoard(v: VariantDef, board: Cell[]): number[] | null {
  const work = board.slice();
  const out = new Array<number>(board.length).fill(0);
  const rng = Math.random;
  return countSolutions(v, work, 1, rng, out) === 1 ? out : null;
}

// ── Generator ─────────────────────────────────────────────────────────────────

function generateSolution(v: VariantDef, rng: () => number): number[] {
  const board: Cell[] = new Array(v.size * v.size).fill(null);
  const out = new Array<number>(v.size * v.size).fill(0);
  countSolutions(v, board, 1, rng, out);
  return out;
}

/**
 * Dig holes out of a solved grid, keeping a single solution at every step.
 * Cells are tried in random order and a removal is rolled back the moment it
 * would let a second solution in, so the result is always uniquely solvable.
 */
export function generatePuzzle(
  variant: VariantId,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): Puzzle {
  const v = VARIANTS[variant];
  const solution = generateSolution(v, rng);
  const board: Cell[] = solution.slice();
  const target = CLUE_TARGETS[variant][difficulty];

  let remaining = board.length;
  for (const idx of shuffled(board.map((_, i) => i), rng)) {
    if (remaining <= target) break;
    const saved = board[idx];
    board[idx] = null;
    const work = board.slice();
    if (countSolutions(v, work, 2, rng) === 1) remaining--;
    else board[idx] = saved;                    // ambiguous — put it back
  }

  return { variant, difficulty, givens: board, solution };
}

// ── Play state helpers ────────────────────────────────────────────────────────

/**
 * Every filled cell that duplicates another filled cell in its row, column or
 * box. Returned as a Set of board indices so the grid can tint both offenders.
 */
export function conflictCells(v: VariantDef, board: Cell[]): Set<number> {
  const bad = new Set<number>();
  const scan = (indices: number[]) => {
    const seen = new Map<number, number[]>();
    for (const i of indices) {
      const val = board[i];
      if (val === null) continue;
      const list = seen.get(val);
      if (list) list.push(i);
      else seen.set(val, [i]);
    }
    for (const list of seen.values()) {
      if (list.length > 1) for (const i of list) bad.add(i);
    }
  };

  for (let r = 0; r < v.size; r++) {
    scan(Array.from({ length: v.size }, (_, c) => r * v.size + c));
  }
  for (let c = 0; c < v.size; c++) {
    scan(Array.from({ length: v.size }, (_, r) => r * v.size + c));
  }
  for (let br = 0; br < v.size / v.boxH; br++) {
    for (let bc = 0; bc < v.size / v.boxW; bc++) {
      const cells: number[] = [];
      for (let r = 0; r < v.boxH; r++) {
        for (let c = 0; c < v.boxW; c++) {
          cells.push((br * v.boxH + r) * v.size + (bc * v.boxW + c));
        }
      }
      scan(cells);
    }
  }
  return bad;
}

/** True once every cell is filled and no cell conflicts. */
export function isSolved(v: VariantDef, board: Cell[]): boolean {
  return board.every((c) => c !== null) && conflictCells(v, board).size === 0;
}

/** How many of each value are already placed — drives the palette's "used up" state. */
export function valueCounts(v: VariantDef, board: Cell[]): number[] {
  const counts = new Array<number>(v.size).fill(0);
  for (const cell of board) if (cell !== null) counts[cell]++;
  return counts;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface RunStats {
  /** Wrong values entered (counted when the player asks for a check). */
  mistakes: number;
  /** Cells revealed by the Reveal button. */
  hints: number;
  /** Seconds elapsed. */
  seconds: number;
}

/**
 * A 0–100 score for a cleared board. Clean solving keeps the full 100; every
 * mistake and every revealed cell takes a bite, and finishing slower than the
 * board's par time costs a little more.
 */
export function scoreRun(variant: VariantId, difficulty: Difficulty, stats: RunStats): number {
  const par = PAR_SECONDS[variant][difficulty];
  const overtime = Math.max(0, stats.seconds - par);
  const timePenalty = Math.min(20, (overtime / par) * 20);
  const raw = 100 - stats.mistakes * 4 - stats.hints * 8 - timePenalty;
  return Math.max(0, Math.round(raw));
}

/** Par times (seconds) — generous enough that a careful student clears them. */
export const PAR_SECONDS: Record<VariantId, Record<Difficulty, number>> = {
  mini: { apprentice: 180, performer: 300, maestro: 480 },
  full: { apprentice: 480, performer: 720, maestro: 1080 },
};

export type SudokuRating = 'superior' | 'excellent' | 'good' | 'fair' | 'poor';

export function ratingForScore(score: number): SudokuRating {
  if (score >= 90) return 'superior';
  if (score >= 75) return 'excellent';
  if (score >= 55) return 'good';
  if (score >= 35) return 'fair';
  return 'poor';
}

/** m:ss for the timer and best-time readouts. */
export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
