import { useState, useRef, useEffect, useCallback } from 'react';
import { Metronome, getAudioCtx } from './audio';
import type { SeatedExcerpt } from './transposition';
import { assessPerformance, assessTaps, type AssessmentResult, type PitchSample } from './assessment';

export interface PerformanceRunConfig {
  seated: SeatedExcerpt;
  bpm: number;
  beatsPerBar: number;
  totalBeats: number;
  noMic?: boolean;
  pitchToleranceCents: number;
  rhythmToleranceMs: number;
}

// Shared driver for a timed performance: a one-bar count-in metronome whose clock
// also positions the playhead, mic-sample (or tap) capture, and final assessment.
// Both the campaign challenge and the simulator practice use this.
export function usePerformanceRun(cfg: PerformanceRunConfig) {
  const { seated, bpm, beatsPerBar, totalBeats, noMic, pitchToleranceCents, rhythmToleranceMs } = cfg;

  const [phase, setPhase] = useState<'ready' | 'countin' | 'playing' | 'done'>('ready');
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [countLabel, setCountLabel] = useState(beatsPerBar);
  const [tapCount, setTapCount] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const samplesRef = useRef<PitchSample[]>([]);
  const tapsRef = useRef<number[]>([]);
  const metroRef = useRef<Metronome | null>(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);

  const finalize = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    metroRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    setPlayhead(null);
    const opts = { bpm, pitchToleranceCents, rhythmToleranceMs };
    setResult(noMic ? assessTaps(tapsRef.current, seated, opts) : assessPerformance(samplesRef.current, seated, opts));
    setPhase('done');
  }, [noMic, seated, bpm, pitchToleranceCents, rhythmToleranceMs]);

  const start = useCallback(async () => {
    doneRef.current = false;
    samplesRef.current = [];
    tapsRef.current = [];
    setTapCount(0);
    setResult(null);
    const ac = await getAudioCtx();
    const m = new Metronome(ac);
    metroRef.current = m;
    m.start({ bpm, beatsPerBar, countInBeats: beatsPerBar, totalBeats });
    setPhase('countin');
    const loop = () => {
      const b = m.beatsElapsed();
      if (b < -0.001) { setCountLabel(beatsPerBar + Math.floor(b) + 1); setPlayhead(null); }
      else if (b < totalBeats) { setPhase('playing'); setPlayhead(b); }
      else { finalize(); return; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [bpm, beatsPerBar, totalBeats, finalize]);

  const handlePitch = useCallback((freq: number, cents: number) => {
    const m = metroRef.current;
    if (doneRef.current || !m) return;
    const beat = m.beatsElapsed();
    if (beat < 0 || beat > totalBeats) return;
    samplesRef.current.push({ beat, freq, cents });
  }, [totalBeats]);

  const tap = useCallback(() => {
    const m = metroRef.current;
    if (doneRef.current || !m) return;
    const beat = m.beatsElapsed();
    if (beat < 0 || beat > totalBeats + 0.5) return;
    tapsRef.current.push(beat);
    setTapCount(tapsRef.current.length);
  }, [totalBeats]);

  const reset = useCallback(() => {
    metroRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    doneRef.current = false;
    setResult(null);
    setPlayhead(null);
    setPhase('ready');
  }, []);

  useEffect(() => {
    if (!noMic) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [noMic, tap]);

  useEffect(() => () => { metroRef.current?.stop(); cancelAnimationFrame(rafRef.current); }, []);

  return { phase, playhead, countLabel, tapCount, result, start, finalize, handlePitch, tap, reset };
}
