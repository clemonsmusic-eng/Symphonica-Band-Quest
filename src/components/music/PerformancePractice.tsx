import { useMemo, useState } from 'react';
import type { Character } from '../../types/game';
import { EXCERPTS } from '../../lib/music/excerpts';
import type { Excerpt, ExcerptChallengeType } from '../../lib/music/types';
import { excerptBeats } from '../../lib/music/types';
import { seatExcerpt } from '../../lib/music/transposition';
import { usePerformanceRun } from '../../lib/music/usePerformanceRun';
import { playExcerpt, type ExcerptPlayback } from '../../lib/music/audio';
import { overlayColors } from '../../lib/music/assessment';
import { accuracyColor } from '../../lib/music/accuracyColor';
import { pitchToleranceCents, rhythmToleranceMs } from '../../lib/instruments';
import { useUiStore } from '../../store/uiStore';
import PerformanceStaff from './PerformanceStaff';
import MicrophoneListener from '../MicrophoneListener';

const TYPE_LABELS: Record<ExcerptChallengeType, string> = {
  technique_scale: 'Scales & Technique',
  prepared_performance: 'Prepared Pieces',
  sight_reading: 'Sight-Reading',
  rhythm_performance: 'Rhythm',
};

export default function PerformancePractice({ character }: { character: Character }) {
  const [selected, setSelected] = useState<Excerpt | null>(null);
  if (selected) return <PracticeRun key={selected.id} excerpt={selected} character={character} onBack={() => setSelected(null)} />;

  const byType = EXCERPTS.reduce<Record<string, Excerpt[]>>((acc, e) => {
    (acc[e.challengeType] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <p className="text-academy-cream/50 text-sm mb-6">
        Practice any selection with a metronome and demonstration, at your own tempo. Get pitch &amp;
        rhythm accuracy feedback with a colour overlay showing exactly where you drifted.
      </p>
      {(Object.keys(byType) as ExcerptChallengeType[]).map((type) => (
        <div key={type} className="mb-6">
          <h2 className="fantasy-title text-xs text-academy-gold/60 uppercase tracking-widest mb-3">{TYPE_LABELS[type]}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {byType[type].map((e) => (
              <button key={e.id} onClick={() => setSelected(e)}
                className="card-panel text-left hover:border-academy-gold/40 transition-all">
                <div className="text-academy-cream/80 text-xs font-fantasy leading-tight mb-1">{e.title}</div>
                <div className="text-academy-cream/30 text-[9px]">
                  {e.grade ? `Grade ${e.grade}` : ''}{e.composer ? ` · ${e.composer}` : ''} · ♩={e.bpm}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PracticeRun({ excerpt, character, onBack }: { excerpt: Excerpt; character: Character; onBack: () => void }) {
  const demoMode = useUiStore((s) => s.demoMode);
  const [bpm, setBpm] = useState(excerpt.bpm);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoHandle, setDemoHandle] = useState<ExcerptPlayback | null>(null);

  const seated = useMemo(() => seatExcerpt(excerpt, character.instrument), [excerpt, character.instrument]);
  const totalBeats = excerptBeats(excerpt);
  const beatsPerBar = excerpt.timeSig[0];

  const { phase, playhead, countLabel, tapCount, result, start, finalize, handlePitch, tap, reset } = usePerformanceRun({
    seated, bpm, beatsPerBar, totalBeats, noMic: demoMode,
    pitchToleranceCents: pitchToleranceCents(character.stats.accuracy),
    rhythmToleranceMs: rhythmToleranceMs(character.stats.technique),
  });
  const running = phase === 'countin' || phase === 'playing';

  async function toggleDemo() {
    if (demoPlaying) { demoHandle?.stop(); setDemoPlaying(false); return; }
    setDemoPlaying(true);
    const h = await playExcerpt(seated.notes, bpm, { withClick: true, beatsPerBar, onDone: () => setDemoPlaying(false) });
    setDemoHandle(h);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="fantasy-title text-lg text-academy-cream">{excerpt.title}</h2>
        <button onClick={onBack} className="text-academy-cream/40 hover:text-academy-cream/80 text-xs">← Selections</button>
      </div>
      <div className="text-academy-cream/40 text-xs mb-3">
        {character.instrument.replace('_', ' ')} · {excerpt.timeSig[0]}/{excerpt.timeSig[1]}
        {excerpt.grade ? ` · Grade ${excerpt.grade}` : ''}{excerpt.composer ? ` · ${excerpt.composer}` : ''}
      </div>

      <div className="mb-3">
        <PerformanceStaff
          seated={seated} timeSig={excerpt.timeSig} totalBeats={totalBeats}
          playheadBeat={running ? playhead : null}
          noteColors={phase === 'done' && result ? overlayColors(result) : undefined}
        />
      </div>

      {/* tempo */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-academy-cream/40 text-xs w-14">♩= {bpm}</span>
        <input type="range" min={40} max={168} value={bpm} disabled={running || demoPlaying}
          onChange={(e) => setBpm(Number(e.target.value))} className="flex-1" />
      </div>

      {phase !== 'done' && (
        <div className="flex gap-2 mb-2">
          <button onClick={toggleDemo} disabled={running} className="btn-secondary flex-1 text-sm">
            {demoPlaying ? '■ Stop' : '▶ Demonstration'}
          </button>
          {phase === 'ready' && (
            <button onClick={start} disabled={demoPlaying} className="btn-primary flex-1 text-sm">
              {demoMode ? 'Tap Along' : 'Perform'}
            </button>
          )}
        </div>
      )}

      {phase === 'countin' && (
        <div className="text-center py-3">
          <div className="text-academy-gold/60 text-xs uppercase tracking-widest font-fantasy mb-1">Count-in</div>
          <div className="font-fantasy text-4xl text-academy-gold">{Math.max(1, countLabel)}</div>
        </div>
      )}

      {phase === 'playing' && (
        demoMode ? (
          <button onPointerDown={tap} className="btn-primary w-full h-16 text-lg active:scale-95 transition-transform">
            TAP each note<div className="text-xs mt-0.5 opacity-60">{tapCount} · or press Space</div>
          </button>
        ) : (
          <MicrophoneListener mode="pitch" onPitchDetected={handlePitch} active />
        )
      )}

      {running && <button onClick={finalize} className="btn-secondary w-full mt-2 text-sm">Submit Early</button>}

      {phase === 'done' && result && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Stat label="Pitch" pct={result.pitchPct} />
            <Stat label="Rhythm" pct={result.rhythmPct} />
            <Stat label="Overall" pct={result.overallPct} highlight />
          </div>
          <p className="text-academy-cream/40 text-[11px] mb-3 text-center leading-relaxed">
            Note colour is your accuracy — <span style={{ color: 'rgb(34,139,34)' }}>green</span> on target,
            <span style={{ color: 'rgb(200,40,30)' }}> red</span> off.{demoMode && ' Tap mode scores rhythm only.'}
          </p>
          <button onClick={reset} className="btn-primary w-full">Play Again</button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, pct, highlight }: { label: string; pct: number | null; highlight?: boolean }) {
  const color = pct === null ? '#6b7280' : accuracyColor(pct / 100);
  return (
    <div className={`rounded-lg border p-2 text-center ${highlight ? 'border-academy-gold/40 bg-academy-gold/5' : 'border-academy-gold/15'}`}>
      <div className="text-academy-cream/40 text-[9px] uppercase tracking-widest mb-0.5">{label}</div>
      <div className="font-fantasy text-xl" style={{ color }}>{pct === null ? '—' : `${pct}%`}</div>
    </div>
  );
}
