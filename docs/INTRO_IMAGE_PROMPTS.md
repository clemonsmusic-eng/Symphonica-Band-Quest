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

## Scene 2 — The Renewal, conducted by a young Fennelio *(regenerate)*

**Attach:** the **scene-4 image** (for the stage), the **"maestros on stage" image** (for the seating
layout), and the character sheet.

> A grand Final Fantasy VI-style pixel scene, seen wide from the audience. Use the ornate concert-hall
> STAGE from the attached scene-4 reference — tall gilded columns, swagged red-and-blue curtains,
> arched windows, flower urns, a raised circular tan-tiled stage with a low central podium, and rows
> of blue-and-gold audience chairs in the foreground. On the stage, the ten Maestros perform the Grand
> Symphony, seated in a two-row semicircle in the SAME positions as the attached "maestros on stage"
> reference. Front row, left to right: a woman with auburn hair and a flute; a silver-haired elf in a
> blue-and-white robe with an oboe; [the conductor]; a dark-skinned man in a green coat with a
> clarinet; a bearded man in a fur-collared coat with a bassoon. Back row, left to right: a figure
> with platinum hair and an alto saxophone; a blond man in cream-and-gold with a trumpet; a man in
> olive-green with a french horn; an armored figure with a tuba; a red-bearded dwarf with a trombone;
> a goggled percussionist at a drum kit. At the center podium, back to us, stands the CONDUCTOR — a
> **younger Fennelio** (brown hair only lightly greying, dignified, in a conductor's coat), baton
> raised mid-downbeat. IMPORTANT: render Fennelio and ALL ten Maestros noticeably YOUNGER than in the
> other scenes — this is an earlier era. Warm gold-and-ivory light, festive and reverent. Authentic
> 16-bit pixel art.

> *The intro is an **origin/setup** story — it ends before the Shattering (which the player
> experiences at the end of Act 1). Scenes 1–2 are already generated and kept; scenes 3–6 below are
> new.*

## Scene 3 — Vexus, alight, studying the ten Scores at night

> A quiet, late-night Final Fantasy VI-style pixel interior: a young, passionate dark-haired
> conductor — Vexus — in shirtsleeves, leaning eagerly over a wide desk where the ten original Sacred
> Scores are spread open, more pinned to the walls around him. He is alight with excitement, eyes
> bright, a quill in one hand and a score half-lifted in the other, utterly absorbed and joyful in
> his study. Warm candlelight, cozy ink-and-paper clutter; in the doorway behind him the elderly
> Headmaster Fennelio looks on with a proud, approving smile. Hopeful and warm — this is admirable
> passion, NOT sinister, not yet obsession. Authentic 16-bit pixel art, bright warm palette.

## Scene 4 — Fennelio passes the baton and steps down

> A tender Final Fantasy VI-style pixel scene on the grand academy stage: the elderly Headmaster
> Fennelio, in dark robes, placing a thin conductor's baton into the hands of the younger Vexus and
> stepping back from the podium, relinquishing it. Vexus receives it half-bowing, overcome with
> gratitude, eyes shining. Behind them the ten Maestros look on warmly. A passing-of-the-torch
> moment — warm gold and cream light, emotional and reverent. Vexus is sympathetic here, not a
> villain. Authentic 16-bit pixel art.

## Scene 5 — Fennelio opens the Academy with the Maestros as teachers

> A bright, celebratory Final Fantasy VI-style pixel scene: the grand opening of Harmonia Academy — a
> pale-stone-and-gold music school on a green hill, banners flying, doors thrown open. In the
> foreground the elderly Fennelio, in robes and a graduation cap, gestures welcomingly toward the
> school; beside and behind him stand the ten Maestros, each with their instrument (flute, oboe,
> clarinet, bassoon, alto sax, trumpet, french horn, tuba, trombone, percussion), arrayed as the
> founding faculty. Young students arrive through the gates with instrument cases. Golden morning
> light, hopeful, the founding of a legacy. Authentic 16-bit pixel art, bright airy palette.

## Scene 6 — You, the new student, arrive at dawn

> A hopeful, light-filled Final Fantasy VI-style pixel scene: a young student-musician (the player
> character) arriving at the gates of Harmonia Academy at dawn, instrument case in hand, gazing up at
> the golden school ahead with excitement; other new students file in around them. Bright sky-blue
> and ivory palette, warm morning sun, the optimistic beginning of a journey. Authentic 16-bit pixel
> art.

---

## Mapping to the intro beats

| Scene | Intro beat (`IntroSequence.tsx`) | Emoji | Art status |
|---|---|---|---|
| 1 | The Composer creates Symphonica & the Grand Symphony | ✍️ | kept (`scene1.webp`) |
| 2 | The Renewal, conducted by a young Fennelio | 🎼 | **regenerate** (`scene2.webp`) |
| 3 | Vexus alight over the ten Scores; Fennelio impressed | 📜 | **new** |
| 4 | Fennelio passes the baton to Vexus & steps down | 🤝 | **new** |
| 5 | Fennelio opens the Academy, the ten Maestros as teachers | 🏛️ | **new** |
| 6 | You — the Academy's newest student; first lesson | 🎺 | **new** |

## Wiring generated art into the intro

Scenes 1–2 are already wired. For the new scenes 3–6: generate each, optimize to ~1280px WebP,
drop them in `public/intro/` as `scene3.webp`…`scene6.webp`, and they'll replace the emoji fallback
in `src/components/world/IntroSequence.tsx` (the `image` field is already stubbed to add). Generate
at 16:9 (or crop on import) to fit the intro panel. (The old shattering-themed `scene3–6.webp` are
no longer referenced by the intro; reuse or overwrite them.)
