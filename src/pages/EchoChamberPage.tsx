import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getInstrumentColor, INSTRUMENTS } from '../lib/instruments';
import MemoryStaff, { type PadTone } from '../components/music/MemoryStaff';
import {
  buildPads, extendSequence, ratingForPhrase, scoreForPhrase, estimateXp,
  loadBests, saveBest, concertKey,
  CONCERT_KEYS, DIFFICULTIES, DIFFICULTY_ORDER,
  type ConcertKeyId, type MemoryDifficulty,
} from '../lib/music/memoryGame';
import { playPadTone, playErrorBuzz, playRoundClear, playRunOver } from '../lib/music/audio';
import type { Rating } from '../types/game';

// The Echo Chamber. The Chamber sounds and lights a phrase on the staff; the
// player echoes it back by pressing the same noteheads, and the phrase grows by
// one note each round. A wrong note costs a retry and replays the same phrase;
// out of retries ends the run and banks the XP.

type Phase = 'setup' | 'watch' | 'repeat' | 'cleared' | 'wrong' | 'over';

const RATING_COLORS: Record<Rating, string> = {
  superior:  'text-rating-superior',
  excellent: 'text-rating-excellent',
  good:      'text-rating-good',
  fair:      'text-rating-fair',
  poor:      'text-rating-poor',
};

const SOUND_KEY = 'bq_echo_sound';

