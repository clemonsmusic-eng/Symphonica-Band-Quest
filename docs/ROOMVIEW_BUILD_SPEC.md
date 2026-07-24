# Build Spec — RoomView (Space Quest–style room navigation)

Implementation spec for a coding agent. Replaces the top-down node map with a
**room-based, Space Quest–style navigation**: the player is *in* one room at a
time — a static scene with a description, exits to adjacent rooms, present NPCs,
and hotspots to look at / talk to / do — and clicks between rooms.

**Read first:** `docs/LOCATION_DESIGN_HARMONIA.md` — the full design for the first
location (Harmonia Academy, 23 rooms). It defines every room's scene text, exits,
present NPCs, hotspots, item pickups/uses, and how rooms roll up to
`locations.ts` clusters. This spec is the *how*; that doc is the *what*.

## Stack & guardrails
- React 18 + TypeScript + Vite + Zustand + Tailwind + Supabase.
- `noUnusedLocals` and `noUnusedParameters` are ON — keep imports/params clean.
- `npm run typecheck && npm run build` must pass.
- Theme with the existing Tailwind academy palette (see `tailwind.config.js`:
  `academy.gold/amber/cream/dark`, fonts `fantasy` = Cinzel, `body` = Inter).

## Decision
**Rooms replace the top-down node map in every location-based zone.** Build
`RoomView` and route location-based zones through it; the current node-map body
of `ExplorePage` is retired in favor of `RoomView`. Unmigrated zones keep their
legacy pages behind the existing `LOCATION_BASED_ZONES` flag
(`src/lib/world/worldMap.ts`).

## Reuse — do NOT rewrite
- **`ChallengeModal`** — challenges and advance-gates (opens with a challenge
  spec, calls back with `(rating, score)`).
- **`BattleScreen`** — mini-boss encounters (`onVictory(rp, spDelta)` /
  `onDefeat`).
- **`LiberationScene`** — dialogue/cutscenes (beats + `onDone`).
- **gameStore actions** (`src/store/gameStore.ts`): `awardChallenge(id, type,
  score, rating, opts?)`, `advanceZone(zoneId)`, `equipGear`, `addSummonPoints`,
  `recordStoryKeys(keys)`.
- **NPC resolution** (`src/lib/world/npcs.ts`): `npcsAt(locationId, character)` →
  `PresentNpc[]` with `talk(character) → TalkResult { title, beats, doneKeys }`.
  Reuse this for who's-present + talk (quest offers, classmate recruits, cameos).
- **Existing activity/gate logic** in `ExplorePage.tsx` (challenge/battle/gate
  handlers, the Zone-4 `ShatteringCutscene`, gear-drop banner) — lift and reuse,
  don't reinvent.

## Deliverables

### 1. `src/lib/world/rooms.ts` — data model + Academy rooms
Transcribe the 23 Academy rooms from `docs/LOCATION_DESIGN_HARMONIA.md`. The
interactive prototype's room data is the reference for exact scene text, exits,
hotspots, pickups, and NPC placement.

```ts
export interface Hotspot {
  verb: string;            // "Look", "Talk", "Read", "Rest", …
  object: string;          // "at the statue", "to Maestro Barenboimi"
  response: string;        // parser-line text shown on click
  danger?: boolean;        // red styling (mini-boss / ominous)
  // At most one hook — otherwise the hotspot just prints its response:
  challengeId?: string;    // open ChallengeModal for this challenge
  battleId?: string;       // open BattleScreen for this encounter
}
export interface Pickup { id: string; icon: string; label: string; response: string }
export interface Use {
  needs: string;           // item id required
  verb: string; object: string;
  success: string;         // response when carried
  missing: string;         // hint when not carried ("" ⇒ hide until carried, e.g. a gift)
  consume?: boolean;       // remove item after use
}
export interface RoomDef {
  id: string; name: string; short: string;
  zoneId: number;
  locationId: string;      // rolls up to locations.ts (encounter/zone logic stays location-based)
  tint: string; emoji: string;
  map: [number, number];   // x,y in 0–100 for the minimap
  desc: string;
  npcIds?: string[];       // present NPCs (see note below)
  hotspots: Hotspot[];
  pickups?: Pickup[];
  uses?: Use[];
}
export interface RoomEdge { a: string; b: string }   // bidirectional; direction derived from map coords

export const ITEMS: Record<string, { icon: string; name: string }>;
export const ROOMS: Record<string, RoomDef>;
export const ROOM_EDGES: RoomEdge[];
export function roomsForZone(zoneId: number): RoomDef[];
export function entryRoom(zoneId: number): string | null;   // first room flagged/first in zone
export function roomNeighbors(roomId: string): string[];
```
Notes:
- **NPC placement:** the prototype lists present NPCs by display name. Reconcile
  with `npcs.ts`: talk hotspots for existing quest-givers/advisors/classmates
  should route through `npcsAt`/`PresentNpc.talk`. Where a room names a character
  not yet in `npcs.ts` (e.g. Vexus, the individual Maestros in their offices),
  add lightweight static talk entries. Prefer extending `npcs.ts` over
  duplicating talk logic.
