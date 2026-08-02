# Harmonia Academy — Room Art Prompts (23 rooms)

Prompts for the room backdrops rendered by `RoomView` (`src/components/world/RoomView.tsx`).
Written for **ChatGPT's image generator**, in the same 16-bit SNES / Final Fantasy VI
pixel-art style as `docs/INTRO_IMAGE_PROMPTS.md`.

Room prose is authoritative: `src/lib/world/rooms.ts`.

## Where the files go

`RoomView` loads `/rooms/<zoneId>/<roomId>.webp` and **falls back to the room's emoji** when the
file is missing — so you can deliver these a few at a time and the game keeps working.

```
public/rooms/1/   ← 20 rooms
public/rooms/2/   ← 3 rooms (library, listening_room, theory_classroom)
```

Each prompt below is titled with its exact target path. **Filenames must match exactly** — that's
the whole wiring.

## Format

- **16:9 landscape.** The frame is `aspect-ratio: 16/9`, `object-fit: cover`. ChatGPT's widest is
  ~1536×1024 (3:2) — crop to 16:9 on import.
- Keep the **interesting content in the middle band**; the top and bottom ~12% can be cropped.
- **No text, no UI, no character portraits, no borders** — the UI draws all of that.
- Optimize before committing (same as the intro art): ~1280px wide WebP q0.9.

## How to run it in ChatGPT

1. Start **one chat**. Upload `docs/assets/character_sheet.png` and the relevant
   `public/portraits/*.png`. Say: *"These are my established characters in my game's pixel-art
   style. Match their designs and this exact art style in the images I ask for next."*
2. Paste the **master style directive** below.
3. Then paste **one room per message**, in order. After the first, you can prefix with
   *"Same style and characters, next room:"*.
4. Do all of **Zone 1 outdoor → Zone 1 interior → Zone 2** in that order; consecutive rooms share
   architecture, and the chat's context keeps the building consistent.

---

## Master style directive (paste once, at the top of the chat)

> Render every image as authentic 16-bit SNES pixel art, like a real screenshot from Final Fantasy
> VI (1994): visible square pixels, no anti-aliasing, no smooth gradients, dithered shading, a
> deliberately limited palette. Keep the palette LIGHT and airy — sky blue, ivory, teal, soft rose,
> lavender, pale mint — using warm gold only as a rare accent, never brown-dominant or dark.
>
> These are all **rooms in one building: Harmonia Academy**, a warm, welcoming music school. Keep
> the architecture consistent across every image — pale cream stone walls, arched doorways and
> windows, worn honey-wood floors, blue-and-gold Academy banners bearing a treble clef crossed with
> a quill. Every image is a **wide interior/exterior game location seen straight-on in slight 3/4
> perspective**, like an explorable Final Fantasy VI town screen: the room fills the frame, the
> floor runs to the bottom edge, and there is clear open floor space in the middle for a character
> to stand. No text, no UI, no HUD, no borders, no watermark, no on-screen labels.

---

# Zone 1 — Outdoors & approach

## `public/rooms/1/entry_gate.webp` — The Entry Gate
> Dawn at the wrought-iron front gate of a music academy, seen from just outside looking in. The
> tall gate is forged in the shape of a **treble clef**, standing open. Behind it, pale cream stone
> arches open onto a courtyard. Behind the viewer's left shoulder a road winds down into a green
> valley where a distant golden city glitters far below under a pale pink-and-blue dawn sky. Dewy
> grass, a stone wall, two lantern posts. Hopeful, first-day-of-school feeling.

## `public/rooms/1/courtyard.webp` — The Courtyard
> A sunlit academy courtyard of worn grey flagstones fanning out beneath pale stone arches. At the
> center stands a **weathered stone statue of a robed figure holding a raised quill**, on a plinth
> with a small brass plaque. Two students stand close together at the statue's foot with their
> heads tipped back in wonder: a girl with a flute and a girl with a french horn. Other students
> crisscross in the background carrying instrument cases. Green ivy on the arches, blue sky.

## `public/rooms/1/garden.webp` — The Garden
> A small walled garden of bright green grass off a stone courtyard, quiet and sunlit. A **stone
> bench beneath a big flowering tree** in pale pink blossom, petals drifting. A narrow gravel path
> curves through beds of soft-colored flowers. An older man in an olive-green coat — a french horn
> maestro — strolls the path with his hands clasped behind his back. A small brass plaque among the
> tree roots. Peaceful, birdsong-quiet, pastel.

## `public/rooms/1/reflecting_pond.webp` — The Reflecting Pond
> A still, dark reflecting pool set in pale stone, mirroring a pale sky and the academy's spires
> upside down. Orange-and-white koi drift beneath the surface. A student with an oboe across their
> knees sits cross-legged at the water's edge, half-smiling. Reeds and a few lily pads at the
> margins, a low stone rim. Calm, glassy, gently luminous.

---

# Zone 1 — The main building

