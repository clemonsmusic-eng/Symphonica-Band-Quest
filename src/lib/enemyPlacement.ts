import { locationZone } from './locations';

// Authored enemy → location placement (the live source of truth for where an
// enemy appears). An enemy may be placed in MANY locations, so each maps to a
// list. Populated by the drag-and-drop placement tool: paste its exported
// `{ "<enemyId>": ["<locationId>", …] }` map below. Anything left out falls back
// to the enemy's own `zone` field, so the game works with a partial/empty map.
export const ENEMY_PLACEMENT: Record<string, string[]> = {
  // Authored via the drag-and-drop placement tool. Enemies not listed here fall
  // back to their own `zone` field (see enemyZones below).
  flatling: ['rehearsal_halls', 'melodious_meadows', 'theory_wing'],
  sharp_creature: ['chaconne_caves'],
  natural_creature: ['rehearsal_halls', 'chaconne_caves', 'presto_pass', 'forgotten_forest', 'dissonant_dunes', 'crescendo_keep'],
  chronoton_scout: ['concerta'],
  chronoton_shifter: ['concerta'],
  flat_dragon: ['theory_wing'],
  interval_imp: ['theory_wing'],
  aria_wraith: ['melodious_meadows'],
  war_horn_berserker: ['chaconne_caves'],
  chalumeau_phantom: ['trioasis'],
  clarion_phantom: ['trioasis'],
  bassetta: ['trioasis'],
  caucophonus: ['caesura_crossing'],
  discordian_sentry: ['presto_pass'],
  sound_shadow: ['clef_cliffs'],
  lieutenant_contra: ['crescendo_keep'],
  sliding_chaos_knight: ['crescendo_keep'],
  stone_colossus: ['presto_pass', 'clef_cliffs'],
  echoing_wisp: ['forgotten_forest', 'chaconne_caves', 'crescendo_keep', 'coda_cove'],
  forest_flogger: ['forgotten_forest'],
  double_reed_specter: ['adagio'],
  ancient_revenant: ['adagio'],
  the_maelstrom: ['the_maelstrom'],
  piano_commander: ['dissonant_dunes'],
  forte_commander: ['dissonant_dunes'],
  vexian_knight: ['hall_of_discord'],
  ostinato_usher: ['hall_of_discord'],
  lieutenant_kije: ['hall_of_discord'],
  commander_mesto: ['hall_of_discord'],
  general_grave: ['hall_of_discord'],
  vexus: ['hall_of_discord'],
  pixielo: ['forgotten_forest'],
  fiferfly: ['melodious_meadows'],
  ghoulgenspiel: ['chaconne_caves', 'forgotten_forest'],
  bagpipe_banshee: ['clef_cliffs'],
  flugel_fiend: ['chaconne_caves'],
  therrormin: ['crescendo_keep', 'forgotten_forest', 'chromatic_coasts', 'coda_cove'],
  vibrawraith: ['chaconne_caves', 'forgotten_forest'],
  chastanet: ['coda_cove', 'chromatic_coasts', 'dissonant_dunes'],
  crotentacle: ['coda_cove', 'chromatic_coasts', 'syncopated_sea'],
  timptanic: ['chromatic_coasts', 'coda_cove'],
  gongolem: ['clef_cliffs'],
  rest_wraith: ['practice_rooms', 'presto_pass', 'crescendo_keep', 'forgotten_forest', 'syncopated_sea', 'dissonant_dunes'],
  frat: ['practice_rooms', 'melodious_meadows', 'trioasis', 'crescendo_keep', 'chaconne_caves', 'theory_wing'],
  stage_phantom: ['grand_auditorium'],
  fermoctopus: ['coda_cove', 'chromatic_coasts', 'syncopated_sea'],
  saxerpent: ['trioasis', 'chaconne_caves', 'dissonant_dunes'],
  glissanghost: ['crescendo_keep', 'forgotten_forest'],
  stingcatto: ['melodious_meadows', 'trioasis', 'clef_cliffs', 'crescendo_keep'],
  dissonaut: ['syncopated_sea', 'chromatic_coasts'],
  tacetus: ['dissonant_dunes'],
};

// Every campaign zone an enemy occupies: the zones of its placed locations
// (deduped), or a single-element list with the enemy's `zone` default.
export function enemyZones(enemyId: string, fallbackZone: number): number[] {
  const locs = ENEMY_PLACEMENT[enemyId];
  if (!locs || locs.length === 0) return [fallbackZone];
  const zones = [...new Set(
    locs.map(locationZone).filter((z): z is number => z !== undefined),
  )];
  return zones.length ? zones : [fallbackZone];
}

export function isEnemyInZone(enemyId: string, fallbackZone: number, zoneId: number): boolean {
  return enemyZones(enemyId, fallbackZone).includes(zoneId);
}

// Earliest zone an enemy appears in — used for "unlocked by the player's zone".
export function enemyMinZone(enemyId: string, fallbackZone: number): number {
  return Math.min(...enemyZones(enemyId, fallbackZone));
}
