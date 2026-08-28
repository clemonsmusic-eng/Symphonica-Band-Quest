// Note Rush — the scrolling-staff rhythm mini-game ("guitar hero on a staff").
//
// The chart is an ordinary Excerpt, seated for the player's instrument, so every
// selection in the library (built-in, composed, or imported) is playable. Instead
// of five fret lanes the game has seven *letter* lanes — C D E F G A B — and the
// note you must press is the letter the notehead sits on. Octave and accidentals
// don't change the lane, so reading the staff position is the whole skill.
//
// Pure logic only: geometry lives in NoteRushStaff, timing in NoteRushGame.
import type { Duration } from '../../types/diagrams';
import type { Rating } from '../../types/game';
import type { SeatedExcerpt } from './transposition';
import { seatedStep } from './transposition';
import { parsePitch } from './staff';

// ── Lanes ─────────────────────────────────────────────────────────────────────

export const LANE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type LaneLetter = (typeof LANE_LETTERS)[number];

/** Home-row keys, left to right, one per letter lane. */
export const LANE_KEY_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ'];
export const LANE_KEY_LABELS = ['A', 'S', 'D', 'F', 'G', 'H', 'J'];

// Boomwhacker-style note colours (C red → B magenta): the same convention
// elementary classrooms use for chime bars, so the colour cue transfers.
export const LANE_COLORS = [
  '#E2453C', // C  red
  '#F0872A', // D  orange
  '#EFCE2F', // E  yellow
  '#79CE4A', // F  green
  '#2FB6A8', // G  teal
  '#6E7BE2', // A  indigo
  '#D75BC0', // B  magenta
];

/** Lane index (0–6) for a written pitch letter. */
export function laneForLetter(letter: string): number {
  return LANE_LETTERS.indexOf(letter.toUpperCase() as LaneLetter);
}

/** Lane index for a keyboard event code, or -1. Accepts home row and digits 1–7. */
export function laneForKey(code: string): number {
  const home = LANE_KEY_CODES.indexOf(code);
  if (home >= 0) return home;
  const digit = code.match(/^Digit([1-7])$/);
  return digit ? Number(digit[1]) - 1 : -1;
}

// ── Chart ─────────────────────────────────────────────────────────────────────

/** One playable note on the scrolling staff. */
export interface RushNote {
  id: number;               // index into the seated excerpt's note list
  lane: number;             // 0–6 letter lane
  letter: LaneLetter;
  beat: number;             // onset, in beats from the start of the chart
  durationBeats: number;
  sustainBeats: number;     // scored hold length (0 for short notes)
  step: number;             // staff step (0 = bottom line) for vertical layout
  dur: Duration;            // notehead shape
  soundingMidi: number;     // concert pitch — what the mic should hear
  accidental: 'sharp' | 'flat' | 'natural' | null;
}

/** A rest, drawn on the staff but never played. */
export interface RushRest {
  beat: number;
  dur: Duration;
}

export interface RushChart {
  notes: RushNote[];
  rests: RushRest[];
  /** Beat the last note releases on. */
  endBeat: number;
}

// Notes at least this long are holds: you keep the key down through the tail.
const SUSTAIN_MIN_BEATS = 1.75;

/** Turn a seated excerpt into a playable chart. */
export function buildChart(seated: SeatedExcerpt): RushChart {
  const notes: RushNote[] = [];
  const rests: RushRest[] = [];

  for (const n of seated.notes) {
    if (n.rest || n.spelled === null || n.soundingMidi === null) {
      rests.push({ beat: n.startBeat, dur: n.dur });
      continue;
    }
    const letter = parsePitch(n.spelled.pitch).letter as LaneLetter;
    notes.push({
      id: n.index,
      lane: laneForLetter(letter),
      letter,
      beat: n.startBeat,
      durationBeats: n.durationBeats,
      sustainBeats: n.durationBeats >= SUSTAIN_MIN_BEATS ? n.durationBeats - 0.5 : 0,
      step: seatedStep(n, seated.clef),
      dur: n.dur,
      soundingMidi: n.soundingMidi,
      accidental: n.spelled.forceAcc,
    });
  }

  const endBeat = seated.notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0);
  return { notes, rests, endBeat };
}

// ── Difficulty ────────────────────────────────────────────────────────────────

export type DifficultyId = 'cadet' | 'player' | 'virtuoso';

