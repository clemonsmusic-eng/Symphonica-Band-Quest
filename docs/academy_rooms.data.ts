// ─────────────────────────────────────────────────────────────────────────────
// Harmonia Academy — verbatim room content (23 rooms), exported from the design
// prototype. REFERENCE DATA for building src/lib/world/rooms.ts. Copy the prose
// (desc, hotspots, pickups, uses) exactly. Notes:
//  - `locationId`: per DECISION D1 (docs/LOCATION_DESIGN_HARMONIA.md), do NOT add
//    new GameLocations. Where this field is a room's own id below, remap it to the
//    room's zone primary cluster: Zone-1 -> "rehearsal_halls", Zone-2 ->
//    "theory_wing". The six real mappings (rehearsal_hall/recital_hall ->
//    rehearsal_halls, practice_rooms -> practice_rooms, theory_classroom ->
//    theory_wing, library/listening_room -> library_stacks) stay as-is.
//  - `zoneId`: Boot Camp = 1, Theory (theory_classroom/library/listening_room) = 2.
//    Per DECISION D2 the Academy is ONE building; zoneId gates CONTENT (Zone-2
//    activities lock until currentZone>=2), it does NOT split the map.
//  - Hotspot HOOKS are encoded in the response text in parentheses, e.g.
//    "(Zone 1 required challenges.)", "(Rest Wraith mini-boss.)",
//    "(Boot Camp graduation gate.)", "(Quest: The Squeaky Door.)". Wire these to
//    the real challengeId/battleId/gate/quest per docs/ROOMVIEW_BUILD_SPEC.md.
// ─────────────────────────────────────────────────────────────────────────────

export const ITEMS = {
  "fork": {
    "icon": "🔱",
    "name": "Tuning Fork"
  },
  "card": {
    "icon": "🔖",
    "name": "Library Card"
  },
  "flower": {
    "icon": "🌸",
    "name": "Pressed Flower"
  },
  "pretzel": {
    "icon": "🥨",
    "name": "Warm Pretzel"
  }
} as const;

export const ACADEMY_EDGES = [
  {
    "a": "entry_gate",
    "b": "courtyard"
  },
  {
    "a": "courtyard",
    "b": "garden"
  },
  {
    "a": "courtyard",
    "b": "reflecting_pond"
  },
  {
    "a": "courtyard",
    "b": "main_hall"
  },
  {
    "a": "main_hall",
    "b": "dining_hall"
  },
  {
    "a": "main_hall",
    "b": "dormitory"
  },
  {
    "a": "main_hall",
    "b": "concert_hall"
  },
  {
    "a": "main_hall",
    "b": "recital_hall"
  },
  {
    "a": "main_hall",
    "b": "practice_rooms"
  },
  {
    "a": "main_hall",
    "b": "theory_classroom"
  },
  {
    "a": "main_hall",
    "b": "maestro_hallway"
  },
  {
    "a": "concert_hall",
    "b": "rehearsal_hall"
  },
  {
    "a": "rehearsal_hall",
    "b": "maestro_hallway"
  },
  {
    "a": "rehearsal_hall",
    "b": "vexus_office"
  },
  {
    "a": "maestro_hallway",
    "b": "headmaster_office"
  },
  {
    "a": "maestro_hallway",
    "b": "clinic"
  },
  {
    "a": "maestro_hallway",
    "b": "library"
  },
  {
    "a": "maestro_hallway",
    "b": "music_history_classroom"
  },
  {
    "a": "maestro_hallway",
    "b": "paige_workshop"
  },
  {
    "a": "maestro_hallway",
    "b": "single_reed_sanctum"
  },
  {
    "a": "maestro_hallway",
    "b": "brassatorium"
  },
  {
    "a": "library",
    "b": "listening_room"
  },
  {
    "a": "recital_hall",
    "b": "temple_of_sound"
  }
] as const;

