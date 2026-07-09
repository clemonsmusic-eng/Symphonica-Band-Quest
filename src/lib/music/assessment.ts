import { freqToMidi } from './staff';
import type { SeatedExcerpt } from './transposition';
import { accuracyColor } from './accuracyColor';
import type { Rating } from '../../types/game';

export interface PitchSample { beat: number; freq: number; cents?: number }

export interface NoteResult {
  index: number;
  pitch: number | null; // 0–100, null in tap mode
  rhythm: number;       // 0–100
  accuracy: number;     // 0–1 combined (drives the overlay colour)
  color: string;
}

export interface AssessmentResult {
  pitchPct: number | null;
  rhythmPct: number;
  overallPct: number;
  rating: Rating;
  notes: NoteResult[];
}

export interface AssessOpts { bpm: number; pitchToleranceCents: number; rhythmToleranceMs: number }

function ratingFor(pct: number): Rating {
  if (pct >= 90) return 'superior';
  if (pct >= 75) return 'excellent';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'fair';
  return 'poor';
}

// Semitone error with octave mistakes ignored (±6 semitones).
function octaveReduced(semitoneErr: number): number {
  return semitoneErr - 12 * Math.round(semitoneErr / 12);
}

function pitchScore(absCents: number, tolCents: number): number {
  if (absCents <= tolCents) return 100 - (absCents / tolCents) * 8;               // 100 → 92
  if (absCents <= 50) return 92 - ((absCents - tolCents) / (50 - tolCents)) * 22;  // 92 → 70
  if (absCents <= 150) return 70 - ((absCents - 50) / 100) * 45;                   // 70 → 25 (approaching wrong note)
  return Math.max(0, 25 - (absCents - 150) / 12);                                  // 25 → 0
}

function rhythmScore(absBeats: number, tolBeats: number): number {
  if (absBeats <= tolBeats) return 100 - (absBeats / Math.max(0.0001, tolBeats)) * 10; // 100 → 90
  return Math.max(0, 90 - ((absBeats - tolBeats) / 0.5) * 90);                          // 0 at ~½ beat past tolerance
}

function avg(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }

/** Full mic assessment: per-note pitch + rhythm, aggregate %s, overlay colours. */
export function assessPerformance(samples: PitchSample[], seated: SeatedExcerpt, opts: AssessOpts): AssessmentResult {
  const tolBeats = (opts.rhythmToleranceMs / 1000) * (opts.bpm / 60);
  const pitched = seated.notes.filter((n) => !n.rest);
  const sorted = [...samples].sort((a, b) => a.beat - b.beat);

  // Detect note onsets: a new segment starts on a time gap (re-articulation /
  // silence, ~75ms) or a pitch change (a new note). Sample-to-sample vibrato
  // stays well under the pitch threshold; legato repeated notes rely on the gap.
  const onsets: number[] = [];
  let prevBeat = -Infinity, prevMidi = -Infinity;
  for (const s of sorted) {
    const m = freqToMidi(s.freq);
    if (s.beat - prevBeat > 0.12 || Math.abs(octaveReduced(m - prevMidi)) > 0.6) onsets.push(s.beat);
    prevBeat = s.beat; prevMidi = m;
  }

  const usedOnset = new Set<number>();
  // Nearest unused onset to `start` within a tight window (prevents a missing
  // onset from cascading every later note onto the wrong attack).
  const matchWindow = Math.max(0.4, tolBeats * 3);
  function matchOnset(start: number): number | null {
    let best = Infinity, bestI = -1;
    for (let i = 0; i < onsets.length; i++) {
      if (usedOnset.has(i)) continue;
      const d = Math.abs(onsets[i] - start);
      if (d < best) { best = d; bestI = i; }
    }
    if (bestI >= 0 && best <= matchWindow) { usedOnset.add(bestI); return best; }
    return null;
  }

  const notes: NoteResult[] = [];
  for (const n of pitched) {
    const end = n.startBeat + n.durationBeats;
    // pitch: median octave-reduced error over samples inside the note window
    let pScore = 0;
    if (n.soundingMidi !== null) {
      const errs = sorted
        .filter((s) => s.beat >= n.startBeat - 0.08 && s.beat < end - 0.02)
        .map((s) => Math.abs(octaveReduced(freqToMidi(s.freq) - n.soundingMidi!)) * 100)
        .sort((a, b) => a - b);
      pScore = errs.length ? pitchScore(errs[Math.floor(errs.length / 2)], opts.pitchToleranceCents) : 0;
    }
    // rhythm: matched attack timing; else fall back to sustained-pitch presence
    // (legato repeated notes have no detectable attack, so don't fault timing).
    const err = matchOnset(n.startBeat);
    let rScore: number;
    if (err !== null) {
      rScore = rhythmScore(err, tolBeats);
    } else {
      const present = n.soundingMidi !== null && sorted.some(
        (s) => s.beat >= n.startBeat - 0.1 && s.beat <= n.startBeat + 0.3 &&
          Math.abs(octaveReduced(freqToMidi(s.freq) - n.soundingMidi!)) <= 1.0,
      );
      rScore = present ? 80 : 0;
    }

    const accuracy = (pScore * 0.6 + rScore * 0.4) / 100;
    notes.push({ index: n.index, pitch: pScore, rhythm: rScore, accuracy, color: accuracyColor(accuracy) });
  }

  const pitchPct = Math.round(avg(notes.map((r) => r.pitch ?? 0)));
  const rhythmPct = Math.round(avg(notes.map((r) => r.rhythm)));
  const overallPct = Math.round(pitchPct * 0.6 + rhythmPct * 0.4);
  return { pitchPct, rhythmPct, overallPct, rating: ratingFor(overallPct), notes };
}

/** Rhythm-only assessment from tap onsets (Demo / no-mic mode). */
export function assessTaps(taps: number[], seated: SeatedExcerpt, opts: AssessOpts): AssessmentResult {
  const tolBeats = (opts.rhythmToleranceMs / 1000) * (opts.bpm / 60);
  const pitched = seated.notes.filter((n) => !n.rest);
  const used = new Set<number>();
  const notes: NoteResult[] = [];
  for (const n of pitched) {
    let best = Infinity, bestI = -1;
    for (let i = 0; i < taps.length; i++) {
      if (used.has(i)) continue;
      const d = Math.abs(taps[i] - n.startBeat);
      if (d < best) { best = d; bestI = i; }
    }
    let r = 0;
    if (bestI >= 0 && best <= 1.0) { used.add(bestI); r = rhythmScore(best, tolBeats); }
    notes.push({ index: n.index, pitch: null, rhythm: r, accuracy: r / 100, color: accuracyColor(r / 100) });
  }
  const rhythmPct = Math.round(avg(notes.map((r) => r.rhythm)));
  return { pitchPct: null, rhythmPct, overallPct: rhythmPct, rating: ratingFor(rhythmPct), notes };
}

/** Build a per-note-index colour array for PerformanceStaff.noteColors. */
export function overlayColors(result: AssessmentResult): (string | null)[] {
  const arr: (string | null)[] = [];
  for (const n of result.notes) arr[n.index] = n.color;
  return arr;
}