export interface Difficulty {
  id: DifficultyId;
  name: string;
  blurb: string;
  tempoMult: number;    // scales the excerpt's written tempo
  windowMult: number;   // scales the hit windows
  /** Whether pressing a lane with no note there breaks the streak. */
  penalizeWrongNotes: boolean;
  scoreMult: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'cadet',    name: 'Cadet',    blurb: 'Slower tempo, forgiving timing, no penalty for a wrong letter.',
    tempoMult: 0.75, windowMult: 1.6, penalizeWrongNotes: false, scoreMult: 1.0 },
  { id: 'player',   name: 'Section',  blurb: 'Written tempo. A wrong letter breaks your streak.',
    tempoMult: 1.0,  windowMult: 1.0, penalizeWrongNotes: true,  scoreMult: 1.5 },
  { id: 'virtuoso', name: 'Virtuoso', blurb: 'Faster than written, razor-thin timing windows.',
    tempoMult: 1.25, windowMult: 0.65, penalizeWrongNotes: true, scoreMult: 2.0 },
];

export const DIFFICULTY_BY_ID: Record<DifficultyId, Difficulty> =
  Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d])) as Record<DifficultyId, Difficulty>;

// ── Judgment ──────────────────────────────────────────────────────────────────

export type Judgment = 'perfect' | 'great' | 'good' | 'miss';

export const JUDGMENT_LABEL: Record<Judgment, string> = {
  perfect: 'PERFECT', great: 'GREAT', good: 'GOOD', miss: 'MISS',
};

export const JUDGMENT_COLOR: Record<Judgment, string> = {
  perfect: '#FFD700', // rating-superior
  great:   '#4ADE80', // rating-excellent
  good:    '#60A5FA', // rating-good
  miss:    '#F87171', // rating-poor
};

const JUDGMENT_POINTS: Record<Judgment, number> = { perfect: 100, great: 60, good: 30, miss: 0 };
/** Share of a note's accuracy credit, used for the final percentage. */
const JUDGMENT_CREDIT: Record<Judgment, number> = { perfect: 1, great: 0.85, good: 0.55, miss: 0 };

export interface HitWindows {
  perfect: number;  // ms — half-width of each window, measured from the onset
  great: number;
  good: number;
}

/**
 * Timing windows in milliseconds. The player's technique stat sets the base
 * (`rhythmToleranceMs`, 150ms at level 1 down to 50ms at 40+) and difficulty
 * scales it, so a stronger character genuinely reads with more slack.
 */
export function hitWindows(rhythmTolMs: number, difficulty: Difficulty): HitWindows {
  const good = rhythmTolMs * difficulty.windowMult;
  return { perfect: good * 0.35, great: good * 0.62, good };
}

/** Which judgment a timing error earns, or null when it is outside every window. */
export function judgeOffset(offsetMs: number, w: HitWindows): Judgment | null {
  const d = Math.abs(offsetMs);
  if (d <= w.perfect) return 'perfect';
  if (d <= w.great) return 'great';
  if (d <= w.good) return 'good';
  return null;
}

// ── Live run state ────────────────────────────────────────────────────────────

export interface NoteState {
  judgment: Judgment | null;   // null = still pending
  offsetMs: number;
  /** Beats of the tail actually held (0 when the note has no tail). */
  sustainHeld: number;
  sustainDone: boolean;
}

export interface RushStats {
  score: number;
  combo: number;
  maxCombo: number;
  counts: Record<Judgment, number>;
  wrongNotes: number;
  surge: number;               // 0–100 meter
  surgeActive: boolean;
  surgeEndsAtBeat: number;
}

export function initialStats(): RushStats {
  return {
    score: 0, combo: 0, maxCombo: 0,
    counts: { perfect: 0, great: 0, good: 0, miss: 0 },
    wrongNotes: 0, surge: 0, surgeActive: false, surgeEndsAtBeat: 0,
  };
}

/** Streak multiplier, Guitar Hero style: ×1 → ×4, doubled while a Surge burns. */
export function multiplierFor(combo: number, surgeActive: boolean): number {
  const base = Math.min(4, 1 + Math.floor(combo / 8));
  return surgeActive ? base * 2 : base;
}

export const SURGE_READY = 50;        // meter needed before a Surge can be spent
export const SURGE_BEATS = 8;         // how long an activated Surge lasts
const SURGE_GAIN: Record<Judgment, number> = { perfect: 7, great: 4, good: 1.5, miss: 0 };

/** Points a judged note is worth, before the sustain bonus. */
export function pointsFor(j: Judgment, combo: number, surgeActive: boolean, difficulty: Difficulty): number {
  return Math.round(JUDGMENT_POINTS[j] * multiplierFor(combo, surgeActive) * difficulty.scoreMult);
}

