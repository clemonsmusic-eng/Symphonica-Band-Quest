import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Character, Rating } from '../types/game';
import { pitchToleranceCents, rhythmToleranceMs } from '../lib/instruments';
import { useUiStore } from '../store/uiStore';
import MicrophoneListener from './MicrophoneListener';
import PerformanceStaff from './music/PerformanceStaff';
import { seatExcerpt } from '../lib/music/transposition';
import { excerptBeats, type Excerpt } from '../lib/music/types';
import { defaultExcerpt, EXCERPTS } from '../lib/music/excerpts';
import { Metronome, getAudioCtx } from '../lib/music/audio';
import { assessPerformance, assessTaps, overlayColors, type AssessmentResult, type PitchSample } from '../lib/music/assessment';
import { accuracyColor } from '../lib/music/accuracyColor';

// Resolve a stable excerpt for a challenge (same challenge → same piece).
function pickExcerpt(challenge: Challenge): Excerpt | undefined {
  const type = challenge.type as Excerpt['challengeType'];
  const pool = EXCERPTS.filter((e) => e.challengeType === type);
  if (pool.length === 0) return defaultExcerpt('technique_scale');
  let h = 0;
  for (let i = 0; i < challenge.id.length; i++) h = (h * 31 + challenge.id.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

interface Challenge {
  id: string;
  title: string;
  type: string;
  description: string;
  xpBase: number;
  beatCount?: number;  // battle performance: how many beats to perform
  bpm?: number;        // battle performance: tempo
}

interface ChallengeFlags {
  blind?: boolean;    // blurs the notation display
  manic?: boolean;    // scrolls the notation faster; pitch window already narrowed via pitchToleranceOverride
  confused?: boolean; // overlays wrong notes/rests in discordant colours
}

interface Props {
  challenge: Challenge;
  character: Character;
  onComplete: (rating: Rating, score: number) => void;
  onClose: () => void;
  pitchToleranceOverride?: number;  // override from battle debuffs
  challengeFlags?: ChallengeFlags;
}

export default function ChallengeModal({ challenge, character, onComplete, onClose, pitchToleranceOverride, challengeFlags }: Props) {
  const [phase, setPhase] = useState<'intro' | 'challenge' | 'result'>('intro');
  const [rating, setRating] = useState<Rating | null>(null);
  const [score, setScore] = useState(0);

  function handleRating(r: Rating, s: number) {
    setRating(r);
    setScore(s);
    setPhase('result');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={phase === 'intro' ? onClose : undefined} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-academy-dark border border-academy-gold/30 rounded-t-2xl sm:rounded-2xl p-6 mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {phase === 'intro' && (
          <IntroPhase challenge={challenge} onStart={() => setPhase('challenge')} onClose={onClose} />
        )}
        {phase === 'challenge' && (
          <ActiveChallenge
            challenge={challenge}
            character={character}
            onRating={handleRating}
            onClose={onClose}
            pitchToleranceOverride={pitchToleranceOverride}
            challengeFlags={challengeFlags}
          />
        )}
        {phase === 'result' && rating && (
          <ResultPhase
            challenge={challenge}
            rating={rating}
            score={score}
            character={character}
            onContinue={() => onComplete(rating, score)}
          />
        )}
      </div>
    </div>
  );
}

function IntroPhase({ challenge, onStart, onClose }: {
  challenge: Challenge;
  onStart: () => void;
  onClose: () => void;
}) {
  const typeLabel: Record<string, string> = {
    technique_scale: 'Scale / Technique Challenge',
    prepared_performance: 'Prepared Performance',
    rhythm_performance: 'Rhythm Challenge',
    aural_pitch_spy: 'Aural: Pitch Spy',
    aural_rhythm_echo: 'Aural: Rhythm Echo',
    aural_melody_mapper: 'Aural: Melody Mapper',
    aural_interval_quest: 'Aural: Interval Quest',
    aural_chord_oracle: 'Aural: Chord Oracle',
  };

  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-academy-gold/60 text-xs uppercase tracking-widest font-fantasy mb-1">
            {typeLabel[challenge.type] ?? 'Challenge'}
          </div>
          <h2 className="fantasy-title text-xl">{challenge.title}</h2>
        </div>
        <button onClick={onClose} className="text-academy-cream/40 hover:text-academy-cream/80 text-xl ml-4 flex-shrink-0">
          ✕
        </button>
      </div>

      <p className="text-academy-cream/70 text-sm leading-relaxed mb-6">
        {challenge.description}
      </p>

      {challenge.beatCount ? (
        <div className="bg-black/30 border border-academy-gold/20 rounded-lg p-4 mb-6">
          <div className="text-academy-gold/60 text-xs uppercase tracking-widest font-fantasy mb-2">Performance</div>
          <div className="flex items-baseline gap-2">
            <span className="font-fantasy text-academy-gold text-xl">{challenge.beatCount}</span>
            <span className="text-academy-cream/60 text-sm">beats</span>
            <span className="text-academy-cream/30 text-xs ml-1">♩= {challenge.bpm ?? 72}</span>
            <span className="text-academy-cream/30 text-xs ml-auto">
              ~{Math.round(((challenge.beatCount ?? 8) / (challenge.bpm ?? 72)) * 60)}s
            </span>
          </div>
          <p className="text-academy-cream/40 text-xs mt-2">
            Play your best for the full phrase. Rating is based on pitch accuracy.
          </p>
        </div>
      ) : (
        <div className="bg-black/30 border border-academy-gold/20 rounded-lg p-4 mb-6">
          <div className="text-academy-gold/60 text-xs uppercase tracking-widest font-fantasy mb-2">Rating Scale</div>
          <div className="space-y-1 text-xs text-academy-cream/60">
            <div><span className="text-rating-superior font-fantasy">SUPERIOR</span> — 100% XP</div>
            <div><span className="text-rating-excellent font-fantasy">EXCELLENT</span> — 80% XP</div>
            <div><span className="text-rating-good font-fantasy">GOOD</span> — 60% XP</div>
            <div><span className="text-rating-fair font-fantasy">FAIR</span> — 30% XP</div>
            <div><span className="text-rating-poor font-fantasy">POOR</span> — 10% XP</div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button onClick={onStart} className="btn-primary flex-1">
          Begin
        </button>
      </div>
    </>
  );
}

function ActiveChallenge({ challenge, character, onRating, onClose, pitchToleranceOverride, challengeFlags }: {
  challenge: Challenge;
  character: Character;
  onRating: (rating: Rating, score: number) => void;
  onClose: () => void;
  pitchToleranceOverride?: number;
  challengeFlags?: ChallengeFlags;
}) {
  const demoMode = useUiStore((s) => s.demoMode);
  const pitchTolerance = pitchToleranceOverride ?? pitchToleranceCents(character.stats.accuracy);

  // Route to appropriate challenge UI
  if (challenge.type === 'aural_pitch_spy') {
    return <PitchSpyChallenge onRating={onRating} />;
  }
  if (challenge.type === 'aural_rhythm_echo') {
    return <RhythmEchoChallenge onRating={onRating} />;
  }
  if (challenge.type === 'aural_melody_mapper') {
    return <MelodyMapperChallenge onRating={onRating} />;
  }
  if (challenge.type === 'aural_interval_quest') {
    return <IntervalQuestChallenge onRating={onRating} />;
  }
  if (challenge.type === 'aural_chord_oracle') {
    return <ChordOracleChallenge onRating={onRating} />;
  }
  if (challenge.type === 'rhythm_performance') {
    return <RhythmTapChallenge onRating={onRating} />;
  }
  // Performance: render the real excerpt with a count-in metronome + sweeping
  // playhead. Demo Mode (no mic) swaps the microphone for a tap-along.
  return (
    <PerformanceChallenge
      challenge={challenge}
      character={character}
      onRating={onRating}
      onClose={onClose}
      pitchTolerance={pitchTolerance}
      challengeFlags={challengeFlags}
      noMic={demoMode}
    />
  );
}

// ── Performance Challenge (real sheet music + count-in metronome + playhead) ──

function PerformanceChallenge({
  challenge, character, onRating, onClose, pitchTolerance, challengeFlags, noMic,
}: {
  challenge: Challenge;
  character: Character;
  onRating: (r: Rating, s: number) => void;
  onClose: () => void;
  pitchTolerance: number;
  challengeFlags?: ChallengeFlags;
  noMic?: boolean;
}) {
  const isBlind    = challengeFlags?.blind    ?? false;
  const isManic    = challengeFlags?.manic    ?? false;
  const isConfused = challengeFlags?.confused ?? false;

  const excerpt = useMemo(() => pickExcerpt(challenge)!, [challenge]);
  const seated = useMemo(() => seatExcerpt(excerpt, character.instrument), [excerpt, character.instrument]);
  const totalBeats = excerptBeats(excerpt);
  const bpm = challenge.bpm ?? excerpt.bpm;
  const beatsPerBar = excerpt.timeSig[0];
  const rhythmTol = rhythmToleranceMs(character.stats.technique);

  const [phase, setPhase] = useState<'ready' | 'countin' | 'playing' | 'done'>('ready');
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [countLabel, setCountLabel] = useState(beatsPerBar);
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
    const opts = { bpm, pitchToleranceCents: pitchTolerance, rhythmToleranceMs: rhythmTol };
    const res = noMic ? assessTaps(tapsRef.current, seated, opts) : assessPerformance(samplesRef.current, seated, opts);
    setResult(res);
    setPhase('done');
  }, [noMic, seated, pitchTolerance, rhythmTol, bpm]);

  async function start() {
    doneRef.current = false;
    samplesRef.current = [];
    tapsRef.current = [];
    const ac = await getAudioCtx();
    const m = new Metronome(ac);
    metroRef.current = m;
    m.start({ bpm, beatsPerBar, countInBeats: beatsPerBar, totalBeats });
    setPhase('countin');
    const loop = () => {
      const b = m.beatsElapsed();
      if (b < -0.001) {
        setCountLabel(beatsPerBar + Math.floor(b) + 1); // counts down to 1
        setPlayhead(null);
      } else if (b < totalBeats) {
        setPhase('playing');
        setPlayhead(b);
      } else {
        finalize();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function handlePitch(freq: number, cents: number) {
    const m = metroRef.current;
    if (doneRef.current || !m) return;
    const beat = m.beatsElapsed();
    if (beat < 0 || beat > totalBeats) return;
    samplesRef.current.push({ beat, cents, freq });
  }

  const tap = useCallback(() => {
    const m = metroRef.current;
    if (doneRef.current || !m) return;
    const beat = m.beatsElapsed();
    if (beat < 0 || beat > totalBeats + 0.5) return;
    tapsRef.current.push(beat);
  }, [totalBeats]);

  useEffect(() => {
    if (!noMic) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [noMic, tap]);

  useEffect(() => () => { metroRef.current?.stop(); cancelAnimationFrame(rafRef.current); }, []);

  const running = phase === 'countin' || phase === 'playing';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="fantasy-title text-lg">{excerpt.title}</h3>
        <button onClick={onClose} className="text-academy-cream/40 hover:text-academy-cream/80">✕</button>
      </div>
      <div className="text-academy-cream/40 text-xs mb-3">
        {character.instrument.replace('_', ' ')} · ♩= {bpm} · {excerpt.timeSig[0]}/{excerpt.timeSig[1]}
        {excerpt.composer && ` · ${excerpt.composer}`}
      </div>

      {/* Sheet music — sweeping playhead while playing, accuracy overlay when done */}
      <div className="mb-3" style={{ filter: isBlind && phase !== 'done' ? 'blur(3px)' : undefined }}>
        <PerformanceStaff
          seated={seated} timeSig={excerpt.timeSig} totalBeats={totalBeats}
          playheadBeat={running ? playhead : null}
          noteColors={phase === 'done' && result ? overlayColors(result) : undefined}
        />
      </div>

      {(isBlind || isManic || isConfused) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {isBlind    && <span className="text-[9px] font-fantasy px-1.5 py-0.5 rounded text-rating-fair bg-rating-fair/10">🌫️ BLIND — notation blurred</span>}
          {isManic    && <span className="text-[9px] font-fantasy px-1.5 py-0.5 rounded text-orange-400 bg-orange-400/10">🔥 MANIC — pitch window narrowed</span>}
          {isConfused && <span className="text-[9px] font-fantasy px-1.5 py-0.5 rounded text-fuchsia-300 bg-fuchsia-300/10">💫 CONFUSED</span>}
        </div>
      )}

      {phase === 'ready' && (
        <button onClick={start} className="btn-primary w-full">
          {noMic ? 'Start — Tap Along' : 'Start Performance'}
        </button>
      )}

      {phase === 'countin' && (
        <div className="text-center py-4">
          <div className="text-academy-gold/60 text-xs uppercase tracking-widest font-fantasy mb-1">Count-in</div>
          <div className="font-fantasy text-4xl text-academy-gold">{Math.max(1, countLabel)}</div>
        </div>
      )}

      {phase === 'playing' && (
        noMic ? (
          <button onPointerDown={tap} className="btn-primary w-full h-20 text-xl active:scale-95 transition-transform">
            TAP each note
            <div className="text-xs mt-1 opacity-60">{tapsRef.current.length} taps · or press Space</div>
          </button>
        ) : (
          <MicrophoneListener mode="pitch" onPitchDetected={handlePitch} active />
        )
      )}

      {running && (
        <button onClick={finalize} className="btn-secondary w-full mt-3">Submit Early</button>
      )}

      {phase === 'done' && result && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatPct label="Pitch" pct={result.pitchPct} />
            <StatPct label="Rhythm" pct={result.rhythmPct} />
            <StatPct label="Overall" pct={result.overallPct} highlight />
          </div>
          <p className="text-academy-cream/40 text-[11px] mb-3 text-center leading-relaxed">
            Note colour is your accuracy — <span style={{ color: 'rgb(34,139,34)' }}>green</span> is on the money,
            <span style={{ color: 'rgb(200,40,30)' }}> red</span> is off.
            {noMic && ' Tap mode scores rhythm only.'}
          </p>
          <button onClick={() => onRating(result.rating, result.overallPct)} className="btn-primary w-full">Continue</button>
        </div>
      )}
    </div>
  );
}

function StatPct({ label, pct, highlight }: { label: string; pct: number | null; highlight?: boolean }) {
  const color = pct === null ? '#6b7280' : accuracyColor(pct / 100);
  return (
    <div className={`rounded-lg border p-2 text-center ${highlight ? 'border-academy-gold/40 bg-academy-gold/5' : 'border-academy-gold/15'}`}>
      <div className="text-academy-cream/40 text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
      <div className="font-fantasy text-xl" style={{ color }}>{pct === null ? '—' : `${pct}%`}</div>
    </div>
  );
}

// ── Pitch Spy Challenge ───────────────────────────────────────────────────────

const PITCH_SPY_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'];

function PitchSpyChallenge({ onRating }: { onRating: (r: Rating, s: number) => void }) {
  const targetIndex = useRef(Math.floor(Math.random() * PITCH_SPY_NOTES.length));
  const target = PITCH_SPY_NOTES[targetIndex.current];
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Build 4 options including the target
  const options = buildOptions(target, PITCH_SPY_NOTES, 4);

  function pick(note: string) {
    if (answered) return;
    setSelected(note);
    setAnswered(true);
    const correct = note === target;
    setTimeout(() => onRating(correct ? 'superior' : 'poor', correct ? 100 : 0), 1200);
  }

  return (
    <div className="text-center">
      <h3 className="fantasy-title text-lg mb-2">Pitch Spy</h3>
      <p className="text-academy-cream/60 text-sm mb-4">
        Listen to the note, then identify it.
      </p>
      <div className="bg-black/30 rounded-lg p-6 mb-6 flex items-center justify-center gap-3">
        <button
          className="text-4xl hover:scale-110 transition-transform"
          onClick={() => playTone(noteToFreq(target))}
        >
          🔊
        </button>
        <span className="text-academy-cream/40 text-sm">Click to play</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((note) => (
          <button
            key={note}
            onClick={() => pick(note)}
            disabled={answered}
            className={`py-3 px-4 rounded-lg border font-fantasy transition-all
              ${!answered ? 'border-academy-gold/30 hover:border-academy-gold text-academy-cream/80 hover:text-academy-gold' :
                note === target ? 'border-rating-superior bg-rating-superior/20 text-rating-superior' :
                note === selected ? 'border-rating-poor bg-rating-poor/20 text-rating-poor' :
                'border-academy-gold/20 text-academy-cream/30 opacity-50'
              }`}
          >
            {note}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Rhythm Echo Challenge ──────────────────────────────────────────────────────

const RHYTHM_PATTERNS = [
  { label: '♩ ♩ ♩ ♩', beats: [0, 1, 2, 3] },
  { label: '♩ ♩ ♩♩ ♩', beats: [0, 1, 2, 2.5, 3] },
  { label: '𝅗𝅥 ♩ ♩', beats: [0, 2, 3] },
];

function RhythmEchoChallenge({ onRating }: { onRating: (r: Rating, s: number) => void }) {
  const patternIndex = useRef(Math.floor(Math.random() * RHYTHM_PATTERNS.length));
  const pattern = RHYTHM_PATTERNS[patternIndex.current];
  const [phase, setPhase] = useState<'listen' | 'tap' | 'done'>('listen');
  const [taps, setTaps] = useState<number[]>([]);
  const tapsRef = useRef<number[]>([]); // ref so setTimeout closure reads current taps
  const startTime = useRef<number>(0);
  const BPM = 80;
  const beatMs = (60 / BPM) * 1000;

  function startTapping() {
    tapsRef.current = [];
    setTaps([]);
    setPhase('tap');
    startTime.current = Date.now();
    setTimeout(() => {
      setPhase('done');
      scoreTaps(tapsRef.current, pattern.beats, beatMs, onRating);
    }, beatMs * 5);
  }

  function tap() {
    if (phase !== 'tap') return;
    const t = (Date.now() - startTime.current) / beatMs;
    tapsRef.current = [...tapsRef.current, t];
    setTaps((prev) => [...prev, t]);
  }

  return (
    <div className="text-center">
      <h3 className="fantasy-title text-lg mb-2">Rhythm Echo</h3>
      <p className="text-academy-cream/60 text-sm mb-4">
        Listen to the rhythm, then tap it back.
      </p>
      <div className="bg-black/30 rounded-lg p-6 mb-6">
        <div className="text-2xl mb-3 tracking-widest">{pattern.label}</div>
        <button
          className="text-3xl hover:scale-110 transition-transform"
          onClick={() => playRhythm(pattern.beats, beatMs)}
        >
          🔊
        </button>
      </div>
      {phase === 'listen' && (
        <button onClick={startTapping} className="btn-primary w-full">
          Tap It Back
        </button>
      )}
      {phase === 'tap' && (
        <button
          onPointerDown={tap}
          className="btn-primary w-full h-20 text-xl active:scale-95 transition-transform"
        >
          TAP
          <div className="text-sm mt-1 opacity-60">{taps.length} taps</div>
        </button>
      )}
      {phase === 'done' && (
        <div className="text-rating-good font-fantasy animate-pulse">Analyzing…</div>
      )}
    </div>
  );
}

// ── Rhythm Tap Challenge ───────────────────────────────────────────────────────

function RhythmTapChallenge({ onRating }: { onRating: (r: Rating, s: number) => void }) {
  const BPM = 80;
  const BPB = 4;
  const targetBeats = [0, 1, 2, 3, 4, 5, 6, 7]; // 2 bars of quarter notes
  const totalBeats = 8;
  const [phase, setPhase] = useState<'intro' | 'countin' | 'tapping' | 'done'>('intro');
  const [tapCount, setTapCount] = useState(0);
  const [countLabel, setCountLabel] = useState(BPB);
  const tapsRef = useRef<number[]>([]);
  const metroRef = useRef<Metronome | null>(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    metroRef.current?.stop();
    cancelAnimationFrame(rafRef.current);
    setPhase('done');
    scoreTaps(tapsRef.current, targetBeats, 0, onRating);
  }, [onRating]);

  async function start() {
    doneRef.current = false;
    tapsRef.current = [];
    setTapCount(0);
    const ac = await getAudioCtx();
    const m = new Metronome(ac);
    metroRef.current = m;
    m.start({ bpm: BPM, beatsPerBar: BPB, countInBeats: BPB, totalBeats });
    setPhase('countin');
    const loop = () => {
      const b = m.beatsElapsed();
      if (b < -0.001) setCountLabel(BPB + Math.floor(b) + 1);
      else if (b < totalBeats + 1) setPhase('tapping');
      if (b >= totalBeats + 1) { finish(); return; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  const tap = useCallback(() => {
    const m = metroRef.current;
    if (doneRef.current || !m) return;
    const b = m.beatsElapsed();
    if (b < -0.5) return;
    tapsRef.current.push(b);
    setTapCount(tapsRef.current.length);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);
  useEffect(() => () => { metroRef.current?.stop(); cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div className="text-center">
      <h3 className="fantasy-title text-lg mb-2">Rhythm Performance</h3>
      <p className="text-academy-cream/60 text-sm mb-4">
        Tap 8 steady quarter notes in 4/4 with the metronome. ♩= {BPM}
      </p>
      {phase === 'intro' && <button onClick={start} className="btn-primary w-full">Start</button>}
      {phase === 'countin' && (
        <div className="py-4">
          <div className="text-academy-gold/60 text-xs uppercase tracking-widest font-fantasy mb-1">Count-in</div>
          <div className="font-fantasy text-4xl text-academy-gold">{Math.max(1, countLabel)}</div>
        </div>
      )}
      {phase === 'tapping' && (
        <button onPointerDown={tap} className="btn-primary w-full h-24 text-2xl active:scale-95 transition-transform">
          TAP
          <div className="text-sm mt-1 opacity-60">{tapCount} / {targetBeats.length} · or press Space</div>
        </button>
      )}
      {phase === 'done' && <div className="text-rating-good font-fantasy animate-pulse">Scoring…</div>}
    </div>
  );
}

// ── Melody Mapper Challenge ───────────────────────────────────────────────────

const MELODIES = [
  { label: 'C  D  E  C',  notes: ['C4','D4','E4','C4']  },
  { label: 'C  E  G  E',  notes: ['C4','E4','G4','E4']  },
  { label: 'G  F  E  D',  notes: ['G4','F4','E4','D4']  },
  { label: 'C  D  E  F',  notes: ['C4','D4','E4','F4']  },
  { label: 'E  D  C  G',  notes: ['E4','D4','C4','G4']  },
  { label: 'G  E  D  C',  notes: ['G4','E4','D4','C4']  },
];

function MelodyMapperChallenge({ onRating }: { onRating: (r: Rating, s: number) => void }) {
  const idx = useRef(Math.floor(Math.random() * MELODIES.length));
  const target = MELODIES[idx.current];
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const options = buildChoices(target.label, MELODIES.map((m) => m.label), 4);

  function playMelody() {
    const ctx = new AudioContext();
    target.notes.forEach((note, i) => {
      playToneAt(ctx, noteToFreq(note), ctx.currentTime + i * 0.42, 0.38);
    });
  }

  function pick(label: string) {
    if (answered) return;
    setSelected(label);
    setAnswered(true);
    const correct = label === target.label;
    setTimeout(() => onRating(correct ? 'superior' : 'poor', correct ? 100 : 0), 1200);
  }

  return (
    <div className="text-center">
      <h3 className="fantasy-title text-lg mb-2">Melody Mapper</h3>
      <p className="text-academy-cream/60 text-sm mb-4">
        Listen to the melody and identify the correct note sequence.
      </p>
      <div className="bg-black/30 rounded-lg p-6 mb-6 flex items-center justify-center gap-3">
        <button className="text-4xl hover:scale-110 transition-transform" onClick={playMelody}>🔊</button>
        <span className="text-academy-cream/40 text-sm">Click to play</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((label) => (
          <button
            key={label}
            onClick={() => pick(label)}
            disabled={answered}
            className={`py-3 px-3 rounded-lg border font-fantasy text-sm transition-all
              ${!answered ? 'border-academy-gold/30 hover:border-academy-gold text-academy-cream/80' :
                label === target.label ? 'border-rating-superior bg-rating-superior/20 text-rating-superior' :
                label === selected ? 'border-rating-poor bg-rating-poor/20 text-rating-poor' :
                'border-academy-gold/20 text-academy-cream/30 opacity-50'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Interval Quest Challenge ───────────────────────────────────────────────────

const INTERVALS = [
  { name: 'Unison',      semitones: 0  },
  { name: 'Minor 2nd',   semitones: 1  },
  { name: 'Major 2nd',   semitones: 2  },
  { name: 'Minor 3rd',   semitones: 3  },
  { name: 'Major 3rd',   semitones: 4  },
  { name: 'Perfect 4th', semitones: 5  },
  { name: 'Tritone',     semitones: 6  },
  { name: 'Perfect 5th', semitones: 7  },
  { name: 'Minor 6th',   semitones: 8  },
  { name: 'Major 6th',   semitones: 9  },
  { name: 'Minor 7th',   semitones: 10 },
  { name: 'Major 7th',   semitones: 11 },
  { name: 'Octave',      semitones: 12 },
];

const INTERVAL_ROOTS = [261.63, 293.66, 329.63, 349.23, 392.0]; // C4 D4 E4 F4 G4

function IntervalQuestChallenge({ onRating }: { onRating: (r: Rating, s: number) => void }) {
  const targetInterval = useRef(INTERVALS[Math.floor(Math.random() * INTERVALS.length)]);
  const rootFreq = useRef(INTERVAL_ROOTS[Math.floor(Math.random() * INTERVAL_ROOTS.length)]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const options = buildChoices(targetInterval.current.name, INTERVALS.map((i) => i.name), 4);

  function playInterval() {
    const ctx = new AudioContext();
    const upper = transposeFreq(rootFreq.current, targetInterval.current.semitones);
    playToneAt(ctx, rootFreq.current, ctx.currentTime, 0.55);
    playToneAt(ctx, upper, ctx.currentTime + 0.65, 0.55);
  }

  function pick(name: string) {
    if (answered) return;
    setSelected(name);
    setAnswered(true);
    const correct = name === targetInterval.current.name;
    setTimeout(() => onRating(correct ? 'superior' : 'poor', correct ? 100 : 0), 1200);
  }

  return (
    <div className="text-center">
      <h3 className="fantasy-title text-lg mb-2">Interval Quest</h3>
      <p className="text-academy-cream/60 text-sm mb-4">
        Listen to two notes played in sequence. Name the interval.
      </p>
      <div className="bg-black/30 rounded-lg p-6 mb-6 flex items-center justify-center gap-3">
        <button className="text-4xl hover:scale-110 transition-transform" onClick={playInterval}>🔊</button>
        <span className="text-academy-cream/40 text-sm">Click to play</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((name) => (
          <button
            key={name}
            onClick={() => pick(name)}
            disabled={answered}
            className={`py-3 px-3 rounded-lg border font-fantasy text-sm transition-all
              ${!answered ? 'border-academy-gold/30 hover:border-academy-gold text-academy-cream/80' :
                name === targetInterval.current.name ? 'border-rating-superior bg-rating-superior/20 text-rating-superior' :
                name === selected ? 'border-rating-poor bg-rating-poor/20 text-rating-poor' :
                'border-academy-gold/20 text-academy-cream/30 opacity-50'}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chord Oracle Challenge ─────────────────────────────────────────────────────

const CHORD_QUALITIES = [
  { name: 'Major',          semitones: [0, 4, 7]     },
  { name: 'Minor',          semitones: [0, 3, 7]     },
  { name: 'Dominant 7th',   semitones: [0, 4, 7, 10] },
  { name: 'Diminished',     semitones: [0, 3, 6]     },
];

function ChordOracleChallenge({ onRating }: { onRating: (r: Rating, s: number) => void }) {
  const targetQuality = useRef(CHORD_QUALITIES[Math.floor(Math.random() * CHORD_QUALITIES.length)]);
  const rootFreq = useRef(INTERVAL_ROOTS[Math.floor(Math.random() * INTERVAL_ROOTS.length)]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const options = buildChoices(targetQuality.current.name, CHORD_QUALITIES.map((q) => q.name), 4);

  function playChord() {
    const ctx = new AudioContext();
    targetQuality.current.semitones.forEach((st) => {
      playToneAt(ctx, transposeFreq(rootFreq.current, st), ctx.currentTime, 1.2);
    });
  }

  function pick(name: string) {
    if (answered) return;
    setSelected(name);
    setAnswered(true);
    const correct = name === targetQuality.current.name;
    setTimeout(() => onRating(correct ? 'superior' : 'poor', correct ? 100 : 0), 1200);
  }

  return (
    <div className="text-center">
      <h3 className="fantasy-title text-lg mb-2">Chord Oracle</h3>
      <p className="text-academy-cream/60 text-sm mb-4">
        Listen to the chord and identify its quality.
      </p>
      <div className="bg-black/30 rounded-lg p-6 mb-6 flex items-center justify-center gap-3">
        <button className="text-4xl hover:scale-110 transition-transform" onClick={playChord}>🔊</button>
        <span className="text-academy-cream/40 text-sm">Click to play</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((name) => (
          <button
            key={name}
            onClick={() => pick(name)}
            disabled={answered}
            className={`py-3 px-3 rounded-lg border font-fantasy text-sm transition-all
              ${!answered ? 'border-academy-gold/30 hover:border-academy-gold text-academy-cream/80' :
                name === targetQuality.current.name ? 'border-rating-superior bg-rating-superior/20 text-rating-superior' :
                name === selected ? 'border-rating-poor bg-rating-poor/20 text-rating-poor' :
                'border-academy-gold/20 text-academy-cream/30 opacity-50'}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Result Phase ─────────────────────────────────────────────────────────────

function ResultPhase({ challenge, rating, score, character, onContinue }: {
  challenge: Challenge;
  rating: Rating;
  score: number;
  character: Character;
  onContinue: () => void;
}) {
  const config: Record<Rating, { label: string; color: string; message: string }> = {
    superior: { label: 'SUPERIOR', color: '#FFD700', message: 'Flawless. The Composer himself would approve.' },
    excellent: { label: 'EXCELLENT', color: '#4ADE80', message: 'Outstanding performance. Keep pushing.' },
    good: { label: 'GOOD', color: '#60A5FA', message: 'Solid work. The Academy is proud.' },
    fair: { label: 'FAIR', color: '#FB923C', message: 'Acceptable. More practice will sharpen this.' },
    poor: { label: 'POOR', color: '#F87171', message: 'Keep trying. Every attempt builds strength.' },
  };

  const { label, color, message } = config[rating];
  const xpMultipliers = { superior: 1.0, excellent: 0.8, good: 0.6, fair: 0.3, poor: 0.1 };
  const xpAwarded = Math.round(challenge.xpBase * xpMultipliers[rating]);

  return (
    <div className="text-center">
      <div
        className="font-fantasy text-5xl font-black tracking-widest mb-2 py-4"
        style={{ color, textShadow: `0 0 30px ${color}60` }}
      >
        {label}
      </div>
      <p className="text-academy-cream/60 text-sm italic mb-6">{message}</p>
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-academy-cream/40 text-xs mb-1">Score</div>
          <div className="font-fantasy text-xl" style={{ color }}>{score}%</div>
        </div>
        <div className="text-center">
          <div className="text-academy-cream/40 text-xs mb-1">XP</div>
          <div className="font-fantasy text-xl text-academy-gold">+{xpAwarded}</div>
        </div>
        <div className="text-center">
          <div className="text-academy-cream/40 text-xs mb-1">Level</div>
          <div className="font-fantasy text-xl text-academy-gold">{character.level}</div>
        </div>
      </div>
      <button onClick={onContinue} className="btn-primary w-full">
        Continue
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function transposeFreq(freq: number, semitones: number): number {
  return freq * Math.pow(2, semitones / 12);
}

function playToneAt(ctx: AudioContext, freq: number, startTime: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.28, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function buildChoices(target: string, pool: string[], count: number): string[] {
  const choices = [target];
  const others = pool.filter((p) => p !== target).sort(() => Math.random() - 0.5);
  while (choices.length < count && others.length > 0) {
    choices.push(others.pop()!);
  }
  return choices.sort(() => Math.random() - 0.5);
}

function scoreToRating(score: number): Rating {
  if (score >= 90) return 'superior';
  if (score >= 75) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function buildOptions(target: string, pool: string[], count: number): string[] {
  const opts = [target];
  const others = pool.filter((n) => n !== target);
  while (opts.length < count && others.length > 0) {
    const i = Math.floor(Math.random() * others.length);
    opts.push(others.splice(i, 1)[0]);
  }
  return opts.sort(() => Math.random() - 0.5);
}

const NOTE_FREQ: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, Bb4: 466.16, B4: 493.88, C5: 523.25,
};

function noteToFreq(note: string): number {
  return NOTE_FREQ[note] ?? 440;
}

function playTone(freq: number) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  osc.start();
  osc.stop(ctx.currentTime + 1);
}

function playRhythm(beats: number[], beatMs: number) {
  const ctx = new AudioContext();
  beats.forEach((beat) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'square';
    const t = ctx.currentTime + (beat * beatMs) / 1000;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t);
    osc.stop(t + 0.1);
  });
}

function scoreTaps(
  taps: number[],
  targets: number[],
  _beatMs: number,
  onRating: (r: Rating, s: number) => void,
) {
  if (taps.length === 0) { onRating('poor', 0); return; }

  let totalScore = 0;
  const matched = new Set<number>();

  for (const target of targets) {
    let best = Infinity;
    let bestTap = -1;
    for (let i = 0; i < taps.length; i++) {
      if (matched.has(i)) continue;
      const diff = Math.abs(taps[i] - target);
      if (diff < best) { best = diff; bestTap = i; }
    }
    if (bestTap >= 0) {
      matched.add(bestTap);
      // best is in beat units; convert to score (0.5 beat tolerance = 0% score)
      totalScore += Math.max(0, 100 - best * 200);
    }
  }

  const avg = totalScore / targets.length;
  onRating(scoreToRating(avg), Math.round(avg));
}
