import type { Character } from '../../types/game';
import type { LibBeat } from '../../components/LiberationScene';
import { SIDE_QUEST_BY_ID, npcOfferKey } from '../../lib/sidequests';
import {
  STUDENTS, CAMEOS, metKey, cameoKey, recruitmentDue, hasMet, cameoDue, hasSeenCameo,
} from '../../lib/students';
import { getInstrumentEmoji } from '../../lib/instruments';
import { STUDENT_PORTRAITS, MAESTRO_PORTRAITS, ENEMY_PORTRAITS } from '../../lib/portraits';
import { STUDENT_BY_ID } from '../../lib/students';

export type NpcKind = 'story' | 'questgiver' | 'classmate' | 'cameo';

// What a talk resolves to: dialogue beats + story keys to record when it ends.
export interface TalkResult { title: string; beats: LibBeat[]; doneKeys: string[] }

// A person currently on the map at a location. `talk()` produces the dialogue
// and any keys to persist (quest offered, classmate met, cameo seen).
export interface PresentNpc {
  id: string;
  name: string;
  emoji: string;
  role?: string;
  portrait?: string;
  kind: NpcKind;
  hasAction: boolean;   // shows a ❗ (quest to accept / classmate to meet)
  talk: (c: Character) => TalkResult;
}

// ── Static NPCs (advisors + quest-givers) ────────────────────────────────────
interface StaticNpc {
  id: string; name: string; emoji: string; role?: string; portrait?: string;
  locationId: string; kind: 'story' | 'questgiver';
  roomId?: string;      // room-level placement (rooms.ts); location-only NPCs omit it
  present: (c: Character) => boolean;
  flavor?: string;
  offerQuests?: string[];
}

