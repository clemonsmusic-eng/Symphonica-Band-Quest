import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Character } from '../../types/game';
import type { Excerpt } from '../../lib/music/types';
import { seatExcerpt } from '../../lib/music/transposition';
import { freqToMidi } from '../../lib/music/staff';
import { Metronome, getAudioCtx, playNoteBlip } from '../../lib/music/audio';
import { rhythmToleranceMs } from '../../lib/instruments';
import {
  buildChart, hitWindows, judgeOffset, initialStats, applyJudgment, applyWrongNote,
  multiplierFor, sustainPoints, summarize, laneForKey, loadHighScore, saveHighScore,
  JUDGMENT_COLOR, JUDGMENT_LABEL, LANE_COLORS, LANE_KEY_LABELS, LANE_LETTERS,
  SURGE_BEATS, SURGE_READY,
} from '../../lib/music/noteRush';
import type {
  Difficulty, Judgment, NoteState, RushResult, RushStats,
} from '../../lib/music/noteRush';
import NoteRushStaff, { RUSH_SVG_H, strikeX } from './NoteRushStaff';
import MicrophoneListener from '../MicrophoneListener';

// Note Rush — the run itself. A count-in metronome drives one AudioContext clock;
// the staff scrolls off that clock, and every hit is judged against it, so what
// you see and what you hear can never drift apart.

export type InputMode = 'keys' | 'mic';

const SPEEDS = [
  { id: 'slow', label: 'Slow', pxPerBeat: 62 },
  { id: 'normal', label: 'Normal', pxPerBeat: 88 },
  { id: 'fast', label: 'Fast', pxPerBeat: 118 },
] as const;
export type SpeedId = (typeof SPEEDS)[number]['id'];

/** Minimum beats of runway visible ahead of the strike line on narrow screens. */
const MIN_LEAD_BEATS = 3.5;
/** Extra beats after the last release before the run ends. */
const OUTRO_BEATS = 1.5;
/** A mic gap this long counts as a fresh attack (see `handlePitch`). */
const MIC_ATTACK_GAP_MS = 70;

interface Props {
  excerpt: Excerpt;
  character: Character;
  difficulty: Difficulty;
  inputMode: InputMode;
  onFinish: (result: RushResult) => void;
  onExit: () => void;
}

interface Flash { id: number; judgment: Judgment; color: string }

