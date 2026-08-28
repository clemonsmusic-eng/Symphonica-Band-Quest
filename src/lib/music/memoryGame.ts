// The Echo Chamber — a Simon-style call-and-response memory game played on a
// real staff. Instead of four coloured buttons, the "pads" are noteheads at
// diatonic positions on the player's own clef, transposed into their written
// key, so repeating a phrase means reading and remembering actual notation.
//
// Pure logic only: pad layout, sequence generation, scoring, and the personal-
// best record. Rendering lives in components/music/MemoryStaff.tsx and the game
// loop in pages/EchoChamberPage.tsx.
import type { InstrumentId, Rating } from '../../types/game';
import { RATING_XP_MULTIPLIERS } from '../../types/game';
import { INSTRUMENT_TUNING } from './transposition';
import { spellMidiInKey, pitchToStep, pitchStringToMidi, type Clef, type SpelledNote } from './staff';

// ── Concert keys ──────────────────────────────────────────────────────────────
// The standard concert-band keys. `fifths` is the concert key signature
// (negative = flats); `tonicPc` is the tonic's pitch class (C = 0).

export interface ConcertKeyDef {
  id: ConcertKeyId;
  label: string;
  fifths: number;
  tonicPc: number;
}

export type ConcertKeyId = 'bb' | 'eb' | 'f' | 'c';

export const CONCERT_KEYS: ConcertKeyDef[] = [
  { id: 'bb', label: 'B♭', fifths: -2, tonicPc: 10 },
  { id: 'eb', label: 'E♭', fifths: -3, tonicPc: 3 },
  { id: 'f',  label: 'F',  fifths: -1, tonicPc: 5 },
  { id: 'c',  label: 'C',  fifths: 0,  tonicPc: 0 },
];

export function concertKey(id: ConcertKeyId): ConcertKeyDef {
  return CONCERT_KEYS.find((k) => k.id === id) ?? CONCERT_KEYS[0];
}

// ── Difficulty ────────────────────────────────────────────────────────────────

export type MemoryDifficulty = 'apprentice' | 'journeyman' | 'virtuoso' | 'maestro';

export interface DifficultyDef {
  id: MemoryDifficulty;
  name: string;
  padCount: number;     // how many staff pads are in play
  noteMs: number;       // how long each echoed note sounds/lights
  gapMs: number;        // silence between echoed notes
  showNames: boolean;   // print letter names under the pads
  retries: number;      // wrong answers forgiven before the run ends
  xpMultiplier: number; // applied on top of the aural-challenge base XP
  blurb: string;
}

export const DIFFICULTIES: Record<MemoryDifficulty, DifficultyDef> = {
  apprentice: {
    id: 'apprentice', name: 'Apprentice', padCount: 4, noteMs: 620, gapMs: 190,
    showNames: true, retries: 3, xpMultiplier: 0.6,
    blurb: 'Four notes, named, at a walking pace.',
  },
  journeyman: {
    id: 'journeyman', name: 'Journeyman', padCount: 5, noteMs: 520, gapMs: 150,
    showNames: true, retries: 2, xpMultiplier: 1.0,
    blurb: 'A five-note pentachord — still named.',
  },
  virtuoso: {
    id: 'virtuoso', name: 'Virtuoso', padCount: 6, noteMs: 420, gapMs: 110,
    showNames: false, retries: 1, xpMultiplier: 1.6,
    blurb: 'Six notes, no names. Read the staff.',
  },
  maestro: {
    id: 'maestro', name: 'Maestro', padCount: 8, noteMs: 320, gapMs: 80,
    showNames: false, retries: 0, xpMultiplier: 2.4,
    blurb: 'A full octave, unnamed, and no second chances.',
  },
};

export const DIFFICULTY_ORDER: MemoryDifficulty[] = ['apprentice', 'journeyman', 'virtuoso', 'maestro'];

// ── Pads ──────────────────────────────────────────────────────────────────────

/** One playable position on the staff. */
export interface Pad {
  id: number;          // 0-based, left to right
  degree: number;      // scale degree, 1-based (wraps past the octave)
  concertMidi: number; // pitch that actually sounds
  writtenMidi: number; // pitch as drawn on the player's staff
  spelled: SpelledNote;
  step: number;        // staff step; 0 = bottom line, +1 per half-space upward
  name: string;        // written letter name with accidental, e.g. "B♭"
}

export interface PadSet {
  pads: Pad[];
  clef: Clef;
  writtenKeySig: number;
  /** Concert pitch of the tonic pad — the root for the game's audio cues. */
  tonicMidi: number;
}

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Lay out `count` ascending major-scale degrees for an instrument in a concert
 * key. The set is transposed into the instrument's written part and octave-
 * shifted so it straddles the middle of the staff, keeping ledger lines rare.
 */
