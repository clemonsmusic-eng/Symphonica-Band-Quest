# RoomView — review & acceptance checklist

The merge gate for the room-navigation build (`docs/ROOMVIEW_BUILD_SPEC.md`).
Everything here must pass before RoomView merges to `main`. Reviewer drives it
live with a seeded guest character in a headless browser, plus a code read.

> **Status:** the Academy build passes A–F (33 automated live-browser assertions
> against a seeded guest, plus `typecheck`/`build`). G (the human live pass) is
> the remaining item — it needs eyes on the real preview, not a script.

## A. Build & hygiene
- [x] `npm run typecheck` clean; `npm run build` green.
- [x] No `noUnusedLocals` / `noUnusedParameters` errors.
- [x] New/changed files are scoped: `src/lib/world/rooms.ts` (new),
      `src/components/world/RoomView.tsx` (new), `src/lib/world/state.ts`
      (room + inventory persistence), routing wire-in. **No rewrites** of
      `ChallengeModal`, `BattleScreen`, `LiberationScene`, or combat/challenge logic.
- [x] Room content matches `docs/academy_rooms.data.ts` verbatim (spot-check 5
      rooms: descriptions, hotspot wording, pickups/uses). *One deliberate
      deviation:* the parenthetical build notes the export embeds in its prose
      ("(Zone 1 required challenges.)", "(Recruitable classmate.)") are dropped
      from the shipped text — per that file's own header they are hook
      instructions, and they are wired to real challenge/battle/gate/quest ids
      instead of being shown to the player.

## B. Decisions honored (see LOCATION_DESIGN_HARMONIA.md → Decisions)
- [x] **D1:** no new `GameLocation` entries; every room's `locationId` is one of
      `rehearsal_halls` / `practice_rooms` / `theory_wing` / `library_stacks`.
- [x] **D2:** the Academy renders as ONE building (all 23 rooms), movement never
      gated; Zone-2 content locked until `currentZone >= 2`; Boot Camp graduation
      advances 1→2 in place without changing the map.

## C. Navigation (Academy, 23 rooms)
- [x] Entering the Academy lands on **The Entry Gate**.
- [x] All 23 rooms reachable via exits; exit direction labels (N/S/E/W) match the
      map-coord geometry; dead-ends have a working "back" exit.
- [x] Minimap shows all rooms + connectors; current highlighted, visited dimmed;
      clicking a node travels there.
- [x] `currentRoom` persists per **character AND zone** (localStorage); reload
      returns you to the same room. A saved room not in the building snaps to entry.

## D. Hooks actually fire (not just print text)
- [x] **Challenges** open `ChallengeModal` and award via `awardChallenge`
      (Rehearsal Hall stands → Zone-1 required; Listening Room → aural; Theory
      Classroom → Zone-2, locked pre-graduation).
- [x] **Mini-bosses** open `BattleScreen`: Rest Wraith (Practice Rooms, "open the
      room at the end") and Interval Imp (Library, "follow the echo").
- [x] **Talks** route through `npcsAt` → `LiberationScene`: advisor flavor, quest
      offers (Reeda, Tick, Piccola, Bellamy-equivalents in the Academy: Reeda/Tick;
      Dr. Sol), classmate recruits (Piper, Cora, Reed, Zoot, Benny, Tommy, Otto,
      Gene) — each records its story key so it doesn't refire.
- [x] **Gates advance correctly:** award winKey → gear drop → `advanceZone` → Hub.
- [x] Boot Camp graduation (Recital Hall) advances 1→2 and **unlocks Theory-wing
      content in place**.
- [x] The individual Maestros (Barenboimi is gone; Flaura/Fagotto/Paige/Clarence/
      Adolpha/Cornelius/Hautbois etc.) and **Vexus** (Vexus's Office) are present
      and talkable with their authored lines.

## E. Inventory
- [x] Pickups add to a "Carrying" strip and the "Take …" action then disappears.
- [x] Uses gate on the carried item; show the "you'd need X" hint when missing.
- [x] End-to-end: Tuning Fork (Temple of Sound) → tune the Concert Hall grand;
      Library Card (Library) → play the Listening Room sealed cylinder; Garden
      flower → gift Piccola (consumed).
- [x] Inventory persists per character across navigation/reload.

## F. Cutover safety
- [x] Location-based zones route through `RoomView`; **unconverted zones still load
      their legacy pages** (the `LOCATION_BASED_ZONES` flag is intact).
- [x] Room art loads `/rooms/<zoneId>/<roomId>.webp` when present, else emoji —
      no broken-image state.
- [x] Existing guards preserved: `RequireCharacter`, `zid > currentZone → Hub`.

## G. Reviewer's live pass (recorded before merge)
- [ ] Guest character seeded; walk Gate → Courtyard → Main Hall → wings; trigger a
      challenge, a mini-boss, a recruit, a gate; run the three item interactions.
- [ ] Screenshot the entry room + one Maestro office + the graduation flow.
- [ ] Confirm zone 3/4 (legacy) still load; confirm no console page-errors.