export const ACADEMY_ROOMS = [
  {
    "id": "entry_gate",
    "name": "The Entry Gate",
    "short": "Gate",
    "emoji": "⛩️",
    "tint": "#3f6d55",
    "zoneId": 1,
    "locationId": "entry_gate",
    "map": [
      50,
      95
    ],
    "tag": "entrance",
    "desc": "You stand at the wrought-iron gate of Harmonia Academy. Behind you the road winds down into the valley, where the city of Concerta glows gold. Ahead, the courtyard opens beneath the arches.",
    "npcs": [],
    "hotspots": [
      {
        "verb": "Look",
        "object": "at Concerta below",
        "response": "Far down the valley, banners flutter over the metropolis. One day, they say, the whole world will run on music like yours."
      },
      {
        "verb": "Look",
        "object": "at the gate",
        "response": "Wrought iron in the shape of a treble clef. A century of students has passed beneath it. Now it's your turn."
      }
    ]
  },
  {
    "id": "courtyard",
    "name": "The Courtyard",
    "short": "Courtyard",
    "emoji": "🏛️",
    "tint": "#3f6d55",
    "zoneId": 1,
    "locationId": "courtyard",
    "map": [
      49,
      80
    ],
    "tag": "hub · outdoor",
    "desc": "Worn flagstones fan out beneath stone arches. Students crisscross with instrument cases — but Piper and Cora stand stock-still before the statue of The Composer, heads tipped back in wonder.",
    "npcs": [
      "Piper",
      "Cora"
    ],
    "hotspots": [
      {
        "verb": "Look",
        "object": "at the statue",
        "response": "A weathered figure of The Composer, quill raised. The plaque reads: “All the world, from a single score.”"
      },
      {
        "verb": "Talk",
        "object": "to Piper and Cora",
        "response": "The two stand shoulder to shoulder at the statue's foot. “All of it,” Piper breathes. “The whole world, from one person's music.” Cora only nods, lost in the beauty of the thing. (Recruitable classmates.)"
      }
    ]
  },
  {
    "id": "garden",
    "name": "The Garden",
    "short": "Garden",
    "emoji": "🌸",
    "tint": "#3f6d55",
    "zoneId": 1,
    "locationId": "garden",
    "map": [
      29,
      88
    ],
    "tag": "quiet · outdoor",
    "desc": "A walled square of green off the courtyard. A stone bench sits beneath a flowering tree, and the din of the Academy fades to birdsong — and the french horn maestro, Waldhorn, strolling the path with his hands behind his back.",
    "npcs": [
      "Maestro Waldhorn"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Maestro Waldhorn",
        "response": "“I do my best listening out here,” the horn maestro says. “A horn is mostly waiting for the right moment to speak. So is a garden.”"
      },
      {
        "verb": "Sit",
        "object": "on the bench",
        "response": "For a moment there is no lesson, no contest, no Renewal — just birdsong and Waldhorn, somewhere down the path, finally getting the phrase right."
      },
      {
        "verb": "Look",
        "object": "at the old tree",
        "response": "A plaque among the roots: “Planted the year of the first Renewal. It has not missed a spring since.”"
      }
    ],
    "pickups": [
      {
        "id": "flower",
        "icon": "🌸",
        "label": "a blossom from the tree",
        "response": "You tuck a single flower behind your case. It smells faintly of the very first spring."
      }
    ]
  },
  {
    "id": "reflecting_pond",
    "name": "The Reflecting Pond",
    "short": "Pond",
    "emoji": "💧",
    "tint": "#3f6d55",
    "zoneId": 1,
    "locationId": "reflecting_pond",
    "map": [
      70,
      80
    ],
    "tag": "quiet · outdoor",
    "desc": "A still black pool off the courtyard, holding the sky and the Academy's spires upside down. Koi drift beneath the surface, and Obie sits at the water's edge, oboe across their knees.",
    "npcs": [
      "Obie"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Obie",
        "response": "“Reflective mood,” Obie admits, watching the koi — then breaks into a grin. “Cheerful one, though. Someone has to give the world its tuning A.” (Recruitable classmate.)"
      },
      {
        "verb": "Look",
        "object": "into the water",
        "response": "The pond holds everything perfectly still — until, for half a breath, your reflection seems to ripple the wrong way. Then it's just water again."
      },
      {
        "verb": "Toss",
        "object": "a coin",
        "response": "It sinks without a sound. A first-year swears the pond only grants wishes made in tune."
      }
    ]
  },
  {
    "id": "main_hall",
    "name": "The Main Hall",
    "short": "Main Hall",
    "emoji": "🕯️",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "main_hall",
    "map": [
      52,
      63
    ],
    "tag": "hub",
    "desc": "The Academy's great central corridor, two storeys tall and hung with colors. Every wing opens off it: performance halls, the theory rooms, the library, and the stair to the Maestros' floor.",
    "npcs": [],
    "hotspots": [
      {
        "verb": "Read",
        "object": "the Quest Board",
        "response": "A noticeboard by the stair is pinned thick with parchment. Two favors today: <em>Reeda</em> needs a clean scale for a squeaky door, and <em>Tick</em> wants a steady pulse to true the metronomes. (Side-quest hub.)"
      },
      {
        "verb": "Look",
        "object": "at the banner",
        "response": "The Academy's colors hang the full height of the hall — a treble clef crossed with a quill."
      },
      {
        "verb": "Read",
        "object": "the directory",
        "response": "Arrows to every wing: rehearsal and recital along the corridor, theory and library to the sides, the Maestros' hall above."
      },
      {
        "verb": "Listen",
        "object": "to the Academy",
        "response": "Somewhere a scale is climbing, somewhere a reed squeaks, somewhere a timpani rolls like far-off thunder. The whole building is always, quietly, playing."
      }
    ]
  },
  {
    "id": "dining_hall",
    "name": "The Dining Hall",
    "short": "Dining",
    "emoji": "🍽️",
    "tint": "#8a5a2a",
    "zoneId": 1,
    "locationId": "dining_hall",
    "map": [
      9,
      63
    ],
    "tag": "social",
    "desc": "Long tables, the clatter of trays, and the smell of something baked. Tommy and Otto are parked at the nearest table behind full plates — as, somehow, they always are. A hand-lettered sign is tacked by the door.",
    "npcs": [
      "Tommy",
      "Otto"
    ],
    "hotspots": [
      {
        "verb": "Read",
        "object": "the sign",
        "response": "“THE CONCERTA INVITATIONAL — tryouts posted after Boot Camp. Four schools. One trophy.” (Foreshadows Zone 3.)"
      },
      {
        "verb": "Talk",
        "object": "to Tommy and Otto",
        "response": "“Are we late for lunch,” Tommy wonders through a mouthful, “or early for dinner?” Otto shrugs, unbothered, and keeps eating. Nobody has ever seen this hall without the two of them in it. (Recruitable classmates.)"
      }
    ],
    "pickups": [
      {
        "id": "pretzel",
        "icon": "🥨",
        "label": "a warm pretzel",
        "response": "The kid behind the counter waves off your coins. “First one's free for Academy folks.” It's still warm."
      }
    ]
  },
  {
    "id": "dormitory",
    "name": "The Dormitory",
    "short": "Dormitory",
    "emoji": "🛏️",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "dormitory",
    "map": [
      21,
      47
    ],
    "tag": "rest · classmates",
    "desc": "Bunks and battered practice chairs, posters of touring ensembles, cases open everywhere. Gene sits cross-legged on a bunk, a scatter of little instruments spread across the blanket in front of him.",
    "npcs": [
      "Gene"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Gene",
        "response": "Gene is tinkering with a handful of auxiliary instruments — a woodblock, finger cymbals, a kazoo of dubious legality. “Making a few things to show Paige,” he says without looking up. “She's the only one who gets it.” (Recruitable classmate.)"
      },
      {
        "verb": "Rest",
        "object": "at your bunk",
        "response": "You sit and let the day settle. A safe place to mend and save."
      }
    ]
  },
  {
    "id": "library",
    "name": "The Library",
    "short": "Library",
    "emoji": "📚",
    "tint": "#6a5a8a",
    "zoneId": 2,
    "locationId": "library_stacks",
    "map": [
      13,
      32
    ],
    "tag": "Fagotto · bassoon · Zone 2",
    "desc": "The bassoon maestro's domain: shelves leaning tall, a low reedy hum somewhere in the stacks. Maestro Fagotto reads in a deep chair; Dr. Sol reshelves by ear; and at a corner table Reed sits half-buried behind a tower of histories. In the catalog, one interval is struck through again and again.",
    "npcs": [
      "Maestro Fagotto",
      "Dr. Sol",
      "Reed"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Dr. Sol",
        "response": "“Someone reshelved the interval drills by ear instead of by label. I need good ears to sort the perfect fifths from the impostors.” (Quest: The Misfiled Interval.)"
      },
      {
        "verb": "Talk",
        "object": "to Reed",
        "response": "Reed doesn't look up from his stack. “Did you know the first Renewal was six hundred years ago?” he says, three spare reeds behind one ear. “I'm only up to the second. The whole history of Symphonica is in here.” (Recruitable classmate.)"
      },
      {
        "verb": "Talk",
        "object": "to Maestro Fagotto",
        "response": "The bassoon maestro barely looks up. “The oldest music is the truest. Mind the sealed archive — some of it should stay shut.” (Foreshadows the Shattering.)"
      },
      {
        "verb": "Look",
        "object": "at the catalog",
        "response": "Every entry for one interval is struck through in red. The tritone — the “devil in music.”"
      },
      {
        "verb": "Follow",
        "object": "the echo",
        "response": "Down a dark aisle a tritone still rings from nowhere. Something was mis-played here, and it hasn't resolved. (Interval Imp lurks.)",
        "danger": true
      }
    ],
    "pickups": [
      {
        "id": "card",
        "icon": "🔖",
        "label": "a borrowing card",
        "response": "Dr. Sol stamps a card and slides it across the desk. “Now you can take things out. Bring them back.”"
      }
    ]
  },
  {
    "id": "listening_room",
    "name": "The Listening Room",
    "short": "Listening",
    "emoji": "🎧",
    "tint": "#6a5a8a",
    "zoneId": 2,
    "locationId": "library_stacks",
    "map": [
      7,
      24
    ],
    "tag": "aural training",
    "desc": "A hush of a room off the library, walls lined with brass gramophones and listening horns. Zoot has half the jazz cylinders out at once, alto sax resting in his lap.",
    "npcs": [
      "Zoot"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Zoot",
        "response": "Zoot lifts one headphone. “You can't know you're improvising something new,” he says, “unless you know what's come before.” He nods at the racks of old recordings. “So I'm doing my homework.” (Recruitable classmate.)"
      },
      {
        "verb": "Put on",
        "object": "the headphones",
        "response": "Slip them on to train your ear — pitch, rhythm, intervals. (Aural challenges live here.)"
      },
      {
        "verb": "Browse",
        "object": "the recordings",
        "response": "Cylinders of every Renewal on record. The oldest ones hiss, but the music underneath is perfect."
      }
    ],
    "uses": [
      {
        "needs": "card",
        "verb": "Play",
        "object": "the sealed cylinder",
        "success": "Your borrowing card opens the locked ARCHIVE cabinet. The oldest Renewal on record crackles to life — and for one long minute the room is unbearably beautiful.",
        "missing": "One cabinet stands locked, stencilled ARCHIVE. You'd need a library card to open it."
      }
    ]
  },
  {
    "id": "clinic",
    "name": "The Clinic",
    "short": "Clinic",
    "emoji": "⛑️",
    "tint": "#3f6d70",
    "zoneId": 1,
    "locationId": "clinic",
    "map": [
      14,
      12
    ],
    "tag": "Flaura · flute · heal",
    "desc": "The flute maestro's studio doubles as the Academy infirmary — sunlit, lined with warm-up etudes and white cots. Maestra Flaura moves between a music stand and a medicine cabinet with equal ease.",
    "npcs": [
      "Maestra Flaura"
    ],
    "hotspots": [
      {
        "verb": "Rest",
        "object": "and mend",
        "response": "Flaura waves you to a cot. A few minutes of her breathing exercises and your wind comes back. (Restores HP.)"
      },
      {
        "verb": "Talk",
        "object": "to Maestra Flaura",
        "response": "“Breath is breath,” the flute maestro says, “whether you're playing or healing. More students in lately, though — just tired. Grey around the edges.” (Quiet foreshadow.)"
      }
    ]
  },
  {
    "id": "rehearsal_hall",
    "name": "The Rehearsal Hall",
    "short": "Rehearsal",
    "emoji": "🎻",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "rehearsal_halls",
    "map": [
      46,
      30
    ],
    "tag": "Zone 1 · rehearsal_halls",
    "desc": "Stone arches and worn floors echo with a hundred instruments; music stands wait in ranks. This is the ensemble hall, where the class rehearses under the Conductor's baton — and where Boot Camp is won, one fundamental at a time. A door at the back leads to Vexus's office.",
    "npcs": [],
    "hotspots": [
      {
        "verb": "Look",
        "object": "at the challenge stands",
        "response": "Today's fundamentals: the Concert B♭ scale, long tones, 4/4 rhythm, articulation. Master them to graduate Boot Camp. (Zone 1 required challenges.)"
      },
      {
        "verb": "Look",
        "object": "at the conductor's podium",
        "response": "Empty just now, baton laid across the stand. Vexus takes it up whenever the full class assembles."
      }
    ]
  },
  {
    "id": "vexus_office",
    "name": "Vexus's Office",
    "short": "Vexus",
    "emoji": "🖋️",
    "tint": "#6a5a8a",
    "zoneId": 1,
    "locationId": "vexus_office",
    "map": [
      31,
      23
    ],
    "tag": "Vexus · theory & conducting",
    "desc": "A narrow study off the rehearsal hall, every surface stacked with scores. Vexus — the Academy's master of theory and conducting — sits at the center of it, annotating the ten original Renewal scores in a hand too fast to follow.",
    "npcs": [
      "Vexus"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Vexus",
        "response": "The Conductor does not look up from the pages. “Beautiful,” he murmurs, “but timid. The Composer left so much unresolved.” (Foreshadows the Shattering.)"
      },
      {
        "verb": "Look",
        "object": "at the ten scores",
        "response": "The ten Sacred Scores of the Renewal, spread open — and every one scored over in violet ink, ‘corrected.’"
      }
    ]
  },
  {
    "id": "concert_hall",
    "name": "The Concert Hall",
    "short": "Concert",
    "emoji": "🎹",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "concert_hall",
    "map": [
      46,
      47
    ],
    "tag": "performance",
    "desc": "A grand hall around a nine-foot concert grand, lid raised, waiting. The acoustics swallow your footsteps and hand them back as music.",
    "npcs": [],
    "hotspots": [
      {
        "verb": "Look",
        "object": "at the grand piano",
        "response": "This is where the class first sounds like one ensemble instead of thirty students."
      },
      {
        "verb": "Stand",
        "object": "center stage",
        "response": "Big performances happen here — the Winter Concert, and one day, the Renewal itself. (Zone 2 ensemble performances.)"
      }
    ],
    "uses": [
      {
        "needs": "fork",
        "verb": "Tune",
        "object": "the concert grand",
        "success": "You strike your tuning fork against the frame and bring the great piano true. It rings back, perfect — the whole hall seems to lean in to listen.",
        "missing": "The grand sits a hair flat, and you've nothing to tune it against. (You'd need a true reference pitch — a tuning fork.)"
      }
    ]
  },
  {
    "id": "maestro_hallway",
    "name": "The Maestro Hallway",
    "short": "Maestro Hall",
    "emoji": "🎼",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "maestro_hallway",
    "map": [
      49,
      19
    ],
    "tag": "lore · corridor",
    "desc": "A long upper gallery hung with portraits of the ten Maestros. The section leaders' offices open off it by family — Paige's workshop, the Single Reed Sanctum, the Brassatorium — with the flute maestro's clinic and the bassoon maestro's library at either end.",
    "npcs": [],
    "hotspots": [
      {
        "verb": "Look",
        "object": "at the portraits",
        "response": "The ten section leaders who perform the Renewal each year, and who trained everyone you know."
      },
      {
        "verb": "Read",
        "object": "the Renewal notice",
        "response": "“Renewal rehearsals — CLOSED to students. The Maestros thank you for your silence.”"
      }
    ]
  },
  {
    "id": "paige_workshop",
    "name": "Paige's Workshop",
    "short": "Workshop",
    "emoji": "🥁",
    "tint": "#8a5a2a",
    "zoneId": 1,
    "locationId": "paige_workshop",
    "map": [
      30,
      6
    ],
    "tag": "Paige · percussion",
    "desc": "A full concert percussion setup fills the room: timpani gleaming along one wall, a snare on its stand, an auxiliary station bristling with triangles, tambourines and woodblocks, and a xylophone catching the light. Between it all sits an artificer's workbench. Maestra Paige looks up, goggles pushed onto her forehead.",
    "npcs": [
      "Maestra Paige"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Maestra Paige",
        "response": "“Percussion's just engineering you can dance to,” she grins. “Bring me broken gear someday and I'll make it sing.” (Foreshadows Paige's Grand Artificer forge in Concerta.)"
      },
      {
        "verb": "Look",
        "object": "at the percussion setup",
        "response": "Timpani, snare, the auxiliary station, the xylophone — every color of sound in one room, and Paige tunes them all by ear."
      },
      {
        "verb": "Look",
        "object": "at the workbench",
        "response": "Instruments in pieces, each tagged with a student's name. She fixes everything eventually."
      }
    ]
  },
  {
    "id": "single_reed_sanctum",
    "name": "The Single Reed Sanctum",
    "short": "Single Reed",
    "emoji": "🎷",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "single_reed_sanctum",
    "map": [
      45,
      5
    ],
    "tag": "Clarence & Adolpha",
    "desc": "A warm, close room that smells of cane and cork grease. Clarence sits shaving reeds to a razor edge; a target across the room bristles with the ones he's flicked into it like throwing stars. In the corner, Adolpha runs scales — unhurried, and merciless.",
    "npcs": [
      "Maestro Clarence",
      "Maestra Adolpha"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Maestro Clarence",
        "response": "Clarence sights down a fresh reed and — with a flick of the wrist — buries it in the target beside a dozen others. “A single reed, a single breath, a single wrong note the whole hall hears,” he says mildly. “So we get it right.”"
      },
      {
        "verb": "Talk",
        "object": "to Maestra Adolpha",
        "response": "Without pausing, Adolpha runs a dominant-7th arpeggio through all twelve keys, then modal scales, at a tempo that should not be physically possible. “Rules first,” she says between breaths. “Then you learn which to bend. You're not there yet.”"
      },
      {
        "verb": "Look",
        "object": "at the reed benches",
        "response": "Hundreds of reeds, each numbered and dated — and a target studded with Clarence's rejects."
      }
    ]
  },
  {
    "id": "brassatorium",
    "name": "The Brassatorium",
    "short": "Brass",
    "emoji": "🎺",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "brassatorium",
    "map": [
      64,
      6
    ],
    "tag": "brass maestros",
    "desc": "A high, echoing hall built to take the full weight of brass — though today only one maestro is home. Cornelius, the trumpet maestro, is bent over a desk scoring a piece for brass ensemble, humming each part aloud as he writes.",
    "npcs": [
      "Cornelius"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Cornelius",
        "response": "“Trumpet gets the glory, but a brass choir is the real thing,” he says, still scribbling. “Four parts breathing as one. Here — tell me if this fanfare lands.”"
      },
      {
        "verb": "Look",
        "object": "at the empty racks",
        "response": "Three stands stand bare: Waldhorn's off in the garden, and Sackbut and Torbult are down in the recital hall, locked in some kind of contest."
      }
    ]
  },
  {
    "id": "temple_of_sound",
    "name": "The Temple of Sound",
    "short": "Temple",
    "emoji": "🛕",
    "tint": "#6a5a8a",
    "zoneId": 1,
    "locationId": "temple_of_sound",
    "map": [
      96,
      54
    ],
    "tag": "Hautbois · oboe · shrine",
    "desc": "Up a narrow stair off the recital hall, the light turns to incense-haze and candle-glow. Less an office than a shrine — a mystical temple to music itself, where Maestro Hautbois shapes a reed by hand in perfect stillness. When the orchestra tunes, the A is born here.",
    "npcs": [
      "Maestro Hautbois"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Maestro Hautbois",
        "response": "“Everyone tunes to the oboe,” the maestro says softly. “Not from pride — a double reed cannot retune mid-phrase. We simply have to be right the first time.”"
      },
      {
        "verb": "Sound",
        "object": "the sacred A",
        "response": "A single tuning fork rests on a velvet cushion beneath a candle. Strike it, and somewhere the whole Academy quietly adjusts to match."
      }
    ],
    "pickups": [
      {
        "id": "fork",
        "icon": "🔱",
        "label": "the spare tuning fork",
        "response": "Maestro Hautbois presses a plain steel fork into your hand. “A true A, to carry with you. Everything begins from a true note.”"
      }
    ]
  },
  {
    "id": "headmaster_office",
    "name": "The Headmaster's Office",
    "short": "Headmaster",
    "emoji": "🎓",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "headmaster_office",
    "map": [
      82,
      12
    ],
    "tag": "story",
    "desc": "Warm lamplight, shelves of scores, and a great window over the valley. Director Fennelio sets down his pen — mid-sentence in yet another treatise on the importance of a cohesive ensemble — and straightens his collar, grinning despite himself.",
    "npcs": [
      "Director Fennelio"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Director Fennelio",
        "response": "“Master your fundamentals and pass your first performance, and I'll call you a student of this Academy in truth. I'll be waiting when you're ready to graduate.”"
      },
      {
        "verb": "Ask",
        "object": "about the Grand Symphony",
        "response": "His smile turns wistful. “I conducted the very first Renewals, long ago. Then I handed my baton to Vexus and built this school instead — someone has to train the next ten Maestros.” (Fennelio: the founding Conductor, who passed his baton to Vexus.)"
      },
      {
        "verb": "Look",
        "object": "at the Academy seal",
        "response": "A treble clef crossed with a quill — the Composer's own mark, they say."
      }
    ]
  },
  {
    "id": "music_history_classroom",
    "name": "The Music History Classroom",
    "short": "History",
    "emoji": "📖",
    "tint": "#6a5a8a",
    "zoneId": 1,
    "locationId": "music_history_classroom",
    "map": [
      90,
      22
    ],
    "tag": "lore",
    "desc": "Tiered desks face a long wall painted with the Academy's history. Dust turns gold in the window light.",
    "npcs": [],
    "hotspots": [
      {
        "verb": "Read",
        "object": "the timeline",
        "response": "“The Composer wrote the world. The Grand Symphony holds it. Each year the Renewal sounds it whole.” Centuries of Renewals, unbroken."
      },
      {
        "verb": "Look",
        "object": "at the mural",
        "response": "The ten Maestros on a golden stage, a Conductor's baton raised over them. A small brass plate reads: “Vexus, Conductor.” (Foreshadows Vexus.)"
      }
    ]
  },
  {
    "id": "theory_classroom",
    "name": "The Theory Classroom",
    "short": "Theory",
    "emoji": "📐",
    "tint": "#6a5a8a",
    "zoneId": 2,
    "locationId": "theory_wing",
    "map": [
      86,
      31
    ],
    "tag": "Zone 2 · theory_wing",
    "desc": "Slate boards ghosted with circles of fifths, walls of faded pre-Shattering scores — the room where Vexus drills the class in theory, though the master himself is off in his office today. Only Piccola is here, hovering by the window, working up her nerve.",
    "npcs": [
      "Piccola"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Piccola",
        "response": "“My first solo is next week and I— I freeze. Could you just… play a phrase for me? Show me it's survivable?” (Quest: Stage Fright.)"
      },
      {
        "verb": "Read",
        "object": "the chalkboard",
        "response": "“Consonance resolves. Dissonance demands resolution.” Underlined twice, in Vexus's hand. (Zone 2 theory challenges.)"
      },
      {
        "verb": "Look",
        "object": "at the graded exercises",
        "response": "A stack of student work, each marked in violet ink. Vexus grades hard — and always toward more tension."
      }
    ],
    "uses": [
      {
        "needs": "flower",
        "verb": "Give",
        "object": "Piccola the flower",
        "success": "Piccola blinks at the blossom, then almost smiles. “Oh. For me?” Her shoulders come down an inch. “…Maybe I can do this after all.” (A small kindness.)",
        "missing": "",
        "consume": true
      }
    ]
  },
  {
    "id": "practice_rooms",
    "name": "The Practice Rooms",
    "short": "Practice",
    "emoji": "🎵",
    "tint": "#4a5470",
    "zoneId": 1,
    "locationId": "practice_rooms",
    "map": [
      85,
      46
    ],
    "tag": "Zone 1 · practice_rooms",
    "desc": "A warren of small rooms off the corridor. Reeds soak in cups, metronomes tick out of sync, and a strange hush pools in the corners. Reeda works a mop; Tick fusses over a cabinet of pendulums; and behind one door Benny drills the same fast run over and over.",
    "npcs": [
      "Reeda",
      "Tick",
      "Benny"
    ],
    "hotspots": [
      {
        "verb": "Talk",
        "object": "to Reeda",
        "response": "“Second room down — that door's squeaked since I was your age. Maybe it just wants to hear a clean scale for once.” (Quest: The Squeaky Door.)"
      },
      {
        "verb": "Talk",
        "object": "to Tick",
        "response": "“The wind-up metronomes have all drifted out of true. Tap me a rock-solid pulse and I'll calibrate the cabinet.” (Quest: Keeping Time.)"
      },
      {
        "verb": "Talk",
        "object": "to Benny",
        "response": "Benny is running one clarinet passage on a loop, a hair faster each time, grinning the whole way. “Almost got it,” he says — and doesn't stop. (Recruitable classmate.)"
      },
      {
        "verb": "Open",
        "object": "the room at the end",
        "response": "One practice room swallows sound whole; the silence there feels hungry. A <em>Rest Wraith</em> waits inside. (Zone 1 mini-boss.)",
        "danger": true
      }
    ]
  },
  {
    "id": "recital_hall",
    "name": "The Recital Hall",
    "short": "Recital",
    "emoji": "🎤",
    "tint": "#7a5a1e",
    "zoneId": 1,
    "locationId": "rehearsal_halls",
    "map": [
      91,
      63
    ],
    "tag": "graduation",
    "desc": "A stage faces rows of empty velvet seats — where first-years give their first performance, and where Boot Camp graduation is played for Director Fennelio. Center stage right now, though, the trombone and tuba maestros are locked in some kind of contest.",
    "npcs": [
      "Sackbut",
      "Torbult"
    ],
    "hotspots": [
      {
        "verb": "Watch",
        "object": "Sackbut and Torbult",
        "response": "Each maestro holds one enormous low note, faces reddening, neither willing to breathe first. It has apparently been going on for some time; nobody remembers who started it, and nobody dares interrupt."
      },
      {
        "verb": "Step",
        "object": "onto the stage",
        "response": "The boards creak. Somewhere out in those seats, one day soon, the whole Academy will be listening. (Boot Camp graduation gate.)"
      },
      {
        "verb": "Look",
        "object": "at the front row",
        "response": "Brass plates on the velvet: the Maestros' reserved seats, for graduation night."
      }
    ]
  }
] as const;
