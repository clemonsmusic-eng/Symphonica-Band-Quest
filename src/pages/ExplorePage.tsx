import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getZone } from '../lib/zones';
import { getLocation } from '../lib/locations';
import { ENEMIES } from '../lib/enemies';
import { getBossGearDrop } from '../lib/gear';
import type { Rating, GearItem } from '../types/game';
import ChallengeModal from '../components/ChallengeModal';
import BattleScreen from '../components/BattleScreen';
import LiberationScene from '../components/LiberationScene';
import { MAP_NODES, zoneLocations, entryLocation, isLocationBasedZone } from '../lib/world/worldMap';
import { getCurrentLocation, setCurrentLocation } from '../lib/world/state';
import { npcsAt, type PresentNpc } from '../lib/world/npcs';
import { locationActivities, zoneRequired, countDone, type Activity, type ChallengeSpec } from '../lib/world/content';

const ACT_COLOR: Record<number, string> = { 1: '#D4A017', 2: '#60A5FA', 3: '#F87171' };

export default function ExplorePage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const { character, awardChallenge, advanceZone, equipGear, addSummonPoints, recordStoryKeys } = useGameStore();

  const zid = parseInt(zoneId ?? '1', 10);

  const [locId, setLocId] = useState<string>(() =>
    (character && getCurrentLocation(character.id)) || entryLocation(zid) || '');
  const [challenge, setChallenge] = useState<ChallengeSpec | null>(null);
  const [gate, setGate] = useState<Extract<Activity, { kind: 'gate' }> | null>(null);
  const [battle, setBattle] = useState<Extract<Activity, { kind: 'battle' }> | null>(null);
  const [talk, setTalk] = useState<PresentNpc | null>(null);
  const [lastRating, setLastRating] = useState<Rating | null>(null);
  const [gateFailed, setGateFailed] = useState(false);
  const [gearDrop, setGearDrop] = useState<GearItem | null>(null);
  const [gearThenHub, setGearThenHub] = useState(false);
  const [showShattering, setShowShattering] = useState(false);
  const [shatterRating, setShatterRating] = useState<Rating>('good');
  const [pendingGear, setPendingGear] = useState<GearItem | null>(null);

  if (!character) return null;
  const char = character;
  if (zid > character.currentZone || !isLocationBasedZone(zid)) { navigate('/hub'); return null; }

  const zone = getZone(zid);
  const locs = zoneLocations(zid);
  if (!locId && locs[0]) setLocId(locs[0].id);
  const node = MAP_NODES[locId];
  const location = getLocation(locId);
  const color = ACT_COLOR[zone?.act ?? 1];

  function travel(id: string) {
    setLocId(id);
    setCurrentLocation(char.id, id);
    setLastRating(null);
  }

  // ── activity handlers (mirror the legacy zone pages) ──
  async function onChallengeDone(rating: Rating, score: number) {
    if (!challenge) return;
    await awardChallenge(challenge.id, challenge.type, score, rating);
    setLastRating(rating);
    setChallenge(null);
  }
  async function onGateDone(rating: Rating, score: number) {
    if (!gate) return;
    const g = gate;
    const passed = rating === 'good' || rating === 'excellent' || rating === 'superior';
    const awardType = g.awardType ?? g.challenge.type;
    setGate(null);
    if (!passed) {
      // Attempt XP without marking the gate complete.
      await awardChallenge(g.challenge.id, awardType, score, rating, { trackCompletion: false });
      setGateFailed(true);
      return;
    }
    const winKey = g.winKey ?? g.challenge.id;
    await awardChallenge(winKey, awardType, score, rating);
    const drop = getBossGearDrop(g.gearKey ?? winKey, char);
    if (drop) await equipGear(drop);
    if (g.advanceTo) await advanceZone(g.advanceTo as Parameters<typeof advanceZone>[0]);

    if (g.climax === 'shatter') {
      setPendingGear(drop);
      setShatterRating(rating);
      setShowShattering(true);
    } else if (g.advanceTo) {
      // Advancing gate: show any gear, then return to the Hub on dismiss.
      if (drop) { setGearDrop(drop); setGearThenHub(true); } else navigate('/hub');
    } else {
      // Non-advancing win gate (e.g. contest semifinal): stay and unlock next.
      if (drop) setGearDrop(drop);
      setLastRating(rating);
    }
  }

  function finishShattering() {
    setShowShattering(false);
    if (pendingGear) { setGearDrop(pendingGear); setPendingGear(null); setGearThenHub(true); }
    else navigate('/hub');
  }
  async function onBattleWin(_rp: number, spDelta: number) {
    if (!battle) return;
    await awardChallenge(battle.doneKey, battle.awardType, 100, 'superior');
    const drop = getBossGearDrop(battle.doneKey, char);
    if (drop) { await equipGear(drop); setGearDrop(drop); }
    if (spDelta !== 0) await addSummonPoints(spDelta);
    setBattle(null);
  }

  // ── full-screen sub-views ──
  if (showShattering) {
    return <ShatteringCutscene rating={shatterRating} onFinish={finishShattering} />;
  }
  if (battle) {
    return (
      <BattleScreen character={character} enemies={battle.enemyKeys.map((k) => ENEMIES[k])} simulatorMode
        onVictory={onBattleWin} onDefeat={() => setBattle(null)} />
    );
  }
  if (talk) {
    const res = talk.talk(char);
    return (
      <LiberationScene title={res.title} beats={res.beats} doneLabel="Done"
        onDone={() => { if (res.doneKeys.length) recordStoryKeys(res.doneKeys); setTalk(null); }} />
    );
  }

  const activities = locationActivities(zid, locId);
  const npcs = npcsAt(locId, character);
  const req = zoneRequired(zid);
  const reqDone = countDone(character, req);

  return (
    <div className="min-h-screen pb-24">
      {/* header */}
      <div className="relative px-4 pt-6 pb-4" style={{ background: `linear-gradient(to bottom, ${color}18, transparent)` }}>
        <button onClick={() => navigate('/hub')} className="text-academy-cream/40 hover:text-academy-cream/80 text-sm mb-3 flex items-center gap-1">← Hub</button>
        <div className="text-academy-gold/60 text-xs tracking-[0.4em] uppercase font-fantasy mb-1">
          Zone {zid} · Act {zone?.act} · {zone?.name}
        </div>
        {req.length > 0 && (
          <div className="mt-2 max-w-xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-academy-cream/50 font-fantasy">Required challenges</span>
              <span className="text-academy-gold">{reqDone} / {req.length}</span>
            </div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(reqDone / req.length) * 100}%`, background: color }} /></div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* MAP */}
        <div className="relative w-full rounded-xl border border-academy-gold/20 overflow-hidden mb-4"
          style={{ aspectRatio: '16 / 9', background: 'radial-gradient(ellipse at center, #14202e 0%, #0c1420 100%)' }}>
          {/* connectors */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {locs.slice(1).map((l, i) => {
              const a = MAP_NODES[locs[i].id]; const b = MAP_NODES[l.id];
              return <line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={`${color}55`} strokeWidth={0.5} strokeDasharray="2 2" />;
            })}
          </svg>
          {/* nodes */}
          {locs.map((l) => {
            const n = MAP_NODES[l.id];
            const here = l.id === locId;
            return (
              <button key={l.id} onClick={() => travel(l.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-110"
                  style={{ border: `2px solid ${color}`, background: here ? color : 'rgba(0,0,0,0.55)', color: here ? '#0c1420' : color, boxShadow: here ? `0 0 12px ${color}` : 'none' }}>
                  {here ? '◆' : '○'}
                </span>
                <span className="text-[10px] font-fantasy px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{ color: here ? color : 'rgba(212,201,168,0.6)', background: 'rgba(12,20,32,0.7)' }}>{l.name}</span>
              </button>
            );
          })}
          {/* avatar marker */}
          {node && (
            <div className="absolute -translate-x-1/2 pointer-events-none" style={{ left: `${node.x}%`, top: `${node.y - 9}%` }}>
              <div className="text-lg" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>🧑‍🎤</div>
            </div>
          )}
        </div>

        {/* SCENE PANEL */}
        <div className="card-panel mb-4">
          <div className="text-academy-cream/90 font-fantasy text-lg mb-1">{location?.name}</div>
          <p className="text-academy-cream/55 text-xs italic leading-relaxed mb-3">{node?.blurb}</p>

          {/* who's present */}
          {npcs.length > 0 && (
            <div className="mb-3">
              <div className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy mb-1.5">Present here</div>
              <div className="flex flex-wrap gap-2">
                {npcs.map((n) => (
                  <button key={n.id} onClick={() => setTalk(n)}
                    className="flex items-center gap-1.5 rounded-lg border border-academy-gold/25 bg-black/20 px-2 py-1 hover:border-academy-gold/60 transition-colors">
                    <span className="text-base">{n.emoji}</span>
                    <span className="text-left leading-tight">
                      <span className="block text-academy-cream/85 text-xs font-fantasy">{n.name}</span>
                      {n.role && <span className="block text-academy-cream/35 text-[9px]">{n.role}</span>}
                    </span>
                    {n.hasAction && <span className="text-academy-gold text-xs ml-0.5">❗</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {lastRating && <div className="mb-3"><RatingBadge rating={lastRating} /></div>}

          {/* activities */}
          {activities.length > 0 ? (
            <div className="space-y-2">
              <div className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy">Here you can</div>
              {activities.map((a) => <ActivityRow key={activityKey(a)} activity={a} character={char}
                onChallenge={setChallenge} onGate={setGate} onBattle={setBattle} gateFailed={gateFailed} />)}
            </div>
          ) : (
            <div className="text-academy-cream/30 text-xs italic">Nothing to do here right now — try another location.</div>
          )}
        </div>
      </div>

      {gearDrop && <GearDropBanner item={gearDrop} onDismiss={() => {
        setGearDrop(null);
        if (gearThenHub) { setGearThenHub(false); navigate('/hub'); }
      }} />}
      {challenge && <ChallengeModal challenge={challenge} character={character} onComplete={onChallengeDone} onClose={() => setChallenge(null)} />}
      {gate && <ChallengeModal challenge={gate.challenge} character={character} onComplete={onGateDone} onClose={() => setGate(null)} />}
    </div>
  );
}

function activityKey(a: Activity): string {
  return a.kind === 'challenge' ? a.challenge.id : a.kind === 'gate' ? a.challenge.id : a.id;
}

function ActivityRow({ activity: a, character: c, onChallenge, onGate, onBattle, gateFailed }: {
  activity: Activity; character: { completedChallenges: string[] };
  onChallenge: (ch: ChallengeSpec) => void;
  onGate: (g: Extract<Activity, { kind: 'gate' }>) => void;
  onBattle: (b: Extract<Activity, { kind: 'battle' }>) => void;
  gateFailed: boolean;
}) {
  const done = (id: string) => c.completedChallenges.includes(id);
  const typeIcon: Record<string, string> = {
    technique_scale: '🎼', prepared_performance: '🎵', rhythm_performance: '🥁',
    aural_pitch_spy: '👂', aural_rhythm_echo: '🔊',
  };

  if (a.kind === 'challenge') {
    const d = done(a.challenge.id);
    return (
      <button onClick={() => !d && onChallenge(a.challenge)}
        className={`w-full rounded-lg border border-academy-gold/15 py-2.5 px-3 flex items-center gap-3 text-left transition-all ${d ? 'opacity-55' : 'hover:border-academy-gold/40'}`}>
        <span className="text-lg">{typeIcon[a.challenge.type] ?? '🎵'}</span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-academy-cream/85 text-sm">{a.challenge.title}</span>
            {a.challenge.required === false && <span className="text-[9px] px-1 py-0.5 bg-academy-gold/10 text-academy-gold/60 rounded">Optional</span>}
          </span>
          <span className="block text-academy-cream/35 text-[10px]">{a.challenge.uilStandard}</span>
        </span>
        <span className="text-xs flex-shrink-0">{d ? <span className="text-rating-superior">✓</span> : <span className="text-academy-gold/60">→</span>}</span>
      </button>
    );
  }
  if (a.kind === 'battle') {
    const d = done(a.doneKey);
    const ready = a.unlock ? a.unlock(c as never) : true;
    if (!ready && !d && a.hideUntilReady) return null;
    return (
      <div className={`w-full rounded-lg border py-2.5 px-3 flex items-center gap-3 ${ready ? 'border-discord-crimson/40' : 'border-academy-gold/15 opacity-60'}`}>
        <span className="text-lg">{a.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-academy-cream/85 text-sm">{a.name}</span>
          <span className="block text-academy-cream/40 text-[10px]">{a.desc}{!ready && a.lockedNote ? ` (${a.lockedNote})` : ''}</span>
        </span>
        {d ? <span className="text-rating-superior text-sm">✓</span> :
          ready ? <button onClick={() => onBattle(a)} className="btn-danger text-xs py-1.5 px-3 flex-shrink-0">Fight</button> : null}
      </div>
    );
  }
  // gate
  const d = done(a.winKey ?? a.challenge.id);
  const ready = a.unlock(c as never);
  if (!ready && !d) return null;
  return (
    <div className="w-full rounded-lg border border-academy-gold/40 py-2.5 px-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{a.icon ?? '🎓'}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-academy-cream/85 text-sm">{a.challenge.title}</span>
          <span className="block text-academy-cream/40 text-[10px]">{a.challenge.description}</span>
          {gateFailed && !d && <span className="block text-rating-poor text-[10px] mt-0.5">Not quite ready — keep practicing and try again.</span>}
        </span>
        {d ? <span className="text-rating-superior text-sm">✓</span> :
          <button onClick={() => onGate(a)} className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">{a.label}</button>}
      </div>
    </div>
  );
}

function GearDropBanner({ item, onDismiss }: { item: GearItem; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-6">
      <div className="card-panel w-full max-w-sm border-rating-excellent/60">
        <div className="text-[10px] text-rating-excellent uppercase tracking-widest font-fantasy mb-2">⚔️ Gear Acquired</div>
        <div className="text-academy-cream/90 font-fantasy text-base mb-0.5">{item.name}</div>
        <div className="text-academy-cream/50 text-xs italic mb-3">{item.fantasyName}</div>
        <button onClick={onDismiss} className="btn-primary w-full text-sm py-2">Equip →</button>
      </div>
    </div>
  );
}

function RatingBadge({ rating }: { rating: Rating }) {
  const c: Record<Rating, string> = { superior: '#FFD700', excellent: '#4ADE80', good: '#60A5FA', fair: '#FB923C', poor: '#F87171' };
  return <div className="text-center font-fantasy text-2xl font-black tracking-widest" style={{ color: c[rating], textShadow: `0 0 20px ${c[rating]}60` }}>{rating.toUpperCase()}</div>;
}

// ── The Renewal → the Shattering (Act 1 climax) ─────────────────────────────
function ShatteringCutscene({ rating, onFinish }: { rating: Rating; onFinish: () => void }) {
  const ratingLine: Record<Rating, string> = {
    superior: 'It is flawless — the kind of playing the Maestros themselves pause to hear.',
    excellent: 'It is beautiful, and the whole hall knows it.',
    good: 'It is honest and true, and that is more than enough.',
    fair: 'It wavers, but it holds — and it is yours.',
    poor: 'It is rough, but you finish it, and that is what counts tonight.',
  };

  const beats: { emoji: string; tone: string; text: string }[] = [
    { emoji: '🎓', tone: '#FFD700',
      text: `The last note of your performance fades. ${ratingLine[rating]} The Grand Auditorium rises to its feet, and for one shining moment the whole world is exactly as it should be.` },
    { emoji: '🎼', tone: '#FFD700',
      text: 'Then the hall falls silent — reverent — for the Renewal. Every Maestro who ever taught you takes the stage: your professors, the ten section leaders of the Grand Symphony. Vexus, the Conductor, lifts his baton.' },
    { emoji: '⚠️', tone: '#FB923C',
      text: "But the notes are wrong. Tritones bloom where nothing should grow. Your teachers' hands falter; their faces tighten. They try to play what Vexus conducts — and the harmony curdles in the air." },
    { emoji: '💥', tone: '#F87171',
      text: 'The sound climbs, and climbs, with nowhere to resolve — until the Grand Symphony Score shatters. Light bursts from the stage. Ten shards streak out and strike your ten professors, and they change before your eyes.' },
    { emoji: '🌫️', tone: '#94A3B8',
      text: 'The world goes grey in a heartbeat — the audience, the faculty, the gold draining out of everything at once. Everyone touched by the world\'s music dulls where they stand. Everyone but you, and the graduates beside you.' },
    { emoji: '🎓', tone: '#FCD34D',
      text: '"The Renewal is broken." Headmaster Fennelio reaches you through the chaos, his voice thin. "The Maestros are lost, and the world will follow unless the Score is made whole." He presses a travel case into your hands — your Journey gear. "You are the only ones left who can still play. Go. Bring them back."' },
  ];

  const [step, setStep] = useState(0);
  const last = step === beats.length - 1;
  const b = beats[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-black/40">
      <div className="text-6xl mb-6" style={{ filter: `drop-shadow(0 0 24px ${b.tone}80)` }}>{b.emoji}</div>
      <div className="card-panel max-w-md w-full mb-8" style={{ borderColor: `${b.tone}55` }}>
        <p className="text-academy-cream/85 text-sm leading-relaxed">{b.text}</p>
      </div>
      <div className="flex items-center gap-3">
        {beats.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-academy-gold' : 'w-1.5 bg-academy-cream/20'}`} />
        ))}
      </div>
      <button onClick={() => (last ? onFinish() : setStep(step + 1))} className="btn-primary mt-8">
        {last ? 'Set out — to the Melodious Meadows →' : 'Continue'}
      </button>
    </div>
  );
}