const STATIC_NPCS: StaticNpc[] = [
  // ── Harmonia Academy (Zones 1–2) ──
  // Per the canon overhaul, the ten Maestros are the Academy's entire faculty
  // and Vexus teaches theory and conducting — there are no other professors.
  { id: 'fennelio', name: 'Director Fennelio', emoji: '🎓', role: 'Headmaster', locationId: 'rehearsal_halls', roomId: 'headmaster_office', kind: 'story', present: () => true,
    flavor: '"Master your fundamentals and pass your first performance," Fennelio says, "and I will call you a student of this Academy in truth. I will be waiting when you are ready to graduate Boot Camp."' },
  { id: 'vexus', name: 'Vexus', emoji: '🖋️', role: 'Theory & conducting', portrait: ENEMY_PORTRAITS.vexus, locationId: 'rehearsal_halls', roomId: 'vexus_office', kind: 'story', present: () => true,
    flavor: 'The Conductor does not look up from the pages. "Beautiful," he murmurs, "but timid. The Composer left so much unresolved."' },
  { id: 'reeda', name: 'Reeda', emoji: '🧹', role: 'Hall custodian', locationId: 'practice_rooms', roomId: 'practice_rooms', kind: 'questgiver', present: () => true, offerQuests: ['sq_z1_squeaky_reed'] },
  { id: 'tick', name: 'Tick', emoji: '⏱️', role: 'Keeper of metronomes', locationId: 'practice_rooms', roomId: 'practice_rooms', kind: 'questgiver', present: () => true, offerQuests: ['sq_z1_metronome'] },
  { id: 'piccola', name: 'Piccola', emoji: '😰', role: 'Nervous first-year', locationId: 'theory_wing', roomId: 'theory_classroom', kind: 'questgiver', present: () => true, offerQuests: ['sq_z2_stage_fright'] },
  { id: 'dr_sol', name: 'Dr. Sol', emoji: '📚', role: 'Theory librarian', locationId: 'theory_stacks', roomId: 'library', kind: 'questgiver', present: () => true, offerQuests: ['sq_z2_misfiled_interval'] },

  // The ten Maestros, in their own studios (rooms only — they share the
  // rehearsal_halls / library_stacks clusters, so location-level placement
  // cannot tell them apart).
  { id: 'flaura', name: 'Maestra Flaura', emoji: '🪈', role: 'Flute maestro', portrait: MAESTRO_PORTRAITS.syrinx, locationId: 'rehearsal_halls', roomId: 'clinic', kind: 'story', present: () => true,
    flavor: '"Breath is breath," the flute maestro says, "whether you\'re playing or healing. More students in lately, though — just tired. Grey around the edges."' },
  { id: 'hautbois', name: 'Maestro Hautbois', emoji: '🎶', role: 'Oboe maestro', portrait: MAESTRO_PORTRAITS.hautbois, locationId: 'rehearsal_halls', roomId: 'temple_of_sound', kind: 'story', present: () => true,
    flavor: '"Everyone tunes to the oboe," the maestro says softly. "Not from pride — a double reed cannot retune mid-phrase. We simply have to be right the first time."' },
  { id: 'fagotto', name: 'Maestro Fagotto', emoji: '📚', role: 'Bassoon maestro', portrait: MAESTRO_PORTRAITS.bassanello, locationId: 'library_stacks', roomId: 'library', kind: 'story', present: () => true,
    flavor: 'The bassoon maestro barely looks up. "The oldest music is the truest. Mind the sealed archive — some of it should stay shut."' },
  { id: 'clarence', name: 'Maestro Clarence', emoji: '🎷', role: 'Clarinet maestro', portrait: MAESTRO_PORTRAITS.chalumeau, locationId: 'rehearsal_halls', roomId: 'single_reed_sanctum', kind: 'story', present: () => true,
    flavor: 'Clarence sights down a fresh reed and — with a flick of the wrist — buries it in the target beside a dozen others. "A single reed, a single breath, a single wrong note the whole hall hears," he says mildly. "So we get it right."' },
  { id: 'adolpha', name: 'Maestra Adolpha', emoji: '🎷', role: 'Saxophone maestro', portrait: MAESTRO_PORTRAITS.vela, locationId: 'rehearsal_halls', roomId: 'single_reed_sanctum', kind: 'story', present: () => true,
    flavor: 'Without pausing, Adolpha runs a dominant-7th arpeggio through all twelve keys, then modal scales, at a tempo that should not be physically possible. "Rules first," she says between breaths. "Then you learn which to bend. You\'re not there yet."' },
  { id: 'cornelius', name: 'Cornelius', emoji: '🎺', role: 'Trumpet maestro', portrait: MAESTRO_PORTRAITS.salpinx, locationId: 'rehearsal_halls', roomId: 'brassatorium', kind: 'story', present: () => true,
    flavor: '"Trumpet gets the glory, but a brass choir is the real thing," he says, still scribbling. "Four parts breathing as one. Here — tell me if this fanfare lands."' },
  { id: 'waldhorn', name: 'Maestro Waldhorn', emoji: '📯', role: 'French horn maestro', portrait: MAESTRO_PORTRAITS.waldhorn, locationId: 'rehearsal_halls', roomId: 'garden', kind: 'story', present: () => true,
    flavor: '"I do my best listening out here," the horn maestro says. "A horn is mostly waiting for the right moment to speak. So is a garden."' },
  { id: 'sackbut', name: 'Sackbut', emoji: '🎺', role: 'Trombone maestro', portrait: MAESTRO_PORTRAITS.posaune, locationId: 'rehearsal_halls', roomId: 'recital_hall', kind: 'story', present: () => true,
    flavor: 'Sackbut holds one enormous low note, face reddening, eyes locked on Torbult. He does not appear willing to breathe first, or at all.' },
  { id: 'torbult', name: 'Torbult', emoji: '🎵', role: 'Tuba maestro', portrait: MAESTRO_PORTRAITS.cantora, locationId: 'rehearsal_halls', roomId: 'recital_hall', kind: 'story', present: () => true,
    flavor: 'Torbult matches Sackbut note for note, one eyebrow raised, entirely serene. Nobody remembers who started this, and nobody dares interrupt.' },
  { id: 'paige', name: 'Maestra Paige', emoji: '🥁', role: 'Percussion maestro', portrait: MAESTRO_PORTRAITS.percival, locationId: 'rehearsal_halls', roomId: 'paige_workshop', kind: 'story', present: () => true,
    flavor: '"Percussion\'s just engineering you can dance to," she grins. "Bring me broken gear someday and I\'ll make it sing."' },
  // Zone 3
  { id: 'valeria', name: 'Valeria Croft', emoji: '👩‍🎓', role: 'Academy chaperone', locationId: 'concerta', kind: 'story', present: () => true,
    flavor: 'Valeria Croft finds you at the staging tent and straightens your collar. "Nervous? Good," she says. "Channel it. Four schools, one trophy — Choral College, Piano Preparatory, The String School, and us. Now go show them what the Academy can do."' },
  { id: 'bellamy', name: 'Bellamy', emoji: '🎩', role: 'Concerta street busker', locationId: 'concerta', kind: 'questgiver', present: () => true, offerQuests: ['sq_z3_busker'] },
  { id: 'coda_vendor', name: 'Coda', emoji: '🥨', role: 'Festival food vendor', locationId: 'concerta', kind: 'questgiver', present: () => true, offerQuests: ['sq_z3_vendor_fanfare'] },
  // Zone 4
  { id: 'fennelio_grad', name: 'Headmaster Fennelio', emoji: '🎓', role: 'Headmaster', locationId: 'backstage', kind: 'story', present: () => true,
    flavor: 'Fennelio finds you backstage, straightening his collar and grinning despite himself. "One performance stands between you and the rest of your life," he says. "Play it for yourselves. And then stay — watch the Maestros give the Renewal. You\'ve earned your seat for it. It\'s the most beautiful thing you\'ll ever hear."' },
  { id: 'rustle', name: 'Rustle', emoji: '🎭', role: 'Auditorium stagehand', locationId: 'backstage', kind: 'questgiver', present: () => true, offerQuests: ['sq_z4_tune_the_hall'] },
];