/** Bonus for a completed (or broken) hold: 40 points per beat actually held. */
export function sustainPoints(beatsHeld: number, combo: number, surgeActive: boolean, difficulty: Difficulty): number {
  return Math.round(40 * beatsHeld * multiplierFor(combo, surgeActive) * difficulty.scoreMult);
}

/**
 * Fold a judged note into the running stats (mutates and returns `s`).
 * A miss resets the streak; anything else extends it and charges the Surge meter.
 */
export function applyJudgment(s: RushStats, j: Judgment, difficulty: Difficulty): RushStats {
  s.counts[j] += 1;
  if (j === 'miss') {
    s.combo = 0;
    return s;
  }
  s.score += pointsFor(j, s.combo, s.surgeActive, difficulty);
  s.combo += 1;
  s.maxCombo = Math.max(s.maxCombo, s.combo);
  if (!s.surgeActive) s.surge = Math.min(100, s.surge + SURGE_GAIN[j]);
  return s;
}

/** Pressing a lane with nothing to hit: costs the streak on harder settings. */
export function applyWrongNote(s: RushStats, difficulty: Difficulty): RushStats {
  s.wrongNotes += 1;
  if (difficulty.penalizeWrongNotes) s.combo = 0;
  return s;
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface RushResult {
  score: number;
  maxCombo: number;
  counts: Record<Judgment, number>;
  wrongNotes: number;
  totalNotes: number;
  notesHit: number;
  accuracyPct: number;   // 0–100, weighted by judgment quality
  fullCombo: boolean;
  rating: Rating;
}

export function summarize(stats: RushStats, totalNotes: number): RushResult {
  const credit = (Object.keys(JUDGMENT_CREDIT) as Judgment[])
    .reduce((sum, j) => sum + stats.counts[j] * JUDGMENT_CREDIT[j], 0);
  const accuracyPct = totalNotes > 0 ? Math.round((credit / totalNotes) * 100) : 0;
  const notesHit = stats.counts.perfect + stats.counts.great + stats.counts.good;
  return {
    score: stats.score,
    maxCombo: stats.maxCombo,
    counts: { ...stats.counts },
    wrongNotes: stats.wrongNotes,
    totalNotes,
    notesHit,
    accuracyPct,
    fullCombo: totalNotes > 0 && stats.maxCombo >= totalNotes,
    rating: ratingFor(accuracyPct),
  };
}

/** Same thresholds the rest of the game uses to band a percentage score. */
export function ratingFor(pct: number): Rating {
  if (pct >= 90) return 'superior';
  if (pct >= 75) return 'excellent';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'fair';
  return 'poor';
}

// ── High scores (local, per character + chart + difficulty) ───────────────────

export interface HighScore { score: number; accuracyPct: number; maxCombo: number; fullCombo: boolean }

const HS_KEY = 'bq_note_rush_scores';

type HighScoreMap = Record<string, HighScore>;

function scoreKey(characterId: string, excerptId: string, difficulty: DifficultyId): string {
  return `${characterId}:${excerptId}:${difficulty}`;
}

function loadAll(): HighScoreMap {
  try {
    const raw = localStorage.getItem(HS_KEY);
    return raw ? (JSON.parse(raw) as HighScoreMap) : {};
  } catch {
    return {};
  }
}

export function loadHighScore(characterId: string, excerptId: string, difficulty: DifficultyId): HighScore | null {
  return loadAll()[scoreKey(characterId, excerptId, difficulty)] ?? null;
}

/** Store a run if it beats the stored score. Returns true when it was a new best. */
export function saveHighScore(
  characterId: string, excerptId: string, difficulty: DifficultyId, result: RushResult,
): boolean {
  const all = loadAll();
  const key = scoreKey(characterId, excerptId, difficulty);
  const prev = all[key];
  if (prev && prev.score >= result.score) return false;
  all[key] = {
    score: result.score, accuracyPct: result.accuracyPct,
    maxCombo: result.maxCombo, fullCombo: result.fullCombo,
  };
  try { localStorage.setItem(HS_KEY, JSON.stringify(all)); } catch { /* ignore quota */ }
  return true;
}

/** Best score across every difficulty for a chart (for the song browser). */
export function bestForExcerpt(characterId: string, excerptId: string): HighScore | null {
  const all = loadAll();
  let best: HighScore | null = null;
  for (const d of DIFFICULTIES) {
    const hs = all[scoreKey(characterId, excerptId, d.id)];
    if (hs && (!best || hs.score > best.score)) best = hs;
  }
  return best;
}
