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

// ── Room navigation ─────────────────────────────────────────────────────────
// The current room is remembered per character AND per zone, mirroring
// location movement above. Rooms visited (for minimap dimming) and the item
// inventory are per character — a building spans zones, so those must not be
// partitioned by zone.
const roomKey = (characterId: string, zoneId: number) => `bq_room_${characterId}_z${zoneId}`;
const visitedKey = (characterId: string) => `bq_visited_${characterId}`;
const carryKey = (characterId: string) => `bq_carrying_${characterId}`;
const takenKey = (characterId: string) => `bq_taken_${characterId}`;

export function getCurrentRoom(characterId: string, zoneId: number): string | null {
  try { return localStorage.getItem(roomKey(characterId, zoneId)); } catch { return null; }
}
export function setCurrentRoom(characterId: string, zoneId: number, roomId: string): void {
  try { localStorage.setItem(roomKey(characterId, zoneId), roomId); } catch { /* ignore */ }
}

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch { return []; }
}
function writeList(key: string, values: string[]): void {
  try { localStorage.setItem(key, JSON.stringify(values)); } catch { /* ignore */ }
}

export function getVisitedRooms(characterId: string): string[] { return readList(visitedKey(characterId)); }
export function markRoomVisited(characterId: string, roomId: string): string[] {
  const seen = getVisitedRooms(characterId);
  if (seen.includes(roomId)) return seen;
  const next = [...seen, roomId];
  writeList(visitedKey(characterId), next);
  return next;
}

/** Item ids currently carried. */
export function getCarrying(characterId: string): string[] { return readList(carryKey(characterId)); }
export function setCarrying(characterId: string, items: string[]): void { writeList(carryKey(characterId), items); }

/** Pickup ids already taken — a taken pickup never re-offers, even if consumed. */
export function getTaken(characterId: string): string[] { return readList(takenKey(characterId)); }
export function setTaken(characterId: string, items: string[]): void { writeList(takenKey(characterId), items); }
