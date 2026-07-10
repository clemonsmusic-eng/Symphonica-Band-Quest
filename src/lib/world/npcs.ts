import type { Character } from '../../types/game';

export type NpcKind = 'classmate' | 'maestro' | 'questgiver' | 'story' | 'vendor';

// A person you can find on the map and click to talk to. Talking shows `flavor`
// (a single in-character line) followed by the hook for any not-yet-offered
// quest in `offerQuests`; completing the talk adds those quests to the Board.
export interface NpcDef {
  id: string;
  name: string;
  emoji: string;
  role?: string;
  portrait?: string;         // portraits.ts path when art exists
  locationId: string;
  kind: NpcKind;
  present: (c: Character) => boolean;
  flavor?: string;           // dialogue line (advisors / story)
  offerQuests?: string[];    // sidequest ids this NPC hands out
}

export const NPCS: NpcDef[] = [
  // ── Zone 1 · The Rehearsal Halls ──
  {
    id: 'barenboimi', name: 'Maestro Barenboimi', emoji: '🎻', role: 'Conducting professor',
    locationId: 'rehearsal_halls', kind: 'story', present: () => true,
    flavor: '"A whole world runs on music," Barenboimi says, baton never quite still, "and one day it will run on yours. So — again, from the top. Your scales matter more than you know."',
  },
  {
    id: 'fennelio', name: 'Director Fennelio', emoji: '🎓', role: 'Headmaster of Harmonia Academy',
    locationId: 'rehearsal_halls', kind: 'story', present: () => true,
    flavor: '"Master your fundamentals and pass your first performance," Fennelio says, "and I will call you a student of this Academy in truth. I will be waiting when you are ready to graduate Boot Camp."',
  },
  {
    id: 'reeda', name: 'Reeda', emoji: '🧹', role: 'Hall custodian',
    locationId: 'practice_rooms', kind: 'questgiver', present: () => true,
    offerQuests: ['sq_z1_squeaky_reed'],
  },
  {
    id: 'tick', name: 'Tick', emoji: '⏱️', role: 'Keeper of metronomes',
    locationId: 'practice_rooms', kind: 'questgiver', present: () => true,
    offerQuests: ['sq_z1_metronome'],
  },
];

/** NPCs currently present at a location. */
export function npcsAt(locationId: string, character: Character): NpcDef[] {
  return NPCS.filter((n) => n.locationId === locationId && n.present(character));
}
