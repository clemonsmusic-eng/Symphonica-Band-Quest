import type { Excerpt, ScoreNote, ExcerptChallengeType } from './types';

// ── builders ────────────────────────────────────────────────────────────────
/** Evenly-spaced notes, each `dur` beats (null = rest). */
function seq(midis: (number | null)[], dur = 1): ScoreNote[] {
  return midis.map((midi, i) => ({ midi, startBeat: i * dur, durationBeats: dur }));
}
/** Notes from [midi|null, durationBeats] pairs, laid end to end. */
function fromPairs(pairs: [number | null, number][]): ScoreNote[] {
  let t = 0;
  return pairs.map(([midi, d]) => { const n = { midi, startBeat: t, durationBeats: d }; t += d; return n; });
}

// Concert-pitch MIDI (60 = C4). One octave, ascending then descending scales.
const upDown = (asc: number[]): number[] => [...asc, ...asc.slice(0, -1).reverse()];

// ── the library ───────────────────────────────────────────────────────────────
export const EXCERPTS: Excerpt[] = [
  // Technique — major scales in common concert band keys (one octave up & down).
  {
    id: 'scale_bb_major', title: 'B♭ Major Scale', challengeType: 'technique_scale', grade: 1,
    bpm: 88, timeSig: [4, 4], keySig: -2, source: 'builtin',
    notes: seq(upDown([58, 60, 62, 63, 65, 67, 69, 70])),
  },
  {
    id: 'scale_eb_major', title: 'E♭ Major Scale', challengeType: 'technique_scale', grade: 1,
    bpm: 88, timeSig: [4, 4], keySig: -3, source: 'builtin',
    notes: seq(upDown([63, 65, 67, 68, 70, 72, 74, 75])),
  },
  {
    id: 'scale_f_major', title: 'F Major Scale', challengeType: 'technique_scale', grade: 1,
    bpm: 88, timeSig: [4, 4], keySig: -1, source: 'builtin',
    notes: seq(upDown([65, 67, 69, 70, 72, 74, 76, 77])),
  },
  {
    id: 'scale_c_major', title: 'Concert C Major Scale', challengeType: 'technique_scale', grade: 2,
    bpm: 92, timeSig: [4, 4], keySig: 0, source: 'builtin',
    notes: seq(upDown([60, 62, 64, 65, 67, 69, 71, 72])),
  },
  {
    id: 'scale_ab_major', title: 'A♭ Major Scale', challengeType: 'technique_scale', grade: 2,
    bpm: 84, timeSig: [4, 4], keySig: -4, source: 'builtin',
    notes: seq(upDown([56, 58, 60, 61, 63, 65, 67, 68])),
  },
  {
    id: 'scale_chromatic', title: 'Chromatic Scale', challengeType: 'technique_scale', grade: 3,
    bpm: 76, timeSig: [4, 4], keySig: 0, source: 'builtin',
    notes: seq([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72], 0.5),
  },
  {
    id: 'arp_bb_major', title: 'B♭ Major Arpeggio', challengeType: 'technique_scale', grade: 2,
    bpm: 84, timeSig: [4, 4], keySig: -2, source: 'builtin',
    notes: seq([58, 62, 65, 70, 65, 62, 58]),
  },

  // Prepared performance — short public-domain themes (concert pitch).
  {
    id: 'ode_to_joy', title: 'Ode to Joy (opening)', composer: 'Beethoven',
    challengeType: 'prepared_performance', grade: 1, bpm: 96, timeSig: [4, 4], keySig: 0, source: 'builtin',
    notes: seq([64, 64, 65, 67, 67, 65, 64, 62]), // E E F G G F E D
  },
  {
    id: 'lightly_row', title: 'Lightly Row', composer: 'Trad.',
    challengeType: 'prepared_performance', grade: 1, bpm: 100, timeSig: [4, 4], keySig: -1, source: 'builtin',
    notes: fromPairs([
      [72, 1], [69, 1], [69, 2], [71, 1], [67, 1], [67, 2],
      [65, 1], [67, 1], [69, 1], [71, 1], [72, 1], [72, 1], [72, 2],
    ]),
  },

  // Sight-reading — a simple unfamiliar line (concert B♭).
  {
    id: 'sr_grade1_a', title: 'Sight-Reading — Grade 1', challengeType: 'sight_reading', grade: 1,
    bpm: 84, timeSig: [4, 4], keySig: -2, source: 'builtin',
    notes: fromPairs([
      [58, 1], [60, 1], [62, 2], [63, 1], [62, 1], [60, 2],
      [58, 1], [62, 1], [60, 1], [58, 1], [58, 4],
    ]),
  },

  // Rhythm performance — one pitch, varied durations (assessment scores onsets).
  {
    id: 'rhythm_grade1', title: 'Rhythm — Grade 1', challengeType: 'rhythm_performance', grade: 1,
    bpm: 80, timeSig: [4, 4], keySig: 0, source: 'builtin',
    notes: fromPairs([
      [67, 1], [67, 1], [67, 0.5], [67, 0.5], [67, 1],
      [67, 0.5], [67, 0.5], [67, 1], [67, 1], [67, 1],
    ]),
  },
];

export const EXCERPT_BY_ID: Record<string, Excerpt> = Object.fromEntries(EXCERPTS.map((e) => [e.id, e]));

/** All excerpts of a challenge type, optionally filtered by grade. */
export function excerptsFor(type: ExcerptChallengeType, grade?: number): Excerpt[] {
  return EXCERPTS.filter((e) => e.challengeType === type && (grade === undefined || e.grade === grade));
}

/** Pick a default excerpt for a challenge type (first, or first at/under a grade). */
export function defaultExcerpt(type: ExcerptChallengeType, grade?: number): Excerpt | undefined {
  const pool = EXCERPTS.filter((e) => e.challengeType === type);
  if (pool.length === 0) return undefined;
  if (grade !== undefined) {
    const atGrade = pool.filter((e) => (e.grade ?? 1) <= grade).sort((a, b) => (b.grade ?? 1) - (a.grade ?? 1));
    if (atGrade.length) return atGrade[0];
  }
  return pool[0];
}