export function buildPads(inst: InstrumentId, keyId: ConcertKeyId, count: number): PadSet {
  const key = concertKey(keyId);
  const tuning = INSTRUMENT_TUNING[inst];
  const writtenKeySig = key.fifths + tuning.fifths;

  // Scale degrees from an arbitrary low octave; the shift below places them.
  const raw = Array.from({ length: count }, (_, i) =>
    48 + key.tonicPc + 12 * Math.floor(i / 7) + MAJOR_STEPS[i % 7]);

  // Centre the written set on the middle line (treble B4 = 71, bass D3 = 50).
  const target = tuning.clef === 'treble' ? 71 : 50;
  const lo = raw[0] + tuning.transpose;
  const hi = raw[raw.length - 1] + tuning.transpose;
  const shift = Math.round((target - (lo + hi) / 2) / 12) * 12;

  const pads: Pad[] = raw.map((concert, i) => {
    const concertMidi = concert + shift;
    const writtenMidi = concertMidi + tuning.transpose;
    const spelled = spellMidiInKey(writtenMidi, writtenKeySig);
    return {
      id: i,
      degree: (i % 7) + 1,
      concertMidi,
      writtenMidi,
      spelled,
      step: pitchToStep(spelled.pitch, tuning.clef),
      name: writtenName(writtenMidi, spelled),
    };
  });

  return { pads, clef: tuning.clef, writtenKeySig, tonicMidi: pads[0].concertMidi };
}

/**
 * The letter name a player would say for a written note, including any
 * alteration the key signature applies (which the staff draws only once, at the
 * clef, so `spelled.forceAcc` is null for those).
 */
function writtenName(writtenMidi: number, spelled: SpelledNote): string {
  const letter = spelled.pitch[0];
  const naturalPc = ((pitchStringToMidi(`${letter}4`) ?? 60) % 12 + 12) % 12;
  const pc = ((writtenMidi % 12) + 12) % 12;
  let alter = pc - naturalPc;
  if (alter > 6) alter -= 12;
  if (alter < -6) alter += 12;
  const acc = alter === 1 ? '♯' : alter === -1 ? '♭' : alter === 2 ? '𝄪' : alter === -2 ? '𝄫' : '';
  return letter + acc;
}

// ── Sequence ──────────────────────────────────────────────────────────────────

/**
 * Append one random pad to the phrase. A pad may repeat, but never three times
 * running — that reads as a single long flash rather than three notes.
 */
export function extendSequence(seq: number[], padCount: number): number[] {
  let next = Math.floor(Math.random() * padCount);
  const n = seq.length;
  if (padCount > 1 && n >= 2 && seq[n - 1] === seq[n - 2] && seq[n - 1] === next) {
    next = (next + 1 + Math.floor(Math.random() * (padCount - 1))) % padCount;
  }
  return [...seq, next];
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Rating for a run, from the longest phrase echoed back correctly. */
export function ratingForPhrase(len: number): Rating {
  if (len >= 12) return 'superior';
  if (len >= 9) return 'excellent';
  if (len >= 6) return 'good';
  if (len >= 3) return 'fair';
  return 'poor';
}

/** 0–100 score for the challenge record; 14 notes is a full marks phrase. */
export function scoreForPhrase(len: number): number {
  return Math.max(0, Math.min(100, Math.round((len / 14) * 100)));
}

// Mirrors BASE_XP.aural in src/store/gameStore.ts — kept in step so the results
// screen can name the XP the store is about to award.
export const ECHO_BASE_XP = 75;

/** XP `awardChallenge` will grant for this run, for display on the results card. */
export function estimateXp(rating: Rating, xpMultiplier: number): number {
  return Math.round(ECHO_BASE_XP * RATING_XP_MULTIPLIERS[rating] * xpMultiplier);
}

// ── Personal best ─────────────────────────────────────────────────────────────

const BEST_KEY = 'bq_echo_best';

/** Longest phrase per difficulty, from localStorage. */
export function loadBests(): Partial<Record<MemoryDifficulty, number>> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<MemoryDifficulty, number>>) : {};
  } catch {
    return {};
  }
}

/** Record a run; returns true when it beat the stored best. */
export function saveBest(difficulty: MemoryDifficulty, len: number): boolean {
  const bests = loadBests();
  if (len <= (bests[difficulty] ?? 0)) return false;
  bests[difficulty] = len;
  try { localStorage.setItem(BEST_KEY, JSON.stringify(bests)); } catch { /* ignore */ }
  return true;
}