export default function NoteRushGame({
  excerpt, character, difficulty, inputMode, onFinish, onExit,
}: Props) {
  const seated = useMemo(() => seatExcerpt(excerpt, character.instrument), [excerpt, character.instrument]);
  const chart = useMemo(() => buildChart(seated), [seated]);
  const bpm = Math.round(excerpt.bpm * difficulty.tempoMult);
  const msPerBeat = 60000 / bpm;
  const beatsPerBar = excerpt.timeSig[0];
  const windows = useMemo(
    () => hitWindows(rhythmToleranceMs(character.stats.technique), difficulty),
    [character.stats.technique, difficulty],
  );

  const [phase, setPhase] = useState<'ready' | 'countin' | 'playing' | 'done'>('ready');
  const [countLabel, setCountLabel] = useState(0);
  const [speed, setSpeed] = useState<SpeedId>('normal');
  const [showLetters, setShowLetters] = useState(false);
  const [clickOn, setClickOn] = useState(true);
  const [states, setStates] = useState<NoteState[]>(() => freshStates(chart.notes.length));
  const [hud, setHud] = useState({ score: 0, combo: 0, multiplier: 1, surge: 0, surgeActive: false });
  const [flash, setFlash] = useState<Flash | null>(null);
  const [litLanes, setLitLanes] = useState<boolean[]>(() => Array(7).fill(false));
  const [result, setResult] = useState<RushResult | null>(null);
  const [newBest, setNewBest] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<SVGGElement>(null);
  const metroRef = useRef<Metronome | null>(null);
  const rafRef = useRef(0);
  const tickRef = useRef<() => void>(() => {});
  const statesRef = useRef<NoteState[]>(states);
  const statsRef = useRef<RushStats>(initialStats());
  const phaseRef = useRef(phase);
  const heldLanesRef = useRef<Set<number>>(new Set());
  const sustainRef = useRef<{ index: number; lane: number } | null>(null);
  const surgeStartRef = useRef(0);
  const surgePctRef = useRef(-1);
  const micRef = useRef({ lastCallbackMs: 0, lastMidi: -1, attack: true });
  const flashIdRef = useRef(0);
  const finishedRef = useRef(false);

  const width = useContainerWidth(wrapRef, 720);
  const strike = strikeX(Math.abs(seated.writtenKeySig));
  const pxPerBeat = Math.max(
    28,
    Math.min(SPEEDS.find((s) => s.id === speed)!.pxPerBeat, (width - strike - 24) / MIN_LEAD_BEATS),
  );
  const leadBeats = (width - strike) / pxPerBeat;
  const runEndBeat = chart.endBeat + OUTRO_BEATS;
  const windowPx = (windows.good / msPerBeat) * pxPerBeat;

  const setScroll = useCallback((beat: number) => {
    scrollRef.current?.setAttribute('transform', `translate(${-beat * pxPerBeat} 0)`);
  }, [pxPerBeat]);

  // Park the chart just off the right edge until the run starts.
  useEffect(() => {
    if (phase === 'ready') setScroll(-leadBeats);
  }, [phase, leadBeats, setScroll]);

  const publish = useCallback(() => {
    const s = statsRef.current;
    setHud({
      score: s.score, combo: s.combo,
      multiplier: multiplierFor(s.combo, s.surgeActive),
      surge: Math.round(s.surge), surgeActive: s.surgeActive,
    });
  }, []);

  const commitStates = useCallback(() => setStates(statesRef.current.slice()), []);

  const showFlash = useCallback((judgment: Judgment) => {
    flashIdRef.current += 1;
    setFlash({ id: flashIdRef.current, judgment, color: JUDGMENT_COLOR[judgment] });
  }, []);

  // ── finishing ───────────────────────────────────────────────────────────────

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    metroRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    heldLanesRef.current.clear();
    sustainRef.current = null;
    const summary = summarize(statsRef.current, chart.notes.length);
    setResult(summary);
    setNewBest(saveHighScore(character.id, excerpt.id, difficulty.id, summary));
    setPhase('done');
    phaseRef.current = 'done';
    onFinish(summary);
  }, [chart.notes.length, character.id, excerpt.id, difficulty.id, onFinish]);

  // ── the loop: scroll, expire missed notes, score held tails, burn the surge ──

  const endSustain = useCallback((beat: number) => {
    const active = sustainRef.current;
    if (!active) return;
    sustainRef.current = null;
    const note = chart.notes[active.index];
    const held = Math.max(0, Math.min(note.sustainBeats, beat - note.beat));
    const s = statsRef.current;
    s.score += sustainPoints(held, s.combo, s.surgeActive, difficulty);
    statesRef.current[active.index] = {
      ...statesRef.current[active.index], sustainHeld: held, sustainDone: true,
    };
    commitStates();
    publish();
  }, [chart.notes, difficulty, commitStates, publish]);

  const tick = useCallback(() => {
    const m = metroRef.current;
    if (!m) return;
    const beat = m.beatsElapsed();
    setScroll(beat);

    if (beat < 0) {
      const label = Math.ceil(-beat);
      setCountLabel((prev) => (prev === label ? prev : label));
    } else if (phaseRef.current === 'countin') {
      phaseRef.current = 'playing';
      setPhase('playing');
    }

    // Notes whose window has closed are misses.
    const missBeats = windows.good / msPerBeat;
    let missed = false;
    for (let i = 0; i < chart.notes.length; i++) {
      if (statesRef.current[i].judgment) continue;
      if (beat > chart.notes[i].beat + missBeats) {
        statesRef.current[i] = { ...statesRef.current[i], judgment: 'miss' };
        applyJudgment(statsRef.current, 'miss', difficulty);
        missed = true;
      }
    }
    if (missed) { commitStates(); publish(); showFlash('miss'); }

    // Holds end when the tail runs out or the key comes up.
    const active = sustainRef.current;
    if (active) {
      const note = chart.notes[active.index];
      const released = inputMode === 'keys' && !heldLanesRef.current.has(active.lane);
      if (released || beat >= note.beat + note.sustainBeats) endSustain(beat);
    }

    // Surge drains over its lifetime, then switches off.
    const s = statsRef.current;
    if (s.surgeActive) {
      const left = Math.max(0, (s.surgeEndsAtBeat - beat) / SURGE_BEATS);
      s.surge = surgeStartRef.current * left;
      if (left <= 0) { s.surgeActive = false; s.surge = 0; }
      const pct = Math.round(s.surge);
      if (pct !== surgePctRef.current || !s.surgeActive) { surgePctRef.current = pct; publish(); }
    }

    if (beat >= runEndBeat) { finish(); return; }
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [chart.notes, difficulty, endSustain, finish, inputMode, msPerBeat, publish,
      runEndBeat, setScroll, showFlash, commitStates, windows.good]);
  tickRef.current = tick;

  // ── input ───────────────────────────────────────────────────────────────────

  /** Judge a lane press at the current beat. */
  const attemptHit = useCallback((lane: number) => {
    const m = metroRef.current;
    if (!m || phaseRef.current === 'done') return;
    const beat = m.beatsElapsed();

    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < chart.notes.length; i++) {
      const n = chart.notes[i];
      if (n.lane !== lane || statesRef.current[i].judgment) continue;
      const dist = Math.abs((beat - n.beat) * msPerBeat);
      if (dist <= windows.good && dist < bestDist) { best = i; bestDist = dist; }
    }

    if (best < 0) {
      applyWrongNote(statsRef.current, difficulty);
      publish();
      return;
    }

    const note = chart.notes[best];
    const offsetMs = (beat - note.beat) * msPerBeat;
    const judgment = judgeOffset(offsetMs, windows) ?? 'good';
    statesRef.current[best] = { judgment, offsetMs, sustainHeld: 0, sustainDone: false };
    applyJudgment(statsRef.current, judgment, difficulty);
    if (note.sustainBeats > 0) sustainRef.current = { index: best, lane };
    commitStates();
    publish();
    showFlash(judgment);
    // The mic would hear our own blip, so only sound it in key mode.
    if (inputMode === 'keys') void playNoteBlip(note.soundingMidi);
  }, [chart.notes, difficulty, inputMode, msPerBeat, publish, showFlash, commitStates, windows]);

  const activateSurge = useCallback(() => {
    const s = statsRef.current;
    const m = metroRef.current;
    if (!m || s.surgeActive || s.surge < SURGE_READY || phaseRef.current !== 'playing') return;
    s.surgeActive = true;
    s.surgeEndsAtBeat = m.beatsElapsed() + SURGE_BEATS;
    surgeStartRef.current = s.surge;
    publish();
  }, [publish]);

  const pressLane = useCallback((lane: number) => {
    if (heldLanesRef.current.has(lane)) return;
    heldLanesRef.current.add(lane);
    setLitLanes((prev) => { const next = prev.slice(); next[lane] = true; return next; });
    if (phaseRef.current === 'countin' || phaseRef.current === 'playing') attemptHit(lane);
  }, [attemptHit]);

  const releaseLane = useCallback((lane: number) => {
    heldLanesRef.current.delete(lane);
    setLitLanes((prev) => { const next = prev.slice(); next[lane] = false; return next; });
  }, []);

  useEffect(() => {
    if (inputMode !== 'keys') return;
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); activateSurge(); return; }
      const lane = laneForKey(e.code);
      if (lane >= 0) { e.preventDefault(); pressLane(lane); }
    };
    const up = (e: KeyboardEvent) => {
      const lane = laneForKey(e.code);
      if (lane >= 0) releaseLane(lane);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [inputMode, pressLane, releaseLane, activateSurge]);

  /**
   * Live-instrument input. The detector fires continuously while a tone sounds,
   * so a note only counts as struck when the pitch changed or the mic went quiet
   * for a moment first — otherwise one long tone would claim every repeat of it.
   */
  const handlePitch = useCallback((freq: number) => {
    const m = metroRef.current;
    if (!m || phaseRef.current === 'done') return;
    const now = performance.now();
    const midi = Math.round(freqToMidi(freq));
    const mic = micRef.current;
    if (now - mic.lastCallbackMs > MIC_ATTACK_GAP_MS) mic.attack = true;
    mic.lastCallbackMs = now;

    // Holding the written pitch sustains the tail.
    const active = sustainRef.current;
    if (active && chart.notes[active.index].soundingMidi === midi) { mic.lastMidi = midi; return; }

    if (!mic.attack && midi === mic.lastMidi) return;

    const beat = m.beatsElapsed();
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < chart.notes.length; i++) {
      const n = chart.notes[i];
      if (statesRef.current[i].judgment || n.soundingMidi !== midi) continue;
      const dist = Math.abs((beat - n.beat) * msPerBeat);
      if (dist <= windows.good && dist < bestDist) { best = i; bestDist = dist; }
    }
    if (best < 0) return;   // a wrong note played into the air costs nothing

    if (active) endSustain(beat);
    mic.attack = false;
    mic.lastMidi = midi;
    const note = chart.notes[best];
    const offsetMs = (beat - note.beat) * msPerBeat;
    const judgment = judgeOffset(offsetMs, windows) ?? 'good';
    statesRef.current[best] = { judgment, offsetMs, sustainHeld: 0, sustainDone: false };
    applyJudgment(statsRef.current, judgment, difficulty);
    if (note.sustainBeats > 0) sustainRef.current = { index: best, lane: note.lane };
    commitStates();
    publish();
    showFlash(judgment);
  }, [chart.notes, difficulty, endSustain, msPerBeat, publish, showFlash, commitStates, windows]);

  // MicrophoneListener re-opens the stream whenever its callback identity
  // changes, so hand it one that never does.
  const pitchCbRef = useRef(handlePitch);
  pitchCbRef.current = handlePitch;
  const stablePitchCb = useCallback((freq: number) => pitchCbRef.current(freq), []);

  // ── run control ─────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    const ac = await getAudioCtx();
    statesRef.current = freshStates(chart.notes.length);
    statsRef.current = initialStats();
    heldLanesRef.current.clear();
    sustainRef.current = null;
    micRef.current = { lastCallbackMs: 0, lastMidi: -1, attack: true };
    finishedRef.current = false;
    setStates(statesRef.current.slice());
    setResult(null);
    setNewBest(false);
    setFlash(null);
    publish();

    // Count in for whole bars, and for long enough that the first note enters
    // from the right edge exactly as the run begins.
    const countIn = Math.max(beatsPerBar, Math.ceil(leadBeats / beatsPerBar) * beatsPerBar);
    const m = new Metronome(ac);
    metroRef.current = m;
    m.start({ bpm, beatsPerBar, countInBeats: countIn, totalBeats: runEndBeat, silent: !clickOn });
    phaseRef.current = 'countin';
    setPhase('countin');
    setCountLabel(countIn);
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [beatsPerBar, bpm, chart.notes.length, clickOn, leadBeats, publish, runEndBeat]);

  const quit = useCallback(() => {
    metroRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    finishedRef.current = true;
    onExit();
  }, [onExit]);

  const retry = useCallback(() => {
    phaseRef.current = 'ready';
    setPhase('ready');
    statesRef.current = freshStates(chart.notes.length);
    setStates(statesRef.current.slice());
    statsRef.current = initialStats();
    publish();
  }, [chart.notes.length, publish]);

  useEffect(() => () => {
    metroRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
  }, []);

  const running = phase === 'countin' || phase === 'playing';
  // `phase` is in the deps so the stored best refreshes after a run saves one.
  const best = useMemo(() => loadHighScore(character.id, excerpt.id, difficulty.id),
    [character.id, excerpt.id, difficulty.id, phase]);

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="select-none">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h2 className="fantasy-title text-lg text-academy-cream truncate">{excerpt.title}</h2>
          <div className="text-academy-cream/40 text-xs">
            {difficulty.name} · ♩={bpm} · {excerpt.timeSig[0]}/{excerpt.timeSig[1]} ·{' '}
            {chart.notes.length} notes · ±{Math.round(windows.good)}ms window
          </div>
        </div>
        <button onClick={quit} className="text-academy-cream/40 hover:text-academy-cream/80 text-xs flex-shrink-0">
          ← Charts
        </button>
      </div>

      {/* HUD */}
      <div className="flex items-stretch gap-2 mb-2">
        <div className="card-panel flex-1 py-2 px-3">
          <div className="text-academy-cream/40 text-[9px] uppercase tracking-widest">Score</div>
          <div className="font-fantasy text-xl text-academy-gold tabular-nums">{hud.score.toLocaleString()}</div>
        </div>
        <div className="card-panel flex-1 py-2 px-3">
          <div className="text-academy-cream/40 text-[9px] uppercase tracking-widest">Streak</div>
          <div className="font-fantasy text-xl tabular-nums" style={{ color: hud.combo > 0 ? '#4ADE80' : '#8a8371' }}>
            {hud.combo}<span className="text-xs ml-1 opacity-70">×{hud.multiplier}</span>
          </div>
        </div>
        <button onClick={activateSurge} disabled={hud.surgeActive || hud.surge < SURGE_READY}
          className="card-panel flex-[1.4] py-2 px-3 text-left disabled:cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-academy-cream/40 text-[9px] uppercase tracking-widest">Resonance Surge</span>
            <span className="text-[9px] font-fantasy" style={{ color: hud.surgeActive ? '#FFF3C4' : hud.surge >= SURGE_READY ? '#FFD700' : '#8a8371' }}>
              {hud.surgeActive ? 'BURNING' : hud.surge >= SURGE_READY ? 'TAP / SPACE' : `${Math.round(hud.surge)}%`}
            </span>
          </div>
          <div className="stat-bar mt-1.5">
            <div className="stat-bar-fill" style={{
              width: `${hud.surge}%`,
              backgroundColor: hud.surgeActive ? '#FFF3C4' : hud.surge >= SURGE_READY ? '#FFD700' : '#C9A227',
            }} />
          </div>
        </button>
      </div>

      {/* the scrolling staff */}
      <div ref={wrapRef} className="relative rounded-lg overflow-hidden"
        style={{ border: `1px solid ${hud.surgeActive ? 'rgba(255,243,196,0.55)' : 'rgba(212,160,23,0.25)'}` }}>
        <NoteRushStaff
          chart={chart} clef={seated.clef} writtenKeySig={seated.writtenKeySig}
          timeSig={excerpt.timeSig} width={width} pxPerBeat={pxPerBeat} states={states}
          windowPx={windowPx} showLetters={showLetters} surgeActive={hud.surgeActive}
          scrollRef={scrollRef}
        />

        {flash && running && (
          <div key={flash.id} className="ff-floater absolute font-fantasy text-lg pointer-events-none"
            style={{ left: strike + 14, top: RUSH_SVG_H - 42, color: flash.color }}>
            {JUDGMENT_LABEL[flash.judgment]}
          </div>
        )}

        {phase === 'countin' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-academy-gold/70 text-[10px] uppercase tracking-widest font-fantasy">Count-in</div>
            <div className="font-fantasy text-5xl text-academy-gold">{countLabel}</div>
          </div>
        )}

        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(11,17,25,0.82)' }}>
            <button onClick={start} className="btn-primary text-base px-8">▶ Start</button>
            <div className="text-academy-cream/45 text-[11px] text-center px-6 leading-relaxed">
              {inputMode === 'keys'
                ? 'Press the letter each note sits on as it crosses the gold line.'
                : 'Play each note on your instrument as it crosses the gold line.'}
              {best && <> · Best <span className="text-academy-gold">{best.score.toLocaleString()}</span></>}
            </div>
          </div>
        )}

        {phase === 'done' && result && (
          <ResultOverlay result={result} newBest={newBest} onRetry={retry} onExit={onExit} />
        )}
      </div>

      {/* lanes */}
      <div className="grid grid-cols-7 gap-1.5 mt-2">
        {LANE_LETTERS.map((letter, lane) => (
          <button
            key={letter}
            onPointerDown={(e) => { e.preventDefault(); pressLane(lane); }}
            onPointerUp={() => releaseLane(lane)}
            onPointerLeave={() => releaseLane(lane)}
            onPointerCancel={() => releaseLane(lane)}
            disabled={inputMode === 'mic'}
            className="rounded-lg py-2.5 text-center transition-all duration-75 disabled:opacity-40 touch-none"
            style={{
              border: `2px solid ${LANE_COLORS[lane]}`,
              background: litLanes[lane] ? LANE_COLORS[lane] : `${LANE_COLORS[lane]}1f`,
              transform: litLanes[lane] ? 'translateY(2px)' : 'none',
            }}
          >
            <div className="font-fantasy text-base leading-none"
              style={{ color: litLanes[lane] ? '#0b1119' : LANE_COLORS[lane] }}>{letter}</div>
            <div className="text-[9px] mt-0.5 font-mono"
              style={{ color: litLanes[lane] ? '#0b1119' : 'rgba(245,236,215,0.35)' }}>
              {LANE_KEY_LABELS[lane]}
            </div>
          </button>
        ))}
      </div>

      {inputMode === 'mic' && running && (
        <div className="mt-3">
          <MicrophoneListener mode="pitch" onPitchDetected={stablePitchCb} active />
        </div>
      )}

      {/* run options */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[11px] text-academy-cream/50">
        <div className="flex items-center gap-1">
          <span className="uppercase tracking-widest text-[9px] text-academy-cream/35">Scroll</span>
          {SPEEDS.map((s) => (
            <button key={s.id} onClick={() => setSpeed(s.id)} disabled={running}
              className={`px-2 py-0.5 rounded ${speed === s.id ? 'text-academy-gold bg-academy-gold/10' : 'hover:text-academy-cream/80'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showLetters} onChange={(e) => setShowLetters(e.target.checked)} />
          Note letters
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={clickOn} disabled={running}
            onChange={(e) => setClickOn(e.target.checked)} />
          Metronome
        </label>
        {running && (
          <button onClick={finish} className="ml-auto text-academy-cream/40 hover:text-academy-cream/80">
            End run
          </button>
        )}
      </div>
    </div>
  );
}

function freshStates(count: number): NoteState[] {
  return Array.from({ length: count }, () => ({
    judgment: null, offsetMs: 0, sustainHeld: 0, sustainDone: false,
  }));
}

/** Track a container's pixel width so the staff can lay itself out to fit. */
function useContainerWidth(ref: React.RefObject<HTMLElement>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(320, Math.round(el.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

const RATING_COLORS: Record<RushResult['rating'], string> = {
  superior: '#FFD700', excellent: '#4ADE80', good: '#60A5FA', fair: '#FB923C', poor: '#F87171',
};

function ResultOverlay({ result, newBest, onRetry, onExit }: {
  result: RushResult; newBest: boolean; onRetry: () => void; onExit: () => void;
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto px-4 py-3 flex flex-col items-center justify-center text-center"
      style={{ background: 'rgba(11,17,25,0.94)', minHeight: RUSH_SVG_H }}>
      {result.fullCombo && (
        <div className="font-fantasy text-xs tracking-[0.3em] text-rating-superior mb-0.5">FULL COMBO</div>
      )}
      <div className="font-fantasy text-2xl uppercase" style={{ color: RATING_COLORS[result.rating] }}>
        {result.rating}
      </div>
      <div className="font-fantasy text-3xl text-academy-gold tabular-nums leading-tight">
        {result.score.toLocaleString()}
      </div>
      <div className="text-academy-cream/50 text-xs mb-2">
        {result.accuracyPct}% accuracy · {result.notesHit}/{result.totalNotes} notes · streak {result.maxCombo}
        {newBest && <span className="text-academy-gold"> · NEW BEST</span>}
      </div>
      <div className="flex items-center justify-center gap-3 text-[11px] mb-3">
        {(['perfect', 'great', 'good', 'miss'] as const).map((j) => (
          <span key={j} style={{ color: JUDGMENT_COLOR[j] }}>
            {JUDGMENT_LABEL[j]} <b className="tabular-nums">{result.counts[j]}</b>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onRetry} className="btn-primary text-sm py-2">Play Again</button>
        <button onClick={onExit} className="btn-secondary text-sm py-2">Charts</button>
      </div>
    </div>
  );
}
