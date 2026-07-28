import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getZone } from '../../lib/zones';
import { ENEMIES } from '../../lib/enemies';
import { getBossGearDrop } from '../../lib/gear';
import type { Rating, GearItem, Character } from '../../types/game';
import ChallengeModal from '../ChallengeModal';
import BattleScreen from '../BattleScreen';
import LiberationScene from '../LiberationScene';
import {
  ROOMS, ITEMS, roomsForZone, entryRoom, roomNeighbors, exitDirection,
  type RoomDef, type Hotspot, type Pickup, type Use,
} from '../../lib/world/rooms';
import {
  getCurrentRoom, setCurrentRoom, getVisitedRooms, markRoomVisited,
  getCarrying, setCarrying, getTaken, setTaken,
} from '../../lib/world/state';
import { npcsInRoom, npcInRoom, type PresentNpc } from '../../lib/world/npcs';
import {
  activityByKey, zoneRequired, countDone, type Activity, type ChallengeSpec,
} from '../../lib/world/content';

const DIR_ARROW: Record<string, string> = { north: '↑', south: '↓', east: '→', west: '←' };

export default function RoomView({ zoneId }: { zoneId: number }) {
  const navigate = useNavigate();
  const { character, awardChallenge, advanceZone, equipGear, addSummonPoints, recordStoryKeys } = useGameStore();

  const rooms = roomsForZone(zoneId);
  const [roomId, setRoomId] = useState<string>(() =>
    (character && getCurrentRoom(character.id, zoneId)) || entryRoom(zoneId) || '');
  const [visited, setVisited] = useState<string[]>(() => (character ? getVisitedRooms(character.id) : []));
  const [carrying, setCarry] = useState<string[]>(() => (character ? getCarrying(character.id) : []));
  const [taken, setTakenIds] = useState<string[]>(() => (character ? getTaken(character.id) : []));

  const [parser, setParser] = useState<string>('');
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

  // A saved room that isn't in this building (e.g. carried over from another
  // zone, or a room that was renamed) snaps back to the entry room.
  if (rooms.length > 0 && !rooms.some((r) => r.id === roomId)) {
    setRoomId(entryRoom(zoneId) ?? rooms[0].id);
  }
  const room = ROOMS[roomId];
  if (!room) return null;

  const zone = getZone(zoneId);
  const req = zoneRequired(zoneId);
  const reqDone = countDone(char, req);

  function travel(id: string) {
    setRoomId(id);
    setCurrentRoom(char.id, zoneId, id);
    setVisited(markRoomVisited(char.id, id));
    setParser('');
    setLastRating(null);
  }

  function say(text: string) { setParser(text); }

  function take(p: Pickup) {
    const nextCarry = carrying.includes(p.id) ? carrying : [...carrying, p.id];
    const nextTaken = taken.includes(p.id) ? taken : [...taken, p.id];
    setCarry(nextCarry); setCarrying(char.id, nextCarry);
    setTakenIds(nextTaken); setTaken(char.id, nextTaken);
    say(p.response);
  }

  function applyUse(u: Use) {
    if (!carrying.includes(u.needs)) { say(u.missing); return; }
    say(u.success);
    if (u.consume) {
      const next = carrying.filter((i) => i !== u.needs);
      setCarry(next); setCarrying(char.id, next);
    }
  }

  // A talk hotspot routes to the NPC when they actually have something to give
  // (a quest to offer, a recruitment scene); otherwise it prints its line.
  function onHotspot(h: Hotspot) {
    const pending = (h.npcIds ?? [])
      .map((id) => npcInRoom(room.id, id, char))
      .find((n): n is PresentNpc => !!n && n.hasAction);
    if (pending) { setTalk(pending); return; }
    say(h.response);
  }

  // ── activity handlers (same flow as the location map) ──
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
      // Boot Camp graduation advances 1→2 *in place*: the Academy is one
      // building, so stay put and let the Theory-wing content unlock here.
      if (drop) setGearDrop(drop);
      setLastRating(rating);
    } else {
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
  if (showShattering) return <ShatteringCutscene rating={shatterRating} onFinish={finishShattering} />;
  if (battle) {
    return (
      <BattleScreen character={char} enemies={battle.enemyKeys.map((k) => ENEMIES[k])} simulatorMode
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

  const npcs = npcsInRoom(room.id, char);
  const exits = roomNeighbors(room.id).map((id) => ({ id, dir: exitDirection(room.id, id), room: ROOMS[id] }))
    .filter((e) => !!e.room);
  const pickups = (room.pickups ?? []).filter((p) => !taken.includes(p.id));
  const uses = (room.uses ?? []).filter((u) => u.missing !== '' || carrying.includes(u.needs));
  const activities = (room.activityKeys ?? [])
    .map((k) => activityByKey(k))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <div className="min-h-screen pb-24">
      {/* header */}
      <div className="relative px-4 pt-6 pb-4" style={{ background: `linear-gradient(to bottom, ${room.tint}55, transparent)` }}>
        <button onClick={() => navigate('/hub')} className="text-academy-cream/40 hover:text-academy-cream/80 text-sm mb-3 flex items-center gap-1">← Hub</button>
        <div className="text-academy-gold/60 text-xs tracking-[0.4em] uppercase font-fantasy mb-1">
          Zone {zoneId} · Act {zone?.act} · {zone?.name}
        </div>
        {req.length > 0 && (
          <div className="mt-2 max-w-xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-academy-cream/50 font-fantasy">Required challenges</span>
              <span className="text-academy-gold">{reqDone} / {req.length}</span>
            </div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${(reqDone / req.length) * 100}%`, background: '#D4A017' }} /></div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* SCENE */}
        <div className="rounded-xl border border-academy-gold/25 overflow-hidden mb-4">
          <RoomArt room={room} />
          <div className="px-4 py-3" style={{ background: 'rgba(12,20,32,0.6)' }}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-academy-cream/90 font-fantasy text-lg">{room.name}</div>
              <div className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy">{room.tag}</div>
            </div>
            <p className="text-academy-cream/60 text-xs leading-relaxed mt-2">{room.desc}</p>
          </div>
        </div>

        {/* parser line */}
        {parser && (
          <div className="mb-4 rounded-lg border border-academy-gold/25 bg-black/30 px-3 py-2.5 flex items-start gap-2">
            <span className="text-academy-gold/70 text-xs font-mono flex-shrink-0">&gt;</span>
            <p className="text-academy-cream/80 text-xs leading-relaxed font-mono flex-1">{parser}</p>
            <button onClick={() => setParser('')} className="text-academy-cream/30 hover:text-academy-cream/70 text-xs flex-shrink-0">✕</button>
          </div>
        )}

        {/* carrying */}
        {carrying.length > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy">Carrying</span>
            {carrying.map((id) => (
              <span key={id} className="flex items-center gap-1 rounded-md border border-academy-gold/25 bg-black/25 px-2 py-0.5">
                <span className="text-sm">{ITEMS[id]?.icon ?? '❔'}</span>
                <span className="text-academy-cream/70 text-[10px]">{ITEMS[id]?.name ?? id}</span>
              </span>
            ))}
          </div>
        )}

        {/* present here */}
        {npcs.length > 0 && (
          <div className="card-panel mb-4">
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

        {lastRating && <div className="mb-4"><RatingBadge rating={lastRating} /></div>}

        {/* activities */}
        {activities.length > 0 && (
          <div className="card-panel mb-4 space-y-2">
            <div className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy">Here you can</div>
            {activities.map((a) => (
              <ActivityRow key={a.locationId + activityId(a.activity)} indexed={a} character={char}
                onChallenge={setChallenge} onGate={setGate} onBattle={setBattle} gateFailed={gateFailed} />
            ))}
          </div>
        )}

        {/* hotspots */}
        <div className="card-panel mb-4">
          <div className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy mb-2">Things you can do</div>
          <div className="flex flex-wrap gap-2">
            {room.hotspots.map((h) => (
              <button key={h.verb + h.object} onClick={() => onHotspot(h)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs text-left transition-colors ${
                  h.danger ? 'border-discord-crimson/50 text-discord-crimson/90 hover:border-discord-crimson'
                    : 'border-academy-gold/20 text-academy-cream/75 hover:border-academy-gold/55'}`}>
                <span className="font-fantasy text-academy-gold/80">{h.verb}</span> {h.object}
              </button>
            ))}
            {pickups.map((p) => (
              <button key={p.id} onClick={() => take(p)}
                className="rounded-lg border border-rating-excellent/40 px-2.5 py-1.5 text-xs text-left text-academy-cream/80 hover:border-rating-excellent transition-colors">
                <span className="font-fantasy text-rating-excellent/90">Take</span> {p.label} <span>{p.icon}</span>
              </button>
            ))}
            {uses.map((u) => (
              <button key={u.verb + u.object} onClick={() => applyUse(u)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs text-left transition-colors ${
                  carrying.includes(u.needs) ? 'border-rating-excellent/40 text-academy-cream/80 hover:border-rating-excellent'
                    : 'border-academy-gold/15 text-academy-cream/45 hover:border-academy-gold/35'}`}>
                <span className="font-fantasy text-academy-gold/80">{u.verb}</span> {u.object}
                {carrying.includes(u.needs) && <span className="ml-1">{ITEMS[u.needs]?.icon}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* exits */}
        <div className="card-panel mb-4">
          <div className="text-academy-gold/50 text-[10px] uppercase tracking-widest font-fantasy mb-2">Exits</div>
          <div className="grid grid-cols-2 gap-2">
            {exits.map((e) => (
              <button key={e.id} onClick={() => travel(e.id)}
                className="rounded-lg border border-academy-gold/20 px-3 py-2 text-left hover:border-academy-gold/60 transition-colors flex items-center gap-2">
                <span className="text-academy-gold/70 text-sm">{DIR_ARROW[e.dir] ?? '•'}</span>
                <span className="leading-tight min-w-0">
                  <span className="block text-academy-cream/40 text-[9px] uppercase tracking-widest font-fantasy">Head {e.dir}</span>
                  <span className="block text-academy-cream/85 text-xs truncate">{e.room.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* minimap */}
        <Minimap rooms={rooms} currentId={room.id} visited={visited} onTravel={travel} />
      </div>

      {gearDrop && <GearDropBanner item={gearDrop} onDismiss={() => {
        setGearDrop(null);
        if (gearThenHub) { setGearThenHub(false); navigate('/hub'); }
      }} />}
      {challenge && <ChallengeModal challenge={challenge} character={char} onComplete={onChallengeDone} onClose={() => setChallenge(null)} />}
      {gate && <ChallengeModal challenge={gate.challenge} character={char} onComplete={onGateDone} onClose={() => setGate(null)} />}
    </div>
  );
}

function activityId(a: Activity): string {
  return a.kind === 'challenge' ? a.challenge.id : a.kind === 'gate' ? a.challenge.id : a.id;
}

// Room art: /rooms/<zoneId>/<roomId>.webp when it exists, else the room emoji
// on its tint (same image-or-emoji fallback the intro uses).
function RoomArt({ room }: { room: RoomDef }) {
  const [failed, setFailed] = useState(false);
  const src = `/rooms/${room.zoneId}/${room.id}.webp`;
  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ aspectRatio: '16 / 9', background: `linear-gradient(160deg, ${room.tint}, #0c1420)` }}>
      {!failed ? (
        <img src={src} alt="" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="text-6xl" style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.6))' }}>{room.emoji}</span>
      )}
    </div>
  );
}

function Minimap({ rooms, currentId, visited, onTravel }: {
  rooms: RoomDef[]; currentId: string; visited: string[]; onTravel: (id: string) => void;
}) {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  return (
    <div className="rounded-xl border border-academy-gold/20 overflow-hidden mb-4"
      style={{ background: 'radial-gradient(ellipse at center, #14202e 0%, #0c1420 100%)' }}>
      <div className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {ROOM_EDGE_LINES(rooms).map((l) => (
            <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#D4A01744" strokeWidth={0.4} />
          ))}
        </svg>
        {rooms.map((r) => {
          const here = r.id === currentId;
          const seen = visited.includes(r.id);
          if (!byId.has(r.id)) return null;
          return (
            <button key={r.id} onClick={() => onTravel(r.id)} title={r.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
              style={{ left: `${r.map[0]}%`, top: `${r.map[1]}%` }}>
              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] transition-transform group-hover:scale-125"
                style={{
                  border: `1.5px solid ${here ? '#D4A017' : seen ? '#D4A017CC' : '#D4A01766'}`,
                  background: here ? '#D4A017' : seen ? 'rgba(212,160,23,0.25)' : 'rgba(0,0,0,0.6)',
                  boxShadow: here ? '0 0 10px #D4A017' : 'none',
                }} />
              <span className="text-[8px] font-fantasy whitespace-nowrap mt-0.5 px-1 rounded"
                style={{ color: here ? '#D4A017' : seen ? 'rgba(212,201,168,0.8)' : 'rgba(212,201,168,0.5)', background: 'rgba(12,20,32,0.85)' }}>
                {r.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ROOM_EDGE_LINES(rooms: RoomDef[]) {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const out: { key: string; x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const r of rooms) {
    for (const nId of roomNeighbors(r.id)) {
      if (r.id > nId) continue;              // draw each edge once
      const n = byId.get(nId);
      if (!n) continue;
      out.push({ key: `${r.id}-${nId}`, x1: r.map[0], y1: r.map[1], x2: n.map[0], y2: n.map[1] });
    }
  }
  return out;
}

function ActivityRow({ indexed, character: c, onChallenge, onGate, onBattle, gateFailed }: {
  indexed: { zoneId: number; locationId: string; activity: Activity };
  character: Character;
  onChallenge: (ch: ChallengeSpec) => void;
  onGate: (g: Extract<Activity, { kind: 'gate' }>) => void;
  onBattle: (b: Extract<Activity, { kind: 'battle' }>) => void;
  gateFailed: boolean;
}) {
  const a = indexed.activity;
  const done = (id: string) => c.completedChallenges.includes(id);
  // D2: one building, several zones. Content from a zone the player hasn't
  // reached shows locked in place rather than disappearing.
  const locked = indexed.zoneId > c.currentZone;
  const typeIcon: Record<string, string> = {
    technique_scale: '🎼', prepared_performance: '🎵', rhythm_performance: '🥁',
    aural_pitch_spy: '👂', aural_rhythm_echo: '🔊',
  };

  if (locked) {
    const title = a.kind === 'battle' ? a.name : a.challenge.title;
    return (
      <div className="w-full rounded-lg border border-academy-gold/10 py-2.5 px-3 flex items-center gap-3 opacity-45">
        <span className="text-lg">🔒</span>
        <span className="flex-1 min-w-0">
          <span className="block text-academy-cream/70 text-sm">{title}</span>
          <span className="block text-academy-cream/35 text-[10px]">Opens once you reach Zone {indexed.zoneId}</span>
        </span>
      </div>
    );
  }

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
    const ready = a.unlock ? a.unlock(c) : true;
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
  const d = done(a.winKey ?? a.challenge.id);
  const ready = a.unlock(c);
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
      text: 'The world goes grey in a heartbeat — the audience, the gold draining out of everything at once. Everyone touched by the world\'s music dulls where they stand. Everyone but you, and the graduates beside you.' },
    { emoji: '🎓', tone: '#FCD34D',
      text: '"The Renewal is broken." Headmaster Fennelio reaches you through the chaos, his voice failing. "The Maestros are lost, and the world will follow — unless the Score is made whole." He presses a travel case into your hands — your Journey gear. "You are the only ones left who can still play. Go — bring them—" And then the Academy\'s founder sinks to the boards, and does not rise.' },
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
