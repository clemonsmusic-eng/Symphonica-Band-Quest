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

> *The intro is an **origin/setup** story — it ends before the Shattering (which the player
> experiences at the end of Act 1). Scenes 1–2 are already generated and kept; scenes 3–6 below are
> new.*

## Scene 3 — Fennelio founds Harmonia Academy

> A bright Final Fantasy VI-style pixel scene: a grand pixel-art music academy — Harmonia Academy —
> of pale stone and gold on a green hill, banners flying, young students streaming in through the
> gates with instrument cases. In the foreground, a dignified elderly conductor, Fennelio, in dark
> academic robes and a graduation cap, one arm raised proudly toward the school he has built. Golden
> morning light, hopeful, the founding of a legacy. Authentic 16-bit pixel art, bright and airy
> palette.

## Scene 4 — Fennelio passes the baton to Vexus

> A tender Final Fantasy VI-style pixel scene on the academy stage: the elderly Headmaster Fennelio
> placing a thin conductor's baton into the hands of a younger man — Vexus, a passionate dark-haired
> conductor in a formal tailcoat. Vexus is overcome with gratitude, eyes shining, hands trembling as
> he receives it, half-bowing in thanks. Behind them the ten Maestros look on warmly. A
> passing-of-the-torch moment, warm gold and cream light, emotional and reverent — **Vexus is
> sympathetic here, not yet a villain.** Authentic 16-bit pixel art.

## Scene 5 — Vexus's obsession with the ten Scores

> A quiet, late-night Final Fantasy VI-style pixel interior: Vexus alone in his study off the
> rehearsal hall, the ten original Sacred Scores spread open across a wide desk and pinned to the
> walls around him. He leans over them by candlelight, quill in hand, feverish and absorbed,
> annotating — utterly obsessed. Cool blues and the faintest hint of violet creeping into the
> candle-glow (a first, subtle omen), but not yet corrupted. Intense, secretive,
> foreboding-but-still-human. Authentic 16-bit pixel art.

## Scene 6 — You, the new student

> A hopeful, light-filled Final Fantasy VI-style pixel scene: a young student-musician (the player
> character) arriving at the gates of Harmonia Academy at dawn, instrument case in hand, looking up
> at the golden school ahead with excitement; other new students file in around them. Bright sky-blue
> and ivory palette, warm morning sun, the optimistic beginning of a journey. Authentic 16-bit pixel
> art.

---

## Mapping to the intro beats

| Scene | Intro beat (`IntroSequence.tsx`) | Emoji | Art status |
|---|---|---|---|
| 1 | The Composer creates Symphonica & the Grand Symphony | ✍️ | kept (`scene1.webp`) |
| 2 | The Renewal, and the office of Conductor | 🎼 | kept (`scene2.webp`) |
| 3 | Fennelio founds Harmonia Academy | 🏛️ | **new** |
| 4 | Fennelio passes the baton to a grateful Vexus | 🤝 | **new** |
| 5 | Vexus's obsession with the ten Scores | 📜 | **new** |
| 6 | You — the Academy's newest student; first lesson | 🎺 | **new** |

## Wiring generated art into the intro

Scenes 1–2 are already wired. For the new scenes 3–6: generate each, optimize to ~1280px WebP,
drop them in `public/intro/` as `scene3.webp`…`scene6.webp`, and they'll replace the emoji fallback
in `src/components/world/IntroSequence.tsx` (the `image` field is already stubbed to add). Generate
at 16:9 (or crop on import) to fit the intro panel. (The old shattering-themed `scene3–6.webp` are
no longer referenced by the intro; reuse or overwrite them.)
