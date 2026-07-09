// Shared staff geometry + pitch helpers, used by both the theory diagrams
// (MusicDiagram) and the performance sheet-music view (PerformanceStaff).
// Pure functions only — pixel layout constants live in the components.

// Diatonic index: C=0, D=1, E=2, F=3, G=4, A=5, B=6
export const NOTE_DIATONIC: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

// Treble clef: E4 = step 0 (bottom line) → diatonic index of E4 = 4*7+2 = 30
export const TREBLE_BASE = 4 * 7 + 2;
// Bass clef: G2 = step 0 (bottom line) → diatonic index of G2 = 2*7+4 = 18
export const BASS_BASE = 2 * 7 + 4;

export type Clef = 'treble' | 'bass';

/** Convert a pitch string like "C4", "F#5", "Bb3" to { letter, accidental, octave }. */
export function parsePitch(pitch: string): { letter: string; accidental: '' | '#' | 'b'; octave: number } {
  const m = pitch.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!m) return { letter: 'C', accidental: '', octave: 4 };
  return { letter: m[1].toUpperCase(), accidental: m[2] as '' | '#' | 'b', octave: parseInt(m[3], 10) };
}

/** Diatonic staff step for a pitch (0 = bottom line), given a clef. */
export function pitchToStep(pitch: string, clef: Clef): number {
  const { letter, octave } = parsePitch(pitch);
  const diatonicIndex = octave * 7 + (NOTE_DIATONIC[letter] ?? 0);
  return diatonicIndex - (clef === 'treble' ? TREBLE_BASE : BASS_BASE);
}

// ── MIDI ↔ pitch ──────────────────────────────────────────────────────────────
// MIDI 60 = C4 (middle C). midi = (octave + 1) * 12 + pitchClass.

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

/** Which letters the key signature alters, and by how much (+1 sharp / -1 flat). */
function keyAlterations(fifths: number): Record<string, number> {
  const alt: Record<string, number> = {};
  if (fifths > 0) for (let i = 0; i < Math.min(7, fifths); i++) alt[SHARP_ORDER[i]] = 1;
  else if (fifths < 0) for (let i = 0; i < Math.min(7, -fifths); i++) alt[FLAT_ORDER[i]] = -1;
  return alt;
}

export interface SpelledNote {
  /** pitch string with letter+octave only (no accidental char) */
  pitch: string;
  /** explicit accidental to draw, or null when the key signature covers it */
  forceAcc: 'sharp' | 'flat' | 'natural' | null;
}

/**
 * Spell a MIDI pitch within a key signature (`fifths`: +sharps / -flats).
 * Diatonic notes draw no accidental (the key signature covers them); chromatic
 * notes get an explicit accidental (natural when the key would otherwise alter
 * that letter). Chooses sharp spelling in sharp keys, flat in flat keys.
 */
export function spellMidiInKey(midi: number, fifths: number): SpelledNote {
  const pc = ((midi % 12) + 12) % 12;
  const alt = keyAlterations(fifths);
  const preferFlat = fifths < 0;

  // 1) Diatonic: a letter whose key-adjusted pitch class equals pc → no accidental.
  for (const letter of Object.keys(LETTER_PC)) {
    const adj = (LETTER_PC[letter] + (alt[letter] ?? 0) + 12) % 12;
    if (adj === pc) {
      return { pitch: `${letter}${octaveFor(midi, letter, alt[letter] ?? 0)}`, forceAcc: null };
    }
  }

  // 2) Chromatic: a natural letter (pc) that the key would otherwise alter → natural.
  for (const letter of Object.keys(LETTER_PC)) {
    if (LETTER_PC[letter] === pc && (alt[letter] ?? 0) !== 0) {
      return { pitch: `${letter}${octaveFor(midi, letter, 0)}`, forceAcc: 'natural' };
    }
  }

  // 3) Chromatic alteration of a neighbouring letter (sharp/flat preference by key).
  if (preferFlat) {
    for (const letter of Object.keys(LETTER_PC)) {
      if (((LETTER_PC[letter] - 1 + 12) % 12) === pc) {
        return { pitch: `${letter}${octaveFor(midi, letter, -1)}`, forceAcc: 'flat' };
      }
    }
  }
  for (const letter of Object.keys(LETTER_PC)) {
    if (((LETTER_PC[letter] + 1) % 12) === pc) {
      return { pitch: `${letter}${octaveFor(midi, letter, 1)}`, forceAcc: 'sharp' };
    }
  }
  // Fallback (shouldn't happen): plain natural letter at this pc.
  const letter = Object.keys(LETTER_PC).find((l) => LETTER_PC[l] === pc) ?? 'C';
  return { pitch: `${letter}${octaveFor(midi, letter, 0)}`, forceAcc: null };
}

/** Octave digit so that letter+alter sits at the given MIDI. */
function octaveFor(midi: number, letter: string, alter: number): number {
  const sounding = LETTER_PC[letter] + alter; // pitch class of this spelling (may be <0 or >11)
  // midi = (octave + 1) * 12 + sounding  →  octave = midi/12 - 1 - sounding/12
  return Math.round((midi - sounding) / 12) - 1;
}

/** Simple sharp-spelling of a MIDI note (used for readouts, not notation). */
export function midiToPitchString(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pc]}${octave}`;
}

/** Frequency (Hz, A4=440) for a MIDI note. */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Nearest MIDI note (float) for a frequency. */
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}
