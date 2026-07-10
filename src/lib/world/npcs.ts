import type { Character } from '../../types/game';
import type { LibBeat } from '../../components/LiberationScene';
import { SIDE_QUEST_BY_ID, npcOfferKey } from '../../lib/sidequests';
import {
  STUDENTS, CAMEOS, metKey, cameoKey, recruitmentDue, hasMet, cameoDue, hasSeenCameo,
} from '../../lib/students';
import { getInstrumentEmoji } from '../../lib/instruments';
import { STUDENT_PORTRAITS } from '../../lib/portraits';

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
  present: (c: Character) => boolean;
  flavor?: string;
  offerQuests?: string[];
}

const STATIC_NPCS: StaticNpc[] = [
  // Zone 1
  { id: 'barenboimi', name: 'Maestro Barenboimi', emoji: '🎻', role: 'Conducting professor', locationId: 'rehearsal_halls', kind: 'story', present: () => true,
    flavor: '"A whole world runs on music," Barenboimi says, baton never quite still, "and one day it will run on yours. So — again, from the top. Your scales matter more than you know."' },
  { id: 'fennelio', name: 'Director Fennelio', emoji: '🎓', role: 'Headmaster', locationId: 'rehearsal_halls', kind: 'story', present: () => true,
    flavor: '"Master your fundamentals and pass your first performance," Fennelio says, "and I will call you a student of this Academy in truth. I will be waiting when you are ready to graduate Boot Camp."' },
  { id: 'reeda', name: 'Reeda', emoji: '🧹', role: 'Hall custodian', locationId: 'practice_rooms', kind: 'questgiver', present: () => true, offerQuests: ['sq_z1_squeaky_reed'] },
  { id: 'tick', name: 'Tick', emoji: '⏱️', role: 'Keeper of metronomes', locationId: 'practice_rooms', kind: 'questgiver', present: () => true, offerQuests: ['sq_z1_metronome'] },
  // Zone 2
  { id: 'persichetti', name: 'Maestro Persichetti', emoji: '📖', role: 'Theory professor', locationId: 'theory_wing', kind: 'story', present: () => true,
    flavor: '"Good ears," Persichetti says, turning a humming scrap of old score in his hands. "The Theory Wing keeps a few secrets worth finding. Mind you put it back."' },
  { id: 'piccola', name: 'Piccola', emoji: '😰', role: 'Nervous first-year', locationId: 'theory_wing', kind: 'questgiver', present: () => true, offerQuests: ['sq_z2_stage_fright'] },
  { id: 'dr_sol', name: 'Dr. Sol', emoji: '📚', role: 'Theory librarian', locationId: 'theory_stacks', kind: 'questgiver', present: () => true, offerQuests: ['sq_z2_misfiled_interval'] },
];

// Where classmates and cameos appear on the map.
const STUDENT_LOCATION: Record<string, string> = { piper: 'theory_wing', reed: 'theory_stacks' };
const CAMEO_LOCATION: Record<string, string> = { gene_hall: 'theory_wing' };
const CAMEO_NAME: Record<string, string> = { gene_hall: 'A bored drummer' };

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

/** Everyone present at a location right now: advisors, quest-givers, and any
 *  classmate/cameo whose story moment has arrived (click to recruit / meet). */
export function npcsAt(locationId: string, character: Character): PresentNpc[] {
  const out: PresentNpc[] = [];

  for (const n of STATIC_NPCS) {
    if (n.locationId !== locationId || !n.present(character)) continue;
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
