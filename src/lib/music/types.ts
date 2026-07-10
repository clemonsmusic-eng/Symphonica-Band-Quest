import type { InstrumentId } from '../../types/game';

// A single note or rest in an excerpt, stored in CONCERT pitch.
// Per-instrument transposition is applied at render/assess time.
export interface ScoreNote {
  midi: number | null;    // concert-pitch MIDI (60 = C4); null = rest
  startBeat: number;      // onset, in beats from the start of the excerpt
  durationBeats: number;  // duration in beats
}

export type ExcerptChallengeType =
  | 'technique_scale'
  | 'prepared_performance'
  | 'sight_reading'
  | 'rhythm_performance';

export type ExcerptSource = 'builtin' | 'musicxml' | 'midi' | 'pdf_assisted';

// A performable selection. Notes are CONCERT pitch; the display transposes them
// for the player's instrument, while assessment compares the mic's sounding
// (concert) pitch directly.
export interface Excerpt {
  id: string;
  title: string;
  composer?: string;
  challengeType: ExcerptChallengeType;
  grade?: number;              // UIL grade level (1–6)
  bpm: number;                 // default tempo
  timeSig: [number, number];   // e.g. [4, 4]
  keySig: number;              // concert key signature: +sharps / -flats
  notes: ScoreNote[];          // concert pitch, ordered by startBeat
  instruments?: InstrumentId[] | 'all';  // who this excerpt is for (default 'all')
  pdfRef?: string;             // optional reference-image/PDF data URL (Phase 4)
  source?: ExcerptSource;
}

/** Total length of an excerpt in beats (onset + duration of the last event). */
export function excerptBeats(ex: Excerpt): number {
  return ex.notes.reduce((max, n) => Math.max(max, n.startBeat + n.durationBeats), 0);
}
