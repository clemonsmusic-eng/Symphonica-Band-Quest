import type { InstrumentId } from '../../types/game';
import type { Excerpt, ScoreNote } from './types';
import { spellMidiInKey, pitchToStep, type Clef, type SpelledNote } from './staff';
import type { Duration } from '../../types/diagrams';

// Per-instrument transposition + clef.
//   transpose  = written − concert, in semitones (what the player reads is this
//                many semitones above the sounding/concert pitch).
//   fifths     = key-signature shift on the circle of fifths (Bb +2, Eb +3, F +1).
//   clef       = the clef the instrument reads.
export interface InstrumentTuning {
  transpose: number;
  fifths: number;
  clef: Clef;
}

export const INSTRUMENT_TUNING: Record<InstrumentId, InstrumentTuning> = {
  flute:       { transpose: 0,  fifths: 0, clef: 'treble' },
  oboe:        { transpose: 0,  fifths: 0, clef: 'treble' },
  clarinet:    { transpose: 2,  fifths: 2, clef: 'treble' }, // Bb
  alto_sax:    { transpose: 9,  fifths: 3, clef: 'treble' }, // Eb
  trumpet:     { transpose: 2,  fifths: 2, clef: 'treble' }, // Bb
  french_horn: { transpose: 7,  fifths: 1, clef: 'treble' }, // F
  trombone:    { transpose: 0,  fifths: 0, clef: 'bass'   },
  euphonium:   { transpose: 0,  fifths: 0, clef: 'bass'   }, // BC euphonium
  tuba:        { transpose: 0,  fifths: 0, clef: 'bass'   },
  bassoon:     { transpose: 0,  fifths: 0, clef: 'bass'   },
  percussion:  { transpose: 0,  fifths: 0, clef: 'treble' },
};

/** The written key signature (sharps+/flats−) an instrument reads for a concert key. */
export function writtenKeySig(concertKeySig: number, inst: InstrumentId): number {
  return concertKeySig + INSTRUMENT_TUNING[inst].fifths;
}

// A note ready to draw + assess: its written spelling (for the staff) and the
// sounding (concert) MIDI the mic should hear.
export interface SeatedNote {
  index: number;            // index into the excerpt's note list
  rest: boolean;
  soundingMidi: number | null; // concert pitch to assess against (null = rest)
  writtenMidi: number | null;
  spelled: SpelledNote | null;  // written spelling for the staff
  dur: Duration;
  startBeat: number;
  durationBeats: number;
}

export interface SeatedExcerpt {
  clef: Clef;
  writtenKeySig: number;
  notes: SeatedNote[];
}

// Map a beat duration to the nearest drawable notehead duration.
function durationToGlyph(beats: number): Duration {
  if (beats >= 3.5) return 'w';
  if (beats >= 1.5) return 'h';
  if (beats >= 0.75) return 'q';
  return 'e';
}

/**
 * Seat an excerpt for a specific instrument: transpose to the written part,
 * pick an octave that centres the part on the instrument's staff, spell each
 * note in the written key, and record the sounding (concert) MIDI for scoring.
 */
export function seatExcerpt(ex: Excerpt, inst: InstrumentId): SeatedExcerpt {
  const tuning = INSTRUMENT_TUNING[inst];
  const wKey = writtenKeySig(ex.keySig, inst);

  // Written MIDI before octave-centring: concert + transpose (semitone part only).
  const pitched = ex.notes.filter((n) => n.midi !== null) as (ScoreNote & { midi: number })[];
  const rawWritten = pitched.map((n) => n.midi + tuning.transpose);

  // Choose an octave shift (in octaves) that puts the median written note near
  // the middle of the staff (step 4 = middle line), minimising ledger lines.
  let octaveShift = 0;
  if (rawWritten.length > 0) {
    const median = [...rawWritten].sort((a, b) => a - b)[Math.floor(rawWritten.length / 2)];
    // Middle-line target MIDI per clef: treble B4 = 71, bass D3 = 50.
    const target = tuning.clef === 'treble' ? 71 : 50;
    octaveShift = Math.round((target - median) / 12);
  }
  const shift = octaveShift * 12;

  const notes: SeatedNote[] = ex.notes.map((n, index) => {
    if (n.midi === null) {
      return {
        index, rest: true, soundingMidi: null, writtenMidi: null, spelled: null,
        dur: durationToGlyph(n.durationBeats), startBeat: n.startBeat, durationBeats: n.durationBeats,
      };
    }
    const soundingMidi = n.midi + shift;                 // concert pitch actually sounded
    const writtenMidi = soundingMidi + tuning.transpose; // what appears on the staff
    return {
      index, rest: false, soundingMidi, writtenMidi,
      spelled: spellMidiInKey(writtenMidi, wKey),
      dur: durationToGlyph(n.durationBeats), startBeat: n.startBeat, durationBeats: n.durationBeats,
    };
  });

  return { clef: tuning.clef, writtenKeySig: wKey, notes };
}

/** Staff step for a seated note (for laying it out vertically). */
export function seatedStep(note: SeatedNote, clef: Clef): number {
  if (!note.spelled) return 4; // rests sit mid-staff
  return pitchToStep(note.spelled.pitch, clef);
}
