// Named map locations (from docs/MAP.md), each rolling up to a campaign zone.
// Enemy placement is authored against these locations (see enemyPlacement.ts);
// the encounter system remains zone-based, so a location's `zoneId` is what
// actually decides where an enemy shows up.

export interface GameLocation {
  id: string;
  name: string;
  zoneId: number;   // 1–12 — the campaign zone this location belongs to
  act: 1 | 2 | 3;
}

export const LOCATIONS: GameLocation[] = [
  // ── Act 1 — The Academy ──
  { id: 'rehearsal_halls',  name: 'The Rehearsal Halls', zoneId: 1,  act: 1 },
  { id: 'practice_rooms',   name: 'Practice Rooms',      zoneId: 1,  act: 1 },
  { id: 'theory_wing',      name: 'The Theory Wing',     zoneId: 2,  act: 1 },
  { id: 'concerta',         name: 'Concerta',            zoneId: 3,  act: 1 },
  { id: 'crotchet',         name: 'Crotchet',            zoneId: 3,  act: 1 },
  { id: 'grand_auditorium', name: 'The Grand Auditorium',zoneId: 4,  act: 1 },

  // ── Act 2 — Into the World ──
  { id: 'legato',            name: 'Legato',             zoneId: 5,  act: 2 },
  { id: 'melodious_meadows', name: 'Melodious Meadows',  zoneId: 5,  act: 2 },
  { id: 'trioasis',          name: 'Trioasis',           zoneId: 6,  act: 2 },
  { id: 'caesura_crossing',  name: 'Caesura Crossing',   zoneId: 6,  act: 2 },
  { id: 'chaconne_caves',    name: 'Chaconne Caves',     zoneId: 6,  act: 2 },
  { id: 'clef_cliffs',       name: 'Clef Cliffs',        zoneId: 7,  act: 2 },
  { id: 'crescendo_keep',    name: 'Crescendo Keep',     zoneId: 7,  act: 2 },
  { id: 'presto_pass',       name: 'Presto Pass',        zoneId: 7,  act: 2 },
  { id: 'forgotten_forest',  name: 'Forgotten Forest',   zoneId: 8,  act: 2 },
  { id: 'adagio',            name: 'Adagio',             zoneId: 8,  act: 2 },

  // ── Act 3 — The Assault ──
  { id: 'coda_cove',         name: 'Coda Cove',          zoneId: 9,  act: 3 },
  { id: 'chromatic_coasts',  name: 'Chromatic Coasts',   zoneId: 9,  act: 3 },
  { id: 'syncopated_sea',    name: 'Syncopated Sea',     zoneId: 10, act: 3 },
  { id: 'the_maelstrom',     name: 'The Maelstrom',      zoneId: 10, act: 3 },
  { id: 'dissonant_dunes',   name: 'Dissonant Dunes',    zoneId: 11, act: 3 },
  { id: 'hall_of_discord',   name: 'Hall of Discord',    zoneId: 12, act: 3 },
];

const LOCATION_BY_ID: Record<string, GameLocation> =
  Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));

export function getLocation(id: string): GameLocation | undefined {
  return LOCATION_BY_ID[id];
}

// The campaign zone a location rolls up to (undefined if the id is unknown).
export function locationZone(id: string): number | undefined {
  return LOCATION_BY_ID[id]?.zoneId;
}