## `public/rooms/1/main_hall.webp` — The Main Hall
> The grand central corridor of a music academy, **two storeys tall**, seen straight down its
> length. Pale cream stone walls, a checkerboard floor, arched doorways opening off both sides, and
> a wide staircase at the back leading to an upper gallery. A huge **blue-and-gold banner** bearing
> a treble clef crossed with a quill hangs the full height of the hall. To one side, a wooden
> **noticeboard thick with pinned parchment**. Warm light from high windows. Busy, welcoming, grand.

## `public/rooms/1/dining_hall.webp` — The Dining Hall
> A bright academy dining hall with long wooden tables and benches, trays and cups, and a serving
> counter with a pretzel basket at the back. Warm light, checkered floor. At the nearest table two
> students sit behind very full plates, mid-meal and entirely content: a stocky boy with a trombone
> propped beside him and a big cheerful boy with a tuba. A small hand-lettered sign is tacked by the
> door. Cozy, golden, faintly comic.

## `public/rooms/1/dormitory.webp` — The Dormitory
> A student dormitory room: wooden bunk beds with rumpled quilts, battered practice chairs, open
> instrument cases on the floor, and posters of touring ensembles on the walls. A boy sits
> cross-legged on a lower bunk with a **scatter of small percussion instruments spread on the
> blanket** — a woodblock, finger cymbals, a kazoo — tinkering happily. Late-afternoon light through
> a small window. Lived-in and homey.

## `public/rooms/1/clinic.webp` — The Clinic
> A sunlit infirmary that doubles as a flute studio: two crisp **white cots** along one wall, a
> medicine cabinet with glass doors, a music stand holding warm-up etudes, and potted plants on the
> windowsill. A woman with auburn hair — the flute maestro — stands between the cabinet and the
> stand, flute in hand. Airy, clean, pale mint and ivory, very light and healing in feel.

## `public/rooms/1/rehearsal_hall.webp` — The Rehearsal Hall
> A large ensemble rehearsal hall with **stone arches and worn wooden floors**, filled with rows of
> black music stands and empty chairs arranged in a wide semicircle. At the front, a raised
> **conductor's podium with a baton laid across the stand**, empty. A row of taller "challenge"
> stands off to one side holds open sheet music. A closed wooden door at the back. High arched
> windows spill pale light across the floor. Echoing, expectant, no people.

## `public/rooms/1/vexus_office.webp` — Vexus's Office
> A narrow, cluttered study off a rehearsal hall — **every surface stacked high with scores and
> manuscript paper**. A tall thin man in dark elegant robes sits at the desk at the center of it,
> bent over ten open scores, annotating furiously in **violet ink**, quill flying. Candlelight, a
> single narrow window, shelves crammed with bound volumes. Slightly claustrophobic and obsessive;
> keep the palette cool — lavender, slate, ivory — with an unsettling violet glow on the pages.

## `public/rooms/1/concert_hall.webp` — The Concert Hall
> A grand concert hall interior seen from the stage side, built around a **nine-foot black concert
> grand piano with its lid raised**, standing alone in a pool of light at center. Tiered rows of
> empty seats recede into soft shadow, a high coffered ceiling, tall arched windows. Polished floor
> reflecting the piano. Reverent, spacious, ivory-and-blue.

## `public/rooms/1/maestro_hallway.webp` — The Maestro Hallway
> A long **upper gallery corridor** seen down its length, one wall hung with a row of **ten framed
> portraits** in gold frames (figures indistinct at this distance). Doors open off both sides, each
> with a small brass nameplate. A carved wooden balustrade on one side looks down into the hall
> below. A small posted notice on the wall. Warm lamplight, deep red carpet runner, hushed and
> dignified.

## `public/rooms/1/paige_workshop.webp` — Paige's Workshop
> A percussion studio and artificer's workshop combined. Along one wall, **four gleaming copper
> timpani**; a concert snare drum on its stand; an **auxiliary station bristling with triangles,
> tambourines, woodblocks and cymbals**; and a **xylophone** catching the light. In the middle sits
> a cluttered **workbench** covered in instruments in pieces, each tagged with a paper label, plus
> tools, springs and coils of wire. A woman in work clothes with **goggles pushed up onto her
> forehead** looks up from the bench, grinning. Bright, busy, workshop-warm.

## `public/rooms/1/single_reed_sanctum.webp` — The Single Reed Sanctum
> A warm, close studio lined with shelves of **cane reeds, numbered and dated in little boxes**, and
> cork-grease tins. On one side a man sits at a bench **shaving a reed to a razor edge with a small
> knife**; across the room a **wooden target is studded with reeds embedded in it like thrown
> throwing-stars**. In the far corner a poised figure with platinum hair plays an alto saxophone,
> calm and unhurried, sheet music on a stand beside her. Cozy amber light, wood tones, faint haze.

