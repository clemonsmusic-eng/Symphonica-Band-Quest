import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import MicrophoneListener from '../MicrophoneListener';
import { INSTRUMENT_TUNING } from '../../lib/music/transposition';
import { freqToMidi, midiToPitchString } from '../../lib/music/staff';
import { Metronome, getAudioCtx, playReferenceTone } from '../../lib/music/audio';

// Fixed top-right practice tools: a chromatic Tuner and a Metronome. Available
// in-game (rendered by App); returns null until a character is loaded.
export default function TunerWidget() {
  const character = useGameStore((s) => s.character);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'tuner' | 'metro'>('tuner');
  if (!character) return null;

  return (
    <div className="fixed top-2 right-2 z-[60] print:hidden">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          title="Tuner & Metronome"
          className="w-10 h-10 rounded-full bg-academy-dark/90 border border-academy-gold/40 text-lg shadow-lg backdrop-blur-sm hover:border-academy-gold transition-colors"
        >
          🎯
        </button>
      ) : (
        <div className="w-64 bg-academy-dark/95 border border-academy-gold/40 rounded-xl shadow-2xl backdrop-blur-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              <TabBtn active={tab === 'tuner'} onClick={() => setTab('tuner')}>Tuner</TabBtn>
              <TabBtn active={tab === 'metro'} onClick={() => setTab('metro')}>Metronome</TabBtn>
            </div>
            <button onClick={() => setOpen(false)} className="text-academy-cream/40 hover:text-academy-cream/80 text-sm">✕</button>
          </div>
          {tab === 'tuner' ? <TunerPanel instrument={character.instrument} /> : <MetronomePanel />}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`text-[10px] uppercase tracking-widest font-fantasy px-2 py-1 rounded ${active ? 'text-academy-gold bg-academy-gold/10' : 'text-academy-cream/40 hover:text-academy-cream/70'}`}>
      {children}
    </button>
  );
}

// ── Tuner ─────────────────────────────────────────────────────────────────────
function TunerPanel({ instrument }: { instrument: keyof typeof INSTRUMENT_TUNING }) {
  const [reading, setReading] = useState<{ note: string; cents: number; freq: number } | null>(null);
  const [written, setWritten] = useState(false);
  const transpose = INSTRUMENT_TUNING[instrument].transpose;

  function onPitch(freq: number, cents: number, note: string) {
    setReading({ note, cents, freq });
  }

  const cents = reading?.cents ?? 0;
  const inTune = reading ? Math.abs(cents) <= 5 : false;
  const noteName = reading
    ? (written ? midiToPitchString(Math.round(freqToMidi(reading.freq)) + transpose) : reading.note)
    : '—';
  const color = !reading ? '#6b7280' : inTune ? '#22c55e' : Math.abs(cents) < 20 ? '#eab308' : '#ef4444';

  return (
    <div className="text-center">
      <div className="font-fantasy text-4xl mb-0.5" style={{ color }}>{noteName}</div>
      <div className="text-academy-cream/50 text-xs mb-2">
        {reading ? `${cents > 0 ? '+' : ''}${cents}¢ ${inTune ? '· in tune' : cents > 0 ? '· sharp' : '· flat'}` : 'play a note…'}
      </div>
      {/* cents meter */}
      <div className="relative h-8 mb-2 rounded bg-black/40 border border-academy-gold/20 overflow-hidden">
        <div className="absolute top-0 bottom-0" style={{ left: 'calc(50% - 1px)', width: 2, background: 'rgba(212,160,23,0.6)' }} />
        <div className="absolute top-1 bottom-1 rounded" style={{
          left: '50%', width: 4, marginLeft: -2,
          transform: `translateX(${Math.max(-120, Math.min(120, cents)) * 1.0}%)`,
          background: color, boxShadow: `0 0 8px ${color}`, transition: 'transform 80ms linear',
        }} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1 text-[10px] text-academy-cream/50">
          <input type="checkbox" checked={written} onChange={(e) => setWritten(e.target.checked)} />
          {written ? 'my part' : 'concert'}
        </label>
        <button onClick={() => playReferenceTone(69)} className="text-[10px] text-academy-cream/60 hover:text-academy-gold">🔊 A 440</button>
      </div>
      <div className="mt-2">
        <MicrophoneListener mode="pitch" onPitchDetected={onPitch} active />
      </div>
    </div>
  );
}

// ── Metronome ─────────────────────────────────────────────────────────────────
function MetronomePanel() {
  const [bpm, setBpm] = useState(96);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const metroRef = useRef<Metronome | null>(null);
  const rafRef = useRef(0);

  async function toggle() {
    if (running) {
      metroRef.current?.stop();
      cancelAnimationFrame(rafRef.current);
      setRunning(false);
      setBeat(-1);
      return;
    }
    const ac = await getAudioCtx();
    const m = new Metronome(ac);
    metroRef.current = m;
    m.start({ bpm, beatsPerBar });
    setRunning(true);
    const tick = () => {
      const b = Math.floor(m.beatsElapsed());
      setBeat(((b % beatsPerBar) + beatsPerBar) % beatsPerBar);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => { metroRef.current?.stop(); cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div className="text-center">
      <div className="font-fantasy text-3xl text-academy-gold mb-1">{bpm}</div>
      <div className="text-academy-cream/40 text-[10px] mb-2">BPM</div>
      <input type="range" min={40} max={208} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full mb-3" />
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span key={i} className="w-3 h-3 rounded-full transition-all" style={{
            background: running && beat === i ? (i === 0 ? '#FFD700' : 'rgba(255,215,0,0.7)') : 'rgba(255,255,255,0.15)',
            transform: running && beat === i ? 'scale(1.3)' : 'scale(1)',
          }} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <select value={beatsPerBar} onChange={(e) => setBeatsPerBar(Number(e.target.value))} disabled={running}
          className="bg-black/30 border border-academy-gold/20 rounded text-xs text-academy-cream/70 px-1.5 py-1">
          {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}/4</option>)}
        </select>
        <button onClick={toggle} className={`flex-1 text-xs py-1.5 rounded font-fantasy ${running ? 'btn-secondary' : 'btn-primary'}`}>
          {running ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
}