// Where classmates and cameos appear on the map.
const STUDENT_LOCATION: Record<string, string> = {
  piper: 'theory_wing', reed: 'theory_stacks',
  tommy: 'concerta', benny: 'concerta', miles: 'concerta', gene: 'concerta',
  otto: 'backstage', zoot: 'backstage',
};
// Room-level placement for the Academy. Classmates are *always* in their room —
// they only become recruitable at their story beat, so before that a talk
// returns the room flavor below instead of the recruitment scene.
const STUDENT_ROOM: Record<string, string> = {
  piper: 'courtyard', cora: 'courtyard', obie: 'reflecting_pond',
  tommy: 'dining_hall', otto: 'dining_hall', gene: 'dormitory',
  reed: 'library', zoot: 'listening_room', benny: 'practice_rooms',
};
const STUDENT_ROOM_FLAVOR: Record<string, string> = {
  piper: '"All of it," Piper breathes, eyes on the statue. "The whole world, from one person\'s music."',
  cora: 'Cora only nods at the statue, lost in the beauty of the thing.',
  obie: '"Reflective mood," Obie admits, watching the koi — then breaks into a grin. "Cheerful one, though. Someone has to give the world its tuning A."',
  tommy: '"Are we late for lunch," Tommy wonders through a mouthful, "or early for dinner?"',
  otto: 'Otto shrugs, unbothered, and keeps eating. Nobody has ever seen this hall without the two of them in it.',
  gene: 'Gene is tinkering with a handful of auxiliary instruments — a woodblock, finger cymbals, a kazoo of dubious legality. "Making a few things to show Paige," he says without looking up. "She\'s the only one who gets it."',
  reed: 'Reed doesn\'t look up from his stack. "Did you know the first Renewal was six hundred years ago?" he says, three spare reeds behind one ear. "I\'m only up to the second. The whole history of Symphonica is in here."',
  zoot: 'Zoot lifts one headphone. "You can\'t know you\'re improvising something new," he says, "unless you know what\'s come before." He nods at the racks of old recordings. "So I\'m doing my homework."',
  benny: 'Benny is running one clarinet passage on a loop, a hair faster each time, grinning the whole way. "Almost got it," he says — and doesn\'t stop.',
};

const CAMEO_LOCATION: Record<string, string> = { gene_hall: 'theory_wing', gene_contest: 'concerta' };
const CAMEO_NAME: Record<string, string> = { gene_hall: 'A bored drummer', gene_contest: 'A contest drummer' };

function questReady(npc: StaticNpc, c: Character): boolean {
  return (npc.offerQuests ?? []).some((qid) => !c.completedQuests.includes(qid) && !c.completedChallenges.includes(npcOfferKey(qid)));
}

function staticTalk(npc: StaticNpc, c: Character): TalkResult {
  const beats: LibBeat[] = [];
  const doneKeys: string[] = [];
  if (npc.flavor) beats.push({ emoji: npc.emoji, text: npc.flavor });
  for (const qid of npc.offerQuests ?? []) {
    const q = SIDE_QUEST_BY_ID[qid]; if (!q) continue;
    if (c.completedQuests.includes(qid)) beats.push({ emoji: npc.emoji, text: `"${q.turnIn}"` });
    else if (c.completedChallenges.includes(npcOfferKey(qid))) beats.push({ emoji: npc.emoji, text: `"Still on ${q.title}? It's on your Quest Board."` });
    else { beats.push({ emoji: npc.emoji, text: `${q.hook}\n\n"${q.title}" has been added to your Quest Board.` }); doneKeys.push(npcOfferKey(qid)); }
  }
  if (beats.length === 0) beats.push({ emoji: npc.emoji, text: `${npc.name} nods at you and returns to their work.` });
  return { title: npc.name, beats, doneKeys };
}

