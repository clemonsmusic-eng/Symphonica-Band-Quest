import { locationZone } from './locations';

// Authored enemy → location placement (the live source of truth for where an
// enemy appears). Populated by the drag-and-drop placement tool: paste its
// exported `{ "<enemyId>": "<locationId>" }` map below. Anything left out falls
// back to the enemy's own `zone` field, so the game works with a partial (or
// empty) map.
export const ENEMY_PLACEMENT: Record<string, string> = {
  // (empty — every enemy currently uses its default zone; fill via the tool)
};

// Effective campaign zone for an enemy: its placed location's zone, else the
// enemy's built-in `zone` default.
export function enemyZone(enemyId: string, fallbackZone: number): number {
  const placed = ENEMY_PLACEMENT[enemyId];
  if (!placed) return fallbackZone;
  return locationZone(placed) ?? fallbackZone;
}
