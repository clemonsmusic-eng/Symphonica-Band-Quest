// Client-only world state (movement + intro), persisted to localStorage so we
// don't force another DB migration. Same pattern as customExcerpts.ts.

const introKey = 'bq_intro_seen';
// Movement is remembered per character AND per zone — each zone has its own
// map, so a location saved in one zone must not carry over into the next.
const locKey = (characterId: string, zoneId: number) => `bq_loc_${characterId}_z${zoneId}`;

export function hasSeenIntro(): boolean {
  try { return localStorage.getItem(introKey) === '1'; } catch { return false; }
}
export function markIntroSeen(): void {
  try { localStorage.setItem(introKey, '1'); } catch { /* ignore */ }
}

export function getCurrentLocation(characterId: string, zoneId: number): string | null {
  try { return localStorage.getItem(locKey(characterId, zoneId)); } catch { return null; }
}
export function setCurrentLocation(characterId: string, zoneId: number, locationId: string): void {
  try { localStorage.setItem(locKey(characterId, zoneId), locationId); } catch { /* ignore */ }
}
