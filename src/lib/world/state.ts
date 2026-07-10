// Client-only world state (movement + intro), persisted to localStorage so we
// don't force another DB migration. Same pattern as customExcerpts.ts.

const introKey = 'bq_intro_seen';
const locKey = (characterId: string) => `bq_loc_${characterId}`;

export function hasSeenIntro(): boolean {
  try { return localStorage.getItem(introKey) === '1'; } catch { return false; }
}
export function markIntroSeen(): void {
  try { localStorage.setItem(introKey, '1'); } catch { /* ignore */ }
}

export function getCurrentLocation(characterId: string): string | null {
  try { return localStorage.getItem(locKey(characterId)); } catch { return null; }
}
export function setCurrentLocation(characterId: string, locationId: string): void {
  try { localStorage.setItem(locKey(characterId), locationId); } catch { /* ignore */ }
}
