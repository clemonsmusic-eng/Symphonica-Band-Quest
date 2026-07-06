import { locationZone } from './locations';

// Authored enemy → location placement (the live source of truth for where an
// enemy appears). An enemy may be placed in MANY locations, so each maps to a
// list. Populated by the drag-and-drop placement tool: paste its exported
// `{ "<enemyId>": ["<locationId>", …] }` map below. Anything left out falls back
// to the enemy's own `zone` field, so the game works with a partial/empty map.
export const ENEMY_PLACEMENT: Record<string, string[]> = {
  // (empty — every enemy currently uses its default zone; fill via the tool)
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