- **Challenge/gate/battle hooks:** map the prototype's parenthetical hooks —
  "(Zone 1 required challenges)", "(Rest Wraith mini-boss)", "(Boot Camp
  graduation gate)" — to the existing challenge ids and the `content.ts`
  activity/gate model. Gates must advance zones exactly as `ExplorePage` does
  today (award winKey → gear drop → `advanceZone` → Hub; Zone-4 graduation plays
  the Shattering cutscene).

### 2. `src/components/world/RoomView.tsx`
Renders the current room:
- **Scene:** title, tag, an art frame showing `/rooms/<zoneId>/<roomId>.webp` if
  present else the room emoji (same image-or-emoji fallback the intro uses),
  caption, and the description in a mono "parser" voice.
- **Present here:** chips from `npcsAt` + any room-defined NPCs; click → talk
  (renders `LiberationScene` from the `TalkResult`; on done `recordStoryKeys`).
- **Things you can do:** hotspot buttons. Plain hotspots print their response to
  a parser line. `challengeId` → `ChallengeModal`; `battleId` → `BattleScreen`;
  gates → existing gate flow. Pickups ("Take …") add to inventory then disappear;
  uses gate on a carried item (with the "you'd need X" hint; consume for gifts).
- **Carrying:** an inventory strip of held items.
- **Exits:** neighbors from `ROOM_EDGES`; compute N/S/E/W from map-coord deltas;
  buttons "Head <dir> — <Room name>"; click → set current room. Arrow keys optional.
- **Minimap:** SVG of the zone's rooms at their `map` coords, edges as connectors,
  current highlighted, visited dimmed; nodes clickable to travel.

### 3. Routing
Route location-based zones to `RoomView` (via `ExplorePage` or a new route). Keep
the `LOCATION_BASED_ZONES` gate so unconverted zones use legacy pages. Preserve
the existing guards (`zid > currentZone` → Hub; `RequireCharacter`).

### 4. State — `src/lib/world/state.ts`
Add `currentRoom` persistence, per character AND per zone, mirroring the existing
`getCurrentLocation`/`setCurrentLocation` (localStorage, keyed
`bq_room_<characterId>_z<zoneId>`). Default to `entryRoom(zoneId)`. Guard a saved
room that isn't in the zone (snap to entry) — same defensive check `ExplorePage`
already does for locations. Inventory (`carrying`/`taken`) persists per character.

## Acceptance criteria
- Entering a location-based zone shows its entry room (Academy → **The Entry
  Gate**), navigable room-to-room via exits and the minimap.
- All hooks reachable and functional: challenges (ChallengeModal), the two
  mini-bosses (BattleScreen), quests/recruits/advisor talks (LiberationScene via
  `npcsAt`), and zone-advance gates — including the Zone-4 graduation → Shattering
  cutscene.
- Inventory pickups/uses work (e.g. Tuning Fork from the Temple of Sound → tune
  the Concert Hall grand; Library Card → the Listening Room archive; Garden
  flower → gift Piccola).
- `npm run typecheck && npm run build` green; no unused-locals errors.
- Legacy (unconverted) zones still load their existing pages.

## Suggested order
1. `rooms.ts` (data + types) for the Academy.
2. `RoomView` static render (scene + exits + minimap) with emoji art.
3. Hotspot hooks (challenge/battle/talk/gate) reusing existing components.
4. Inventory (pickups/uses) + per-character/zone room state.
5. Route location-based zones through `RoomView`; verify Academy end-to-end.
6. Drop-in room art later at `/rooms/<zoneId>/<roomId>.webp` (emoji fallback until then).