function studentNpc(studentId: string, character: Character): PresentNpc | null {
  const s = STUDENT_BY_ID[studentId];
  if (!s) return null;
  const emoji = getInstrumentEmoji(s.instrument);
  const portrait = STUDENT_PORTRAITS[s.id];
  const recruitable = recruitmentDue(s, character) && !hasMet(s, character);
  return {
    id: s.id, name: s.name, emoji, role: 'Classmate', portrait, kind: 'classmate',
    hasAction: recruitable,
    talk: (c) => {
      if (!(recruitmentDue(s, c) && !hasMet(s, c))) {
        return { title: s.name, beats: [{ emoji, image: portrait, text: STUDENT_ROOM_FLAVOR[s.id] ?? `${s.name} nods at you and returns to practicing.` }], doneKeys: [] };
      }
      const same = c.instrument === s.instrument;
      return {
        title: same ? 'Well Wishes' : 'A New Classmate',
        beats: [{ emoji, image: portrait, text: same ? s.farewellScene : s.joinScene }],
        doneKeys: [metKey(s.id)],
      };
    },
  };
}

/** Everyone in a room right now: the Maestros and staff placed there, plus the
 *  classmates who live in that room (recruitable at their story beat). */
export function npcsInRoom(roomId: string, character: Character): PresentNpc[] {
  const out: PresentNpc[] = [];

  for (const n of STATIC_NPCS) {
    if (n.roomId !== roomId || !n.present(character)) continue;
    out.push({
      id: n.id, name: n.name, emoji: n.emoji, role: n.role, portrait: n.portrait, kind: n.kind,
      hasAction: questReady(n, character),
      talk: (c) => staticTalk(n, c),
    });
  }

  for (const [studentId, room] of Object.entries(STUDENT_ROOM)) {
    if (room !== roomId) continue;
    const npc = studentNpc(studentId, character);
    if (npc) out.push(npc);
  }

  return out;
}

/** A single NPC by id, if they are in the given room. */
export function npcInRoom(roomId: string, npcId: string, character: Character): PresentNpc | undefined {
  return npcsInRoom(roomId, character).find((n) => n.id === npcId);
}

/** Everyone present at a location right now: advisors, quest-givers, and any
 *  classmate/cameo whose story moment has arrived (click to recruit / meet). */
export function npcsAt(locationId: string, character: Character): PresentNpc[] {
  const out: PresentNpc[] = [];

  for (const n of STATIC_NPCS) {
    // Room-placed NPCs are surfaced by npcsInRoom, not by location — several of
    // them share one location cluster and would otherwise all appear together.
    if (n.roomId || n.locationId !== locationId || !n.present(character)) continue;
    out.push({
      id: n.id, name: n.name, emoji: n.emoji, role: n.role, portrait: n.portrait, kind: n.kind,
      hasAction: questReady(n, character),
      talk: (c) => staticTalk(n, c),
    });
  }

  for (const s of STUDENTS) {
    if (STUDENT_LOCATION[s.id] !== locationId) continue;
    if (!recruitmentDue(s, character) || hasMet(s, character)) continue;
    out.push({
      id: s.id, name: s.name, emoji: getInstrumentEmoji(s.instrument), role: 'Classmate',
      portrait: STUDENT_PORTRAITS[s.id], kind: 'classmate', hasAction: true,
      talk: (c) => {
        const same = c.instrument === s.instrument;
        return {
          title: same ? 'Well Wishes' : 'A New Classmate',
          beats: [{ emoji: getInstrumentEmoji(s.instrument), image: STUDENT_PORTRAITS[s.id], text: same ? s.farewellScene : s.joinScene }],
          doneKeys: [metKey(s.id)],
        };
      },
    });
  }

  for (const cm of CAMEOS) {
    if (CAMEO_LOCATION[cm.id] !== locationId) continue;
    if (!cameoDue(cm, character) || hasSeenCameo(cm, character)) continue;
    out.push({
      id: cm.id, name: CAMEO_NAME[cm.id] ?? cm.title, emoji: cm.emoji, role: 'In passing', kind: 'cameo', hasAction: true,
      talk: () => ({ title: cm.title, beats: [{ emoji: cm.emoji, text: cm.text }], doneKeys: [cameoKey(cm.id)] }),
    });
  }

  return out;
}
