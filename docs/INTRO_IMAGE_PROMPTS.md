# Intro Sequence — AI Image Prompts

Key-art prompts for the six beats of the story intro (`src/components/world/IntroSequence.tsx`),
to be generated as **16-bit SNES / Final Fantasy VI-style pixel art** and wired in as a per-beat
`image`. Written for **ChatGPT's image generator** (GPT-4o / DALL·E).

Style target: bright, airy pixel art — **not** the dark painterly `docs/assets/maestros_reference.png`.
Match the in-game sprite look in `docs/assets/character_sheet.png` and `public/portraits/*.png`.

## How to run it in ChatGPT

1. Start one chat and **upload `docs/assets/character_sheet.png`** (plus any relevant
   `public/portraits/*.png`). Tell it: *"These are my established characters in my game's
   pixel-art style. Match their designs and this exact art style in the images I ask for next."*
2. Ask for **landscape / wide format** (ChatGPT's widest is ~1536×1024; crop to 16:9 on import).
3. Generate **one scene per message, in the same chat**, so character + style consistency carries
   forward. After image 1 you can say *"same characters and style, next scene:"* and paste the next.

## Master style directive (paste once at the top of the chat)

> Render every image as authentic 16-bit SNES pixel art, like a real screenshot from Final Fantasy
> VI (1994): visible square pixels, no anti-aliasing, no smooth gradients, dithered shading, a
> deliberately limited palette. Keep the palette LIGHT and airy — sky blue, ivory, teal, soft rose,
> lavender, pale mint — using warm gold only as a rare accent, never brown-dominant or dark. Wide
> landscape composition, cinematic JRPG cutscene framing, no text, no UI, no watermark.

---

## Scene 1 — The Composer writes the world into being

> A wide, luminous pixel-art cosmic scene. In the lower foreground, a tall robed Composer figure
> stands with their back to us, a glowing quill raised in one hand. From the quill, bright
> cyan-and-white musical staff lines flow upward and outward, curling across a pale star-flecked sky
> and blossoming into a newborn world — floating green islands, pastel-blue seas, tiny distant
> spires — all forming out of the sheet-music lines. Soft radiant white light, a sense of gentle
> creation and wonder. Light lavender-and-blue background, ivory highlights, minimal gold. Authentic
> 16-bit pixel art, dithered glow.

## Scene 2 — The ten Maestros perform the Renewal

> A bright Final Fantasy VI opera-house stage, seen wide from the audience. Ten master-musician
> pixel sprites playing their instruments while sitting in chairs in two rows across a grand
> cream-and-teal theater stage under soft pale spotlights. Front row from left to right: a woman
> with auburn curls in a cream gown with a flute; and a tall silver-haired elf in a blue-and-white
> striped robe holding an oboe; a dark-skinned man in a teal-green embroidered coat with a clarinet;
> a pale dark-haired man in a grey fur-collared coat holding a bassoon on his right side. Row two
> left to right: a slender figure with long platinum hair in a slim midnight-blue coat holding an
> alto saxophone, a blond man in a cream-and-gold star-patterned robe with a trumpet; a bearded man
> in olive-green robes with a coiled french horn; a huge blond-bearded knight in bright silver plate
> armor cradling a big brass tuba; a stout red-bearded dwarf in ornate armor playing a trombone; a
> woman with brass goggles and curly dark hair at a multi-drum percussion rig. In front of them,
> they all face inwards towards a tall slim conductor in a dark tailcoat raises a baton. Festive,
> reverent, luminous, pale-gold and ivory light. Authentic 16-bit pixel art.

## Scene 3 — Vexus secretly threads in the tritones

> A quiet, cool-toned pixel-art interior at night, backstage. A gaunt conductor, Vexus, sits hunched
> at a wooden writing desk, quill in hand, secretly re-inking a musical score. The notes he writes
> glow a sickly violet and visibly warp and crack the staff lines around them, thin fractures of pale
> purple light leaking off the page. A single small candle gives just a little warm light; the rest
> of the room is soft blue shadow and dithered darkness. Obsessive, secretive mood — but the palette
> stays light-to-mid, dominated by cool blues and violet, not black or brown. Authentic 16-bit pixel
> art.

## Scene 4 — The Score shatters at the Renewal

> A dramatic Final Fantasy VI-style cutscene on the bright theater stage. At center, the glowing
> Grand Symphony Score — a radiant floating sheet of music — violently bursts apart into ten jagged
> shards of white-and-violet light. Each shard streaks outward on a dithered beam and strikes one of
> the ten Maestro sprites, whose bodies flinch as pale corruption creeps over them; instruments
> tumble from their hands. A big bright bloom of pixel light at the point of shattering, radiating
> rays. High drama but LIGHT overall — brilliant whites, pale violet, sky-blue stage — not a dark
> scene. Authentic 16-bit pixel art.

## Scene 5 — The world grays; the students stay in color

> A wide pixel-art view of the grand hall the instant after the shattering, drained to soft ash-grey.
> The audience and faculty sprites are frozen mid-motion, colorless and statue-still; in the
> background the same ten Maestros from before loom as corrupted, shadowy and twisted silhouettes
> with glowing purple tinted eyes. The conductor is floating within his arms spread wide and a dark
> purple glow around him. In the foreground, standing out sharply, a small cluster of young student
> musicians in Academy cadet uniforms — a flute girl, a boy with a trombone and a banner, a clarinet
> boy, a percussionist with drumsticks, a big tuba student — all rendered in full bright color,
> instruments clutched close, wide-eyed. Strong contrast: muted grey world, vivid colorful students.
> Authentic 16-bit pixel art, dithered grey tones. The attached photo are established students in my
> game's pixel art style. Match their designs and this exact art style in the image.

## Scene 6 — You step forward

> A hopeful, light-filled Final Fantasy VI-style hero shot, slight low angle. A single, black
> silhouetted young student-musician (the player character) stands in the foreground in front of a
> small band of colorfully-dressed young graduates, instruments held ready, determined looks on their
> pixel face, as pale golden morning light breaks across them from the side. Behind them the greyed,
> broken hall; far in the distance, across a bright pixel sea under a soft blue sky, a small, dark and
> stormy jagged island silhouette — Discordia — pulses faintly with cool violet light. Optimistic,
> adventurous, the beginning of a journey. Bright sky-blue and ivory palette. Authentic 16-bit pixel
> art.

---

## Mapping to the intro beats

| Scene | Intro beat (`IntroSequence.tsx`) | Current emoji |
|---|---|---|
| 1 | The Composer wrote the world into being | ✍️ |
| 2 | Ten Maestros perform the Renewal under Vexus | 🎼 |
| 3 | Vexus threaded dissonant tritones through the Score | 🎭 |
| 4 | At the Renewal it curdled and shattered | 💥 |
| 5 | The world grays; only the newest students remain clear | 🌫️ |
| 6 | You are one of them — reclaim the ten Noteshards | 🎺 |

## Wiring generated art into the intro (todo)

Once the six images exist, drop them in `public/intro/` (e.g. `scene1.png`…`scene6.png`) and add an
`image` field to each beat in `src/components/world/IntroSequence.tsx`, rendered above the text.
Generate at 16:9 (or crop on import) to fit the intro panel.