export default function EchoChamberPage() {
  const { character, awardChallenge } = useGameStore();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('journeyman');
  const [keyId, setKeyId] = useState<ConcertKeyId>('bb');
  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== '0'; } catch { return true; }
  });

  const [phase, setPhase] = useState<Phase>('setup');
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [cleared, setCleared] = useState(0);       // longest phrase echoed back
  const [retries, setRetries] = useState(0);
  const [lit, setLit] = useState<{ pad: number; tone: PadTone } | null>(null);
  const [bests, setBests] = useState(() => loadBests());
  const [result, setResult] = useState<{ rating: Rating; xp: number; record: boolean } | null>(null);

  const diff = DIFFICULTIES[difficulty];
  const padSet = useMemo(
    () => (character ? buildPads(character.instrument, keyId, diff.padCount) : null),
    [character?.instrument, keyId, diff.padCount],
  );

  // Every pending timeout, so a reset or unmount can cancel the whole schedule.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const tone = useCallback((midi: number, dur?: number) => {
    if (sound) void playPadTone(midi, dur);
  }, [sound]);

  /** Light and sound the phrase, then hand the staff back to the player. */
  const echoPhrase = useCallback((seq: number[]) => {
    if (!padSet) return;
    clearTimers();
    setLit(null);
    setInputIndex(0);
    setPhase('watch');
    const step = diff.noteMs + diff.gapMs;
    seq.forEach((padId, i) => {
      after(500 + i * step, () => {
        setLit({ pad: padId, tone: 'echo' });
        tone(padSet.pads[padId].concertMidi, diff.noteMs / 1000);
      });
      after(500 + i * step + diff.noteMs, () => setLit(null));
    });
    after(500 + seq.length * step + 120, () => setPhase('repeat'));
  }, [padSet, diff.noteMs, diff.gapMs, clearTimers, after, tone]);

  function beginRun() {
    if (!padSet) return;
    setCleared(0);
    setRetries(diff.retries);
    setResult(null);
    const first = extendSequence([], padSet.pads.length);
    setSequence(first);
    echoPhrase(first);
  }

  function backToSetup() {
    clearTimers();
    setLit(null);
    setSequence([]);
    setResult(null);
    setPhase('setup');
  }

  const endRun = useCallback(async (finalCleared: number) => {
    clearTimers();
    setLit(null);
    setPhase('over');
    if (padSet && sound) void playRunOver(padSet.tonicMidi);

    const rating = ratingForPhrase(finalCleared);
    const record = saveBest(difficulty, finalCleared);
    setBests(loadBests());
    setResult({ rating, xp: estimateXp(rating, diff.xpMultiplier), record });

    // Ear-training XP, replayable — this never marks a challenge complete.
    if (finalCleared > 0) {
      await awardChallenge(
        `echo_chamber_${difficulty}`, 'aural', scoreForPhrase(finalCleared), rating,
        { xpMultiplier: diff.xpMultiplier, trackCompletion: false },
      );
    }
  }, [padSet, sound, difficulty, diff.xpMultiplier, awardChallenge, clearTimers]);

  const press = useCallback((padId: number) => {
    if (phase !== 'repeat' || !padSet) return;

    if (padId === sequence[inputIndex]) {
      setLit({ pad: padId, tone: 'input' });
      tone(padSet.pads[padId].concertMidi, 0.4);
      after(240, () => setLit(null));

      const next = inputIndex + 1;
      if (next < sequence.length) { setInputIndex(next); return; }

      // Phrase complete — grow it and echo again.
      const done = sequence.length;
      setCleared(done);
      setPhase('cleared');
      if (sound) void playRoundClear(padSet.tonicMidi);
      after(850, () => {
        const grown = extendSequence(sequence, padSet.pads.length);
        setSequence(grown);
        echoPhrase(grown);
      });
      return;
    }

    // Wrong note.
    setLit({ pad: padId, tone: 'wrong' });
    setPhase('wrong');
    if (sound) void playErrorBuzz();
    const left = retries - 1;
    after(950, () => {
      setLit(null);
      if (left >= 0) { setRetries(left); echoPhrase(sequence); }
      else void endRun(cleared);
    });
  }, [phase, padSet, sequence, inputIndex, retries, cleared, sound, tone, after, echoPhrase, endRun]);

  /** Spend a retry to hear the phrase again, from the top. */
  function replayPhrase() {
    if (phase !== 'repeat' || retries <= 0) return;
    setRetries(retries - 1);
    echoPhrase(sequence);
  }

  // Number keys 1–8 play the matching pad.
  useEffect(() => {
    if (phase !== 'repeat' || !padSet) return;
    function onKey(e: KeyboardEvent) {
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n) || n < 1 || n > (padSet?.pads.length ?? 0)) return;
      e.preventDefault();
      press(n - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, padSet, press]);

  if (!character || !padSet) return null;

  const color = getInstrumentColor(character.instrument);
  const best = bests[difficulty] ?? 0;
  const inRun = phase !== 'setup' && phase !== 'over';

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-academy-dark/95 backdrop-blur-sm border-b border-academy-gold/10 px-4 py-3 flex items-center justify-between">
        <div className="fantasy-title text-base text-academy-gold">The Echo Chamber</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { const v = !sound; setSound(v); try { localStorage.setItem(SOUND_KEY, v ? '1' : '0'); } catch { /* ignore */ } }}
            className="text-academy-cream/40 hover:text-academy-cream/80 text-xs transition-colors"
            title={sound ? 'Mute — play by sight alone' : 'Unmute'}
          >
            {sound ? '🔊 Sound' : '🔇 Silent'}
          </button>
          <button
            onClick={() => navigate('/hub')}
            className="text-academy-cream/40 hover:text-academy-cream/80 text-xs transition-colors"
          >
            ← Hub
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {phase === 'setup' && (
          <>
            <p className="text-academy-cream/50 text-sm mb-6">
              The Chamber sounds a phrase on your staff. Echo it back by pressing the
              same notes, in order. Every round it adds one more note — how long a
              phrase can you hold?
            </p>

            <h2 className="fantasy-title text-xs text-academy-gold/60 uppercase tracking-widest mb-3">Difficulty</h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DIFFICULTY_ORDER.map((id) => {
                const d = DIFFICULTIES[id];
                const active = id === difficulty;
                return (
                  <button
                    key={id}
                    onClick={() => setDifficulty(id)}
                    className={`card-panel text-left transition-all cursor-pointer ${active ? '' : 'hover:border-academy-gold/40'}`}
                    style={active ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
                  >
                    <div className="text-sm font-fantasy" style={{ color: active ? color : undefined }}>{d.name}</div>
                    <div className="text-academy-cream/40 text-xs mt-1">{d.blurb}</div>
                    <div className="text-academy-cream/30 text-[10px] mt-2">
                      {d.padCount} notes · {d.retries} {d.retries === 1 ? 'retry' : 'retries'} · {d.xpMultiplier}× XP
                      {bests[id] ? ` · best ${bests[id]}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            <h2 className="fantasy-title text-xs text-academy-gold/60 uppercase tracking-widest mb-3">Concert key</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {CONCERT_KEYS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKeyId(k.id)}
                  className={`px-4 py-2 rounded-lg border text-sm font-fantasy transition-colors ${
                    k.id === keyId
                      ? 'border-academy-gold text-academy-gold bg-academy-gold/10'
                      : 'border-academy-gold/20 text-academy-cream/50 hover:text-academy-cream/80'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-academy-cream/40 text-xs mb-2">
                Your part — {INSTRUMENTS[character.instrument].name} in concert {concertKey(keyId).label}
              </div>
              <MemoryStaff
                pads={padSet.pads} clef={padSet.clef} writtenKeySig={padSet.writtenKeySig}
                showNames={diff.showNames} lit={null} disabled onPress={() => {}}
              />
            </div>

            <button onClick={beginRun} className="btn-primary w-full">Enter the Chamber</button>
          </>
        )}

        {(inRun || phase === 'over') && (
          <>
            {/* Run status */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat label="Phrase" value={phase === 'over' ? cleared : sequence.length} color={color} />
              <Stat label="Cleared" value={cleared} color={color} />
              <Stat label="Retries" value={retries} color={retries > 0 ? color : '#F87171'} />
            </div>

            <div className="mb-3 h-6 flex items-center justify-center">
              <span className={`font-fantasy text-sm tracking-widest uppercase ${
                phase === 'watch' ? 'text-academy-gold'
                : phase === 'repeat' ? 'text-rating-excellent'
                : phase === 'wrong' ? 'text-rating-poor'
                : phase === 'cleared' ? 'text-rating-superior'
                : 'text-academy-cream/40'
              }`}>
                {phase === 'watch' && 'Listen…'}
                {phase === 'repeat' && `Your turn — note ${inputIndex + 1} of ${sequence.length}`}
                {phase === 'cleared' && 'Echoed!'}
                {phase === 'wrong' && (retries > 0 ? 'Wrong note — from the top' : 'Wrong note')}
                {phase === 'over' && 'Run complete'}
              </span>
            </div>

            <MemoryStaff
              pads={padSet.pads} clef={padSet.clef} writtenKeySig={padSet.writtenKeySig}
              showNames={diff.showNames} lit={lit}
              disabled={phase !== 'repeat'} onPress={press}
            />

            {/* Progress dots — one per note of the current phrase */}
            {inRun && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {sequence.map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: phase === 'repeat' && i < inputIndex ? '#4ADE80' : `${color}33`,
                      boxShadow: phase === 'repeat' && i === inputIndex ? `0 0 0 2px ${color}` : undefined,
                    }}
                  />
                ))}
              </div>
            )}

            {phase === 'repeat' && (
              <div className="flex justify-center gap-3 mt-5">
                <button
                  onClick={replayPhrase}
                  disabled={retries <= 0}
                  className="btn-secondary text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Hear it again {retries > 0 ? '(−1 retry)' : '(no retries left)'}
                </button>
                <button onClick={() => void endRun(cleared)} className="btn-secondary text-xs">
                  End run
                </button>
              </div>
            )}

            {phase === 'over' && result && (
              <div className="card-panel mt-6 text-center">
                <div className={`fantasy-title text-2xl mb-1 ${RATING_COLORS[result.rating]}`}>
                  {result.rating.toUpperCase()}
                </div>
                <div className="text-academy-cream/60 text-sm mb-4">
                  Longest phrase echoed: <span className="font-fantasy" style={{ color }}>{cleared}</span>
                  {cleared === 1 ? ' note' : ' notes'}
                </div>
                {result.record && cleared > 0 && (
                  <div className="text-rating-superior text-xs font-fantasy mb-3">★ New personal best</div>
                )}
                <div className="text-academy-cream/40 text-xs mb-5">
                  {cleared > 0 ? `+${result.xp} XP earned` : 'No XP — echo at least one phrase'}
                  {best > 0 && ` · best on ${diff.name}: ${best}`}
                </div>
                <div className="flex justify-center gap-3">
                  <button onClick={beginRun} className="btn-primary text-sm">Again</button>
                  <button onClick={backToSetup} className="btn-secondary text-sm">Change settings</button>
                </div>
              </div>
            )}

            {inRun && (
              <div className="text-center mt-6">
                <button onClick={backToSetup} className="text-academy-cream/30 hover:text-academy-cream/60 text-xs transition-colors">
                  Abandon run
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card-panel py-3 text-center">
      <div className="text-academy-cream/40 text-[10px] uppercase tracking-wider mb-1">{label}</div>
      <div className="font-fantasy text-lg" style={{ color }}>{value}</div>
    </div>
  );
}
