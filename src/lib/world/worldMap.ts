import { LOCATIONS, type GameLocation } from '../locations';

// Zones that use the new location-based world. Grows each migration phase;
// unlisted zones keep their legacy bespoke page.
export const LOCATION_BASED_ZONES = new Set<number>([1, 2, 3, 4]);

export function isLocationBasedZone(zoneId: number): boolean {
  return LOCATION_BASED_ZONES.has(zoneId);
}

// Display node for a location on the zone map. x/y are percentages (0–100) of
// the map canvas. `entry` marks where the avatar starts on first arrival.
export interface MapNode {
  x: number;
  y: number;
  blurb: string;
  entry?: boolean;
}

export const MAP_NODES: Record<string, MapNode> = {
  // ── Zone 1 · The Rehearsal Halls ──
  rehearsal_halls: {
    x: 32, y: 34, entry: true,
    blurb: 'The heart of Harmonia Academy. Stone arches and worn floors echo with a hundred instruments; from the high windows, Concerta glows gold in the valley below.',
  },
  practice_rooms: {
    x: 68, y: 64,
    blurb: 'A warren of small rooms down the east wing. Reeds soak in cups, metronomes tick out of sync, and a strange hush pools in the corners.',
  },

  // ── Zone 2 · The Theory Wing ──
  theory_wing: {
    x: 30, y: 38, entry: true,
    blurb: 'The Academy\'s ancient inner wing — walls of faded pre-Shattering scores, the air thick with old parchment and chalk. This is where the class first sounds like an ensemble.',
  },
  theory_stacks: {
    x: 70, y: 60,
    blurb: 'Deep in the library stacks, shelves lean with crossed-out references to a "forbidden interval." Something mis-played once still echoes down the aisles.',
  },

  // ── Zone 3 · The City of Concerta ──
  concerta: {
    x: 64, y: 40, entry: true,
    blurb: 'The great central metropolis, dressed for the regional contest — banners strung rooftop to rooftop, every guild hall flying its colors, the square packed for the Concerta Invitational.',
  },
  batterhead_burrough: {
    x: 28, y: 58,
    blurb: 'The last town on the Concerta road out of the Academy — a quiet burrough where every visiting school stops to warm up before the contest. Reeds soak, scales climb the alley walls, and nerves settle.',
  },

  // ── Zone 4 · The Grand Auditorium ──
  backstage: {
    x: 30, y: 56, entry: true,
    blurb: 'The wings of the great hall on graduation night — risers stacked, sections warming up, the Sacred Score fragment waiting on every stand. Somewhere out front, the Maestros ready the Renewal.',
  },
  grand_auditorium: {
    x: 66, y: 38,
    blurb: 'The Academy\'s crown jewel, lit gold for graduation. One performance stands between you and the rest of your life — and then, as every year, the Maestros will play the Renewal that keeps the world turning.',
  },
};

/** Locations of a zone that have a map node, in a stable order. */
export function zoneLocations(zoneId: number): GameLocation[] {
  return LOCATIONS.filter((l) => l.zoneId === zoneId && MAP_NODES[l.id]);
}

/** The entry location id for a zone (marked entry, else the first). */
export function entryLocation(zoneId: number): string | null {
  const locs = zoneLocations(zoneId);
  const entry = locs.find((l) => MAP_NODES[l.id]?.entry);
  return (entry ?? locs[0])?.id ?? null;
}