## `public/rooms/1/brassatorium.webp` — The Brassatorium
> A **high, echoing brass hall** with a vaulted ceiling built for big sound, pale stone walls and a
> wide polished floor. Along one wall stand **four instrument racks — three of them conspicuously
> empty**, one holding a gleaming trumpet. At a desk to one side, a blond man in a cream-and-gold
> coat is bent over manuscript paper, **composing**, quill in hand, mouth open mid-hum. Tall windows,
> bright and resonant, brass glinting.

## `public/rooms/1/temple_of_sound.webp` — The Temple of Sound
> A small **shrine-like chamber at the top of a narrow stair** — a mystical temple to music itself.
> Incense haze hangs in shafts of colored light from a stained-glass window; **candles** burn on
> stone ledges; faint concentric rings of light ripple outward from the center as if the air itself
> were resonating. On a low altar rests a **single steel tuning fork on a velvet cushion beneath a
> candle**. A serene robed figure with silver hair sits in perfect stillness, shaping a double reed
> by hand. Lavender, teal and candle-gold; sacred and hushed.

## `public/rooms/1/headmaster_office.webp` — The Headmaster's Office
> A warm, lamplit headmaster's study: floor-to-ceiling shelves of scores and bound books, a big
> wooden desk stacked with papers, and a **great arched window overlooking a green valley** with a
> distant golden city. A kindly older man with greying hair, in a fine coat, sits at the desk having
> just set down his pen mid-sentence, straightening his collar and smiling. A **carved Academy seal
> — a treble clef crossed with a quill —** mounted on the wall. Cozy, golden, safe.

## `public/rooms/1/music_history_classroom.webp` — The Music History Classroom
> A classroom with **tiered wooden desks** facing forward. The entire long front wall is a painted
> **mural**: ten robed musicians on a golden stage with a conductor's baton raised above them, and
> beneath it a **long painted timeline** of small illustrated panels running the width of the wall.
> Dust motes turn gold in slanting window light. Scholarly, quiet, warm ivory and faded fresco
> colors.

## `public/rooms/1/practice_rooms.webp` — The Practice Rooms
> A corridor lined with a **warren of small practice-room doors**, each with a little window,
> seen down its length. Reeds soak in cups on a side shelf; a **cabinet of wind-up pendulum
> metronomes** stands against one wall; a mop and bucket lean nearby. Warm light spills from the
> nearer doorways — but the **door at the very end of the hall is dark**, and the shadow around it
> pools unnaturally, sound seeming to die as it approaches. Slightly eerie despite the cheerful
> foreground. Cool blues and greys with warm accents.

## `public/rooms/1/recital_hall.webp` — The Recital Hall
> A modest recital hall seen from the back of the house: rows of **empty red velvet seats** facing a
> raised wooden stage with a plain backdrop and warm footlights. **Small brass plates on the front-row
> seat backs.** Center stage, two brass maestros stand facing each other **locked in a contest to
> hold a long low note** — a red-bearded dwarf with a trombone and an armored figure with a tuba,
> both red-faced and puffed out, neither giving way. Warm, intimate, faintly ridiculous.

---

# Zone 2 — Library, listening & theory

## `public/rooms/2/library.webp` — The Library
> A tall academy library: **leaning shelves crammed with books**, rolling ladders, and shafts of
> dusty light. A **card catalog cabinet** stands in the foreground, one drawer open. Deep reading
> chairs; at one a bearded man in a fur-collared coat reads with a bassoon propped beside him. At a
> corner table a boy sits half-buried behind a **tower of stacked histories**, spare reeds tucked
> behind one ear. A librarian reshelves in the middle distance. Down one aisle at the back the light
> **fails into a strange violet dark**. Lavender, deep teal, parchment ivory.

## `public/rooms/2/listening_room.webp` — The Listening Room
> A hushed little listening room, walls lined with **brass gramophone horns and racks of wax
> cylinders**. Padded chairs, thick carpet, a set of **headphones on a stand**. To one side stands a
> **locked wooden cabinet stencilled "ARCHIVE"** with a keyhole plate. A relaxed student in a loose
> shirt sprawls in a chair with an alto saxophone across his lap and one headphone lifted off an
> ear, half the cylinders pulled out around him. Warm brass, soft plum and cream; snug and quiet.

## `public/rooms/2/theory_classroom.webp` — The Theory Classroom
> A music theory classroom: **slate blackboards ghosted with chalk circles of fifths** and
> half-erased notation, walls hung with faded old scores in frames, rows of desks with a **stack of
> graded exercises marked in violet ink** on the front one. Tall windows along one side. By the
> window stands a small, very nervous young student with a piccolo, hugging it to her chest and
> visibly working up her nerve. Chalk dust in the light. Cool lavender-grey and ivory, academic and
> a little tense.

---

## Delivery checklist

- [ ] 23 images, 16:9, named exactly as the headings above.
- [ ] Dropped into `public/rooms/1/` (20) and `public/rooms/2/` (3).
- [ ] Converted to WebP, ~1280px wide, q0.9.
- [ ] Spot-check in game: art replaces the emoji placeholder, nothing letterboxed or badly cropped.
