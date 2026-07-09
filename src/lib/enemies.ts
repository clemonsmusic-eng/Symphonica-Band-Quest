import type { InstrumentId } from '../types/game';
import type { StatusType } from './statusEffects';
import { isEnemyInZone } from './enemyPlacement';

export type EnemyTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface EnemyDef {
  id: string;
  tier: EnemyTier;
  zone: number;          // first zone where this enemy appears
  name: string;
  description: string;
  power: number;
  maxHp: number;
  attackDescription: string;
  specialAttackName?: string;
  specialAttackChallengeType?: string;
  debuff?: StatusType;
  debuffDuration?: number;
  debuffChance?: number;  // chance the enemy inflicts its status on a standard attack (default 0.4)
  vulnerableTo: InstrumentId[];
  isBoss: boolean;
  phase2Threshold?: number;
  lore?: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  // ── Tier 1: Accidentals ──────────────────────────────────────────────────────
  flatling: {
    id: 'flatling',
    tier: 1,
    zone: 1,
    name: 'Flatling',
    description: 'Small, blue-grey, droopy. Emits flat, sagging notes.',
    power: 8,
    maxHp: 60,
    attackDescription: 'Drains Accuracy — pitches harder to land',
    specialAttackName: 'Flat Pulse',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 2,
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: false,
    lore: 'Born when a note is played flat and forgotten.',
  },
  sharp_creature: {
    id: 'sharp_creature',
    tier: 1,
    zone: 1,
    name: 'Sharpie',
    description: 'A red-orange, bat-winged accidental — half harpy, half half-step. It wheels overhead on leathery wings and dives shrieking a semitone too high.',
    power: 12,
    maxHp: 50,
    attackDescription: 'Swooping dive from above; a piercing, sharpened screech',
    specialAttackName: 'Screech Dive',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 2,
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: false,
    lore: 'Born when a note is played sharp and left to fester, it takes wing and hunts the flat that fled.',
  },
  natural_creature: {
    id: 'natural_creature',
    tier: 1,
    zone: 1,
    name: 'Natural',
    description: 'White, neutral, annoying. Appears alongside others.',
    power: 6,
    maxHp: 40,
    attackDescription: 'Cancels debuffs on ally enemies; dispels player buffs',
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: false,
  },
  double_flat_wretch: {
    id: 'double_flat_wretch',
    tier: 1,
    zone: 3,
    name: 'Double-Flat Wretch',
    description: 'Larger Flatling variant, deeper droop, more powerful.',
    power: 14,
    maxHp: 90,
    attackDescription: 'Stacks Accuracy drain; forces a lower note challenge',
    specialAttackName: 'Deep Sag',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 3,
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: false,
  },

  // ── Tier 2: Chronotons ────────────────────────────────────────────────────────
  chronoton_scout: {
    id: 'chronoton_scout',
    tier: 2,
    zone: 3,
    name: 'Chronoton Scout',
    description: 'Tick-tock robot marching in perfect 4/4.',
    power: 10,
    maxHp: 70,
    attackDescription: 'Attack lands every 4 beats — completely predictable',
    specialAttackName: 'Metronomic Strike',
    specialAttackChallengeType: 'aural_rhythm_echo',
    vulnerableTo: ['percussion', 'clarinet', 'alto_sax'],
    isBoss: false,
  },
  chronoton_shifter: {
    id: 'chronoton_shifter',
    tier: 2,
    zone: 3,
    name: 'Chronoton Shifter',
    description: 'Shifts time signature mid-battle without warning.',
    power: 14,
    maxHp: 80,
    attackDescription: 'Changes attack rhythm suddenly; disrupts player timing',
    specialAttackName: 'Time Shift',
    specialAttackChallengeType: 'aural_rhythm_echo',
    vulnerableTo: ['percussion', 'clarinet', 'alto_sax'],
    isBoss: false,
  },

  shard_phantom: {
    id: 'shard_phantom',
    tier: 1,
    zone: 2,
    name: 'The Footlight Phantom',
    description: 'A mischievous theater-sprite that haunts old concert halls, drawn out by the swell of live music. Harmless but maddening — it flits through the hall scattering sheet music and tangling the ensemble\'s carefully built sound.',
    power: 20,
    maxHp: 200,
    attackDescription: 'Page Scatter — jumbles your sense of pitch relationships',
    specialAttackName: 'Footlight Flicker',
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'confusion',
    debuffDuration: 2,
    vulnerableTo: ['bassoon', 'oboe', 'french_horn'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'No one is sure how long it has nested in the Theory Wing\'s old recital hall. It means no harm — it simply cannot resist a good crescendo.',
  },

  // ── Bosses ─────────────────────────────────────────────────────────────────────
  enchanted_music_stand: {
    id: 'enchanted_music_stand',
    tier: 1,
    zone: 1,
    name: 'The Enchanted Music Stand',
    description: 'A practice room stand possessed by a wandering Flatling. It rattles the music and drains your Accuracy.',
    power: 18,
    maxHp: 180,
    attackDescription: 'Rattles the score — Accuracy drain + rhythm disruption',
    specialAttackName: 'Score Rattle',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 2,
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'The stand has stood in Practice Room 4 for thirty years. No one remembers who left the Flatling there.',
  },
  flat_dragon: {
    id: 'flat_dragon',
    tier: 1,
    zone: 1,
    name: 'The Flat Dragon',
    description: 'A dragon whose very breath pulls everything flat. Your accuracy window is halved for the entire fight.',
    power: 22,
    maxHp: 240,
    attackDescription: 'Flat Breath — all pitch challenges have halved tolerance this battle',
    specialAttackName: 'Flat Breath',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 999,
    vulnerableTo: ['oboe', 'flute', 'clarinet'],
    isBoss: true,
    phase2Threshold: 0.4,
    lore: 'Ancient texts describe this creature as the "Flattener of Harmonics."',
  },
  interval_imp: {
    id: 'interval_imp',
    tier: 2,
    zone: 2,
    name: 'The Interval Imp',
    description: 'Born from a mis-played tritone in the theory classroom. Chaotic, scrambles player timing.',
    power: 20,
    maxHp: 200,
    attackDescription: 'Tritone Scramble — confuses all active buffs',
    specialAttackName: 'Tritone Scramble',
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'confusion',
    debuffDuration: 1,
    vulnerableTo: ['bassoon', 'oboe', 'french_horn'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'Maestro Persichetti swears the theory classroom was perfectly normal before this year.',
  },

  // ── Act 2 · Zone 5 — The Melodious Meadows ───────────────────────────────────
  stray_melody: {
    id: 'stray_melody',
    tier: 1,
    zone: 5,
    name: 'Stray Melody',
    description: 'A scrap of music torn loose in the Shattering, drifting the meadows with no player left to guide it.',
    power: 16,
    maxHp: 120,
    attackDescription: 'A wandering, off-key phrase that nicks at your focus',
    specialAttackName: 'Wrong Note',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 1,
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: false,
  },
  aria_wraith: {
    id: 'aria_wraith',
    tier: 1,
    zone: 5,
    name: 'The Aria Wraith',
    description: 'Maestra Flaura, your flute professor, hollowed to a single endless note. She drifts above a field of crops she has kept standing long after they died.',
    power: 22,
    maxHp: 280,
    attackDescription: 'A sustained, sorrowful tone that drags at your limbs',
    specialAttackName: 'Endless Aria',
    specialAttackChallengeType: 'aural_melody_mapper',
    debuff: 'slow',
    debuffDuration: 2,
    vulnerableTo: ['trumpet', 'trombone', 'tuba'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'She will not stop playing. She does not seem to remember how.',
  },
  war_horn_berserker: {
    id: 'war_horn_berserker',
    tier: 1,
    zone: 5,
    name: 'The War Horn Berserker',
    description: 'Maestro Cornelius, your trumpet professor, reduced to a single blaring call to charge. He does not know you — only sounds the attack, again and again.',
    power: 26,
    maxHp: 320,
    attackDescription: 'A blaring fanfare driving a reckless, heavy strike',
    specialAttackName: 'Endless Charge',
    specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'confusion',
    debuffDuration: 1,
    vulnerableTo: ['clarinet', 'percussion', 'alto_sax'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'Beneath the noise he is still searching for someone — a brother, lost in the same storm that took him.',
  },

  // ── Act 2 · Zone 6 — Sands of Time (Register Phantoms + maestro bosses) ───────
  chalumeau_phantom: {
    id: 'chalumeau_phantom',
    tier: 1,
    zone: 6,
    name: 'Chalumeau Phantom',
    description: 'A low, dark shape that haunts the deepest Chaconne Caves, droning in the clarinet\'s bottom register.',
    power: 17,
    maxHp: 130,
    attackDescription: 'A heavy, sluggish low blow',
    specialAttackName: 'Deep Drone',
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'slow',
    debuffDuration: 1,
    vulnerableTo: ['oboe', 'flute', 'trumpet'],
    isBoss: false,
  },
  clarion_phantom: {
    id: 'clarion_phantom',
    tier: 1,
    zone: 6,
    name: 'Clarion Phantom',
    description: 'A bright, piercing shape that flits through the upper caves, shrieking in the clarinet\'s clarion register.',
    power: 19,
    maxHp: 95,
    attackDescription: 'A fast, ringing strike with a vicious edge',
    specialAttackName: 'Clarion Shriek',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 1,
    vulnerableTo: ['oboe', 'clarinet', 'flute'],
    isBoss: false,
  },
  bassetta: {
    id: 'bassetta',
    tier: 1,
    zone: 6,
    name: 'Bassetto',
    description: 'Maestro Clarence, your clarinet professor, scattered across every register at once — a short-tempered nomad whose wail rises and plunges without warning.',
    power: 24,
    maxHp: 300,
    attackDescription: 'A register-leaping wail that lashes from nowhere',
    specialAttackName: 'Break Crossing',
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'confusion',
    debuffDuration: 2,
    vulnerableTo: ['oboe', 'flute', 'french_horn'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'The desert wind carries his three registers in three directions. Pin all three and he is himself again.',
  },
  caucophonus: {
    id: 'caucophonus',
    tier: 2,
    zone: 6,
    name: 'Caucophonus',
    description: 'Maestra Paige, your percussion professor, reduced to a tireless engine of production — stamping out discord-laced goods at the Caesura Crossing.',
    power: 28,
    maxHp: 360,
    attackDescription: 'A relentless, mechanical hammering on the downbeat',
    specialAttackName: 'Discord Assembly',
    specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'cramped',
    debuffDuration: 1,
    vulnerableTo: ['clarinet', 'alto_sax', 'percussion'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'She builds without pause and without purpose. Break his rhythm and the workshop falls silent at last.',
  },

  // ── Act 2 · Zone 7 — Clef Cliffs (the first Discordian outpost) ───────────────
  discordian_sentry: {
    id: 'discordian_sentry',
    tier: 5,
    zone: 7,
    name: 'Discordian Sentry',
    description: 'One of Vexus\'s made things — an instrument given a soldier\'s shape and no player at all, posted on the cliff road.',
    power: 19,
    maxHp: 130,
    attackDescription: 'A drilled, mechanical strike in lockstep',
    specialAttackName: 'Lockstep',
    specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'slow',
    debuffDuration: 1,
    vulnerableTo: ['oboe', 'clarinet', 'alto_sax'],
    isBoss: false,
  },
  sound_shadow: {
    id: 'sound_shadow',
    tier: 1,
    zone: 7,
    name: 'The Sound Shadow',
    description: 'Maestra Adolpha, your saxophone professor, reduced to a hall of borrowed shapes — a mimic with no self left at the center.',
    power: 24,
    maxHp: 300,
    attackDescription: 'A stolen attack worn like a mask',
    specialAttackName: 'Borrowed Form',
    specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'confusion',
    debuffDuration: 2,
    vulnerableTo: ['clarinet', 'percussion', 'alto_sax'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'She wears a hundred faces and none of them are hers. Cut through the copies to find Adolpha underneath.',
  },
  lieutenant_contra: {
    id: 'lieutenant_contra',
    tier: 6,
    zone: 7,
    name: 'Lieutenant Contra',
    description: 'A contrabass clarinet given command and cruelty by Vexus\'s tritonal magic — the first of his made lieutenants you face. It holds the outpost, and two of your professors, in its grip.',
    power: 30,
    maxHp: 420,
    attackDescription: 'A subsonic blast that rattles you to the teeth',
    specialAttackName: "Conductor's Command",
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'cramped',
    debuffDuration: 1,
    vulnerableTo: ['flute', 'oboe', 'trumpet'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'It was never a musician. It only ever followed orders — and gave them.',
  },
  sliding_chaos_knight: {
    id: 'sliding_chaos_knight',
    tier: 1,
    zone: 7,
    name: 'The Sliding Chaos Knight',
    description: 'Maestro Sackbut, your trombone professor, turned to one wild, destructive glissando that sweeps everything in reach.',
    power: 28,
    maxHp: 360,
    attackDescription: 'A roaring slide that scythes across the field',
    specialAttackName: 'Glissando Sweep',
    specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind',
    debuffDuration: 2,
    vulnerableTo: ['oboe', 'flute', 'clarinet'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'No aim, no malice — just a slide swung at the whole world. Time it, and he is yours.',
  },
  stone_colossus: {
    id: 'stone_colossus',
    tier: 1,
    zone: 7,
    name: 'The Stone Colossus',
    description: 'Maestro Torbult, your euphonium professor, sunk into one immovable low tone — a foundation holding up nothing, refusing to move.',
    power: 26,
    maxHp: 440,
    attackDescription: 'A slow, ground-shaking pedal-tone slam',
    specialAttackName: 'Pedal Quake',
    specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'slow',
    debuffDuration: 2,
    vulnerableTo: ['alto_sax', 'clarinet', 'trumpet'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'Endless, patient, unbreakable — until the right notes find the crack in the foundation.',
  },

  // ── Act 2 · Zone 8 — Forgotten Forest (the finale) ───────────────────────────
  echoing_wisp: {
    id: 'echoing_wisp',
    tier: 3,
    zone: 8,
    name: 'Echoing Wisp',
    description: 'A knot of fog and feedback drifting the Forgotten Forest, repeating a scrap of someone else\'s call.',
    power: 21,
    maxHp: 150,
    attackDescription: 'A disorienting echo that comes from everywhere at once',
    specialAttackName: 'Hall of Echoes',
    specialAttackChallengeType: 'aural_melody_mapper',
    debuff: 'confusion',
    debuffDuration: 1,
    vulnerableTo: ['bassoon', 'oboe', 'french_horn'],
    isBoss: false,
  },
  forest_flogger: {
    id: 'forest_flogger',
    tier: 1,
    zone: 8,
    name: 'The Forest Flogger',
    description: 'Maestro Waldhorn, your french horn professor, whose endless echoing calls have become the fog itself — confusing and corrupting all who enter.',
    power: 28,
    maxHp: 360,
    attackDescription: 'A horn call that strikes from a direction you can never quite place',
    specialAttackName: 'Echoing Call',
    specialAttackChallengeType: 'aural_melody_mapper',
    debuff: 'confusion',
    debuffDuration: 2,
    vulnerableTo: ['bassoon', 'oboe', 'clarinet'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'His brother has crossed a desert and a mountain to reach him. Quiet the calls, and the fog will lift.',
  },
  double_reed_specter: {
    id: 'double_reed_specter',
    tier: 4,
    zone: 8,
    name: 'The Double-Reed Specter',
    description: 'Maestro Hautbois, your oboe professor, reduced to a single relentless purpose: fell the ancient trees, harvest the cane, make more reeds, forever.',
    power: 26,
    maxHp: 340,
    attackDescription: 'A piercing, precise reed-shriek that finds every gap',
    specialAttackName: 'Reed Harvest',
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'vulnerable',
    debuffDuration: 2,
    vulnerableTo: ['trumpet', 'trombone', 'percussion'],
    isBoss: true,
    phase2Threshold: 0.5,
    lore: 'When he comes back to himself, he will look at what his hands have done — and lay the reed down for good.',
  },
  ancient_revenant: {
    id: 'ancient_revenant',
    tier: 4,
    zone: 8,
    name: 'The Ancient Revenant',
    description: 'Maestro Fagotto, your bassoon professor and the eldest of the Maestros, hollowed to a hoarder of old knowledge he can no longer use. The last shard to reclaim.',
    power: 32,
    maxHp: 460,
    attackDescription: 'A grinding low drone that wears down body and resolve',
    specialAttackName: 'Cantus Mortis',
    specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'poison',
    debuffDuration: 3,
    vulnerableTo: ['flute', 'oboe', 'clarinet'],
    isBoss: true,
    phase2Threshold: 0.4,
    lore: 'Free him, and the Symphony is whole again for the first time since the Renewal.',
  },

  // ── Act 3 · Zone 9 — Chromatic Coasts ────────────────────────────────────────
  wave_walker: {
    id: 'wave_walker', tier: 3, zone: 9, name: 'Wave Walker',
    description: 'A translucent thing that flows like a sound wave along the corrupted shore, passing through whatever it pleases.',
    power: 26, maxHp: 210, attackDescription: 'A phasing surge that slips past your guard',
    specialAttackName: 'Phase Tide', specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'vulnerable', debuffDuration: 2, vulnerableTo: ['trumpet', 'trombone', 'tuba'], isBoss: false,
  },
  coastal_dissonance: {
    id: 'coastal_dissonance', tier: 3, zone: 9, name: 'The Coastal Dissonance',
    description: 'Where the trail of corruption meets the sea, the surf itself has soured — a standing swell of clashing frequencies guarding the water.',
    power: 30, maxHp: 430, attackDescription: 'A crashing wall of dissonant sound',
    specialAttackName: 'Breakwater', specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'slow', debuffDuration: 2, vulnerableTo: ['trumpet', 'percussion', 'tuba'], isBoss: true, phase2Threshold: 0.5,
    lore: 'Clear it, and the way to the Fourth Wind is open.',
  },

  // ── Act 3 · Zone 10 — Syncopated Seas ────────────────────────────────────────
  rogue_wave: {
    id: 'rogue_wave', tier: 3, zone: 10, name: 'Rogue Wave',
    description: 'An off-beat swell that rears up out of nowhere, cresting against the rhythm of the sea.',
    power: 28, maxHp: 190, attackDescription: 'A syncopated slam that lands when you least expect it',
    specialAttackName: 'Offbeat Crash', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'cramped', debuffDuration: 1, vulnerableTo: ['percussion', 'clarinet', 'alto_sax'], isBoss: false,
  },
  the_maelstrom: {
    id: 'the_maelstrom', tier: 3, zone: 10, name: 'The Maelstrom',
    description: 'A vast rogue whirlpool that grows louder and wider with every passing moment. It must be broken quickly — or not at all.',
    power: 34, maxHp: 560, attackDescription: 'A churning vortex that drags you under',
    specialAttackName: 'Rising Swell', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'slow', debuffDuration: 2, vulnerableTo: ['percussion', 'trumpet', 'tuba'], isBoss: true, phase2Threshold: 0.5,
    lore: 'It is loudest just before it breaks. Hold your tempo and do not falter.',
  },

  // ── Act 3 · Zone 11 — Dissonant Dunes ────────────────────────────────────────
  cacophony_soldier: {
    id: 'cacophony_soldier', tier: 5, zone: 11, name: 'Cacophony Soldier',
    description: 'A made soldier of the Discordian Guard, far stronger when its fellows fight at its side.',
    power: 30, maxHp: 240, attackDescription: 'A drilled formation strike',
    specialAttackName: 'Close Ranks', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'blind', debuffDuration: 1, vulnerableTo: ['oboe', 'clarinet', 'alto_sax'], isBoss: false,
  },
  piano_commander: {
    id: 'piano_commander', tier: 6, zone: 11, name: 'Ebony',
    description: 'A Vexian knight-commander cut from the black keys — all sharps and flats, striking from between the notes. One half of the pair that holds the dunes.',
    power: 32, maxHp: 500, attackDescription: 'A cutting cascade of sharps and flats',
    specialAttackName: 'Accidental Run', specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind', debuffDuration: 2, vulnerableTo: ['oboe', 'flute', 'trumpet'], isBoss: true, phase2Threshold: 0.5,
    lore: 'The black keys of a keyboard split in two — Ivory holds the white.',
  },
  forte_commander: {
    id: 'forte_commander', tier: 6, zone: 11, name: 'Ivory',
    description: 'A Vexian knight-commander cut from the white keys — relentless, running the naturals end to end. The other half of the pair that holds the dunes.',
    power: 40, maxHp: 560, attackDescription: 'A driving run straight up the white keys',
    specialAttackName: 'Diatonic Barrage', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'cramped', debuffDuration: 1, vulnerableTo: ['clarinet', 'percussion', 'alto_sax'], isBoss: true, phase2Threshold: 0.5,
    lore: 'Both keys must fall before the doors of the Hall will open.',
  },

  // ── Act 3 · Zone 12 — The Hall of Discord ────────────────────────────────────
  vexian_knight: {
    id: 'vexian_knight', tier: 6, zone: 12, name: 'Vexian Knight',
    description: "One of Vexus's personally made elite, drilled in atonal combat music. The practice rooms are full of them.",
    power: 34, maxHp: 270, attackDescription: 'An elite multi-hit combination',
    specialAttackName: 'Atonal Drill', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'confusion', debuffDuration: 1, vulnerableTo: ['trumpet', 'oboe', 'clarinet'], isBoss: false,
  },
  ostinato_usher: {
    id: 'ostinato_usher', tier: 6, zone: 12, name: 'Ostinato, the Usher',
    description: 'A towering brass-and-gearwork automaton built to defeat unwelcome guests and drag them out of the Hall. It never tires and never varies.',
    power: 36, maxHp: 600, attackDescription: 'A relentless, repeating mechanical combination',
    specialAttackName: 'Endless Ostinato', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'cramped', debuffDuration: 1, vulnerableTo: ['percussion', 'clarinet', 'alto_sax'], isBoss: true, phase2Threshold: 0.5,
    lore: 'Its one trick, repeated forever — find the seam in the loop and break it.',
  },
  lieutenant_kije: {
    id: 'lieutenant_kije', tier: 6, zone: 12, name: 'Lieutenant Kije',
    description: 'A piccolo given a soldier\'s shape and tritonal cruelty — the shrill, piercing junior of the Tritone Trio.',
    power: 34, maxHp: 380, attackDescription: 'A piercing high shriek that splits your focus',
    specialAttackName: 'Piccolo Pierce', specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'blind', debuffDuration: 2, vulnerableTo: ['trombone', 'tuba', 'bassoon'], isBoss: true, phase2Threshold: 0.5,
    lore: 'The highest voice of the Trio. Silence it, and the chord loses its edge.',
  },
  commander_mesto: {
    id: 'commander_mesto', tier: 6, zone: 12, name: 'Commander Coren Glais',
    description: 'An English horn automaton of mournful, hollow tone — the inner voice of the Tritone Trio.',
    power: 38, maxHp: 460, attackDescription: 'A hollow, sorrowing tone that saps the will',
    specialAttackName: 'Lament', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'slow', debuffDuration: 2, vulnerableTo: ['trumpet', 'percussion', 'clarinet'], isBoss: true, phase2Threshold: 0.5,
    lore: 'The middle voice. With it gone, the tritone cannot hold together.',
  },
  general_grave: {
    id: 'general_grave', tier: 6, zone: 12, name: 'General Grave',
    description: "A contrabassoon of crushing depth and command — Vexus's second, and the leader of the Tritone Trio.",
    power: 42, maxHp: 640, attackDescription: 'A subsonic blast that buckles your knees',
    specialAttackName: 'Grave Depths', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'poison', debuffDuration: 3, vulnerableTo: ['flute', 'oboe', 'clarinet'], isBoss: true, phase2Threshold: 0.4,
    lore: 'The lowest voice and the last. Break the General, and the way to the stage is clear.',
  },
  vexus: {
    id: 'vexus', tier: 6, zone: 12, name: 'Vexus, the Conductor',
    description: 'The Composer\'s own appointed Conductor, who tried to prove himself the equal of his maker and broke the world. He stands on the stage, baton raised over an orchestra of player-less instruments, certain he is right.',
    power: 44, maxHp: 840, attackDescription: 'A cascade of tritonal dissonance from a hundred soulless instruments',
    specialAttackName: 'Atonal Assault', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'confusion', debuffDuration: 2, vulnerableTo: [], isBoss: true, phase2Threshold: 0.4,
    lore: 'He cannot hear what he has done. Beat back his phantom orchestra — and then answer it with living music.',
  },

  // ── Instrument-inspired roster, Act 2–3 (zones 5–12) ─────────────────────────
  // Wired into each zone's random skirmishes via zoneMobs()/randomSkirmish()
  // (they self-register by their `zone` field). Portraits are drop-in via
  // ENEMY_PORTRAITS (public/portraits/<id>.png), emoji fallback until then.

  // Zone 5 — Melodious Meadows
  pixielo: {
    id: 'pixielo', tier: 3, zone: 5, name: 'Pixielo',
    description: 'A thumb-sized sprite that shrieks in the highest register, flitting through the tall grass faster than the eye can follow.',
    power: 15, maxHp: 110, attackDescription: 'A darting, ear-splitting piccolo trill',
    specialAttackName: 'Register Shriek', specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'manic', debuffDuration: 2, vulnerableTo: ['tuba', 'trombone', 'euphonium'], isBoss: false,
    lore: 'The smallest voice, and the loudest — it delights in the low brass that cannot chase it.',
  },
  fiferfly: {
    id: 'fiferfly', tier: 3, zone: 5, name: 'Fiferfly',
    description: 'A ragged, drum-and-fife revenant that marches nowhere, piping a thin field tune on repeat.',
    power: 17, maxHp: 125, attackDescription: 'A relentless marching cadence that wears the ear down',
    specialAttackName: 'Quickstep', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'slow', debuffDuration: 2, vulnerableTo: ['bassoon', 'euphonium'], isBoss: false,
  },

  // Zone 7 — Clef Cliffs
  ghoulgenspiel: {
    id: 'ghoulgenspiel', tier: 4, zone: 7, name: 'Ghoulgenspiel',
    description: 'A slab of struck stone and steel bars, each footfall ringing a bright, merciless chime off the cliff walls.',
    power: 23, maxHp: 170, attackDescription: 'A ringing stone slam that leaves the ears stunned',
    specialAttackName: 'Chime Stun', specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'cramped', debuffDuration: 1, vulnerableTo: ['tuba', 'euphonium'], isBoss: false,
  },

  // Zone 8 — Forgotten Forest
  bagpipe_banshee: {
    id: 'bagpipe_banshee', tier: 4, zone: 8, name: 'Bagpipe Banshee',
    description: 'A droning forest wraith wrapped in tattered tartan, its endless bagpipe wail curdling the air between the trees.',
    power: 22, maxHp: 155, attackDescription: 'An unbroken drone that muddies every thought',
    specialAttackName: 'Drone Wail', specialAttackChallengeType: 'aural_progression_master',
    debuff: 'confusion', debuffDuration: 2, vulnerableTo: ['flute', 'oboe'], isBoss: false,
  },

  // Zone 9 — Chromatic Coasts
  flugel_fiend: {
    id: 'flugel_fiend', tier: 5, zone: 9, name: 'Flugel Fiend',
    description: 'A mellow-voiced coastal fiend that lures sailors with a warm, rounded brass song before the tide takes them.',
    power: 26, maxHp: 205, attackDescription: 'A deceptively soft song that swells into a crushing blast',
    specialAttackName: "Siren's Swell", specialAttackChallengeType: 'aural_melody_mapper',
    debuff: 'sleep', debuffDuration: 2, vulnerableTo: ['alto_sax', 'oboe'], isBoss: false,
  },

  // Zone 10 — Syncopated Seas
  therrormin: {
    id: 'therrormin', tier: 5, zone: 10, name: 'Therrormin',
    description: 'A wavering, half-there specter of pure pitch, its eerie glissando bending the sea air into shivering waves.',
    power: 28, maxHp: 210, attackDescription: 'A sliding, disembodied wail that warps the senses',
    specialAttackName: 'Aether Glissando', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'confusion', debuffDuration: 2, vulnerableTo: ['french_horn', 'flute'], isBoss: false,
  },
  vibrawraith: {
    id: 'vibrawraith', tier: 5, zone: 10, name: 'Vibrawraith',
    description: 'A shimmering sea-ghost of spinning motor-vanes, its cold metallic tremolo rippling out across the syncopated swells.',
    power: 27, maxHp: 200, attackDescription: 'A cold, pulsing tremolo that saps the will',
    specialAttackName: 'Tremolo Chill', specialAttackChallengeType: 'aural_progression_master',
    debuff: 'slow', debuffDuration: 3, vulnerableTo: ['bassoon', 'clarinet'], isBoss: false,
  },

  // Zone 11 — Dissonant Dunes
  chastanet: {
    id: 'chastanet', tier: 6, zone: 11, name: 'Chastanet',
    description: 'A skittering swarm of clacking shells that boils up out of the dunes, chattering a frantic, maddening rhythm.',
    power: 30, maxHp: 235, attackDescription: 'A furious clattering swarm-strike',
    specialAttackName: 'Clatter Frenzy', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'manic', debuffDuration: 2, vulnerableTo: ['euphonium', 'tuba'], isBoss: false,
  },
  crotentacle: {
    id: 'crotentacle', tier: 6, zone: 11, name: 'Crotentacle',
    description: 'A hunched horror crowned with ringing bronze discs, each shake loosing a piercing, sustained overtone across the wastes.',
    power: 31, maxHp: 245, attackDescription: 'A sustained ringing tone that splits the focus',
    specialAttackName: 'Overtone Ring', specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'blind', debuffDuration: 2, vulnerableTo: ['oboe', 'alto_sax'], isBoss: false,
  },

  // Zone 12 — The Hall of Discord
  timptanic: {
    id: 'timptanic', tier: 6, zone: 12, name: 'Timptanic',
    description: 'A colossus of stretched hide and burnished copper kettles, each thunderous footfall tuned to a different rolling note of doom.',
    power: 34, maxHp: 280, attackDescription: 'A ground-shaking kettledrum stomp',
    specialAttackName: 'Thunder Roll', specialAttackChallengeType: 'aural_progression_master',
    debuff: 'cramped', debuffDuration: 1, vulnerableTo: ['flute', 'clarinet'], isBoss: false,
  },
  gongolem: {
    id: 'gongolem', tier: 6, zone: 12, name: 'Gongolem',
    description: 'A towering bronze sentinel of the inner hall, a single struck note from its vast disc enough to buckle a whole ensemble.',
    power: 33, maxHp: 270, attackDescription: 'A single, world-swallowing bronze crash',
    specialAttackName: 'Resonant Crash', specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'vulnerable', debuffDuration: 2, vulnerableTo: ['trumpet', 'trombone'], isBoss: false,
  },

  // ── Extra roster fill, 1–2 per area (musical themes, not all instruments) ────
  // Encounter-ready like the set above; not slotted into any BATTLES/zone config
  // yet, so no balance impact until placed. Portraits drop-in via ENEMY_PORTRAITS.

  // Zone 1 — The Rehearsal Halls
  rest_wraith: {
    id: 'rest_wraith', tier: 1, zone: 1, name: 'Rest Wraith',
    description: 'A patch of unnatural silence drifting the practice rooms, swallowing sound and lulling the unwary into missing their entrance.',
    power: 9, maxHp: 55, attackDescription: 'A smothering hush that dulls the senses',
    specialAttackName: 'Dead Air', specialAttackChallengeType: 'aural_rhythm_echo',
    debuff: 'sleep', debuffDuration: 2, vulnerableTo: ['flute', 'oboe', 'clarinet'], isBoss: false,
    lore: 'Where a whole rest is held too long, something learns to like the quiet.',
  },
  frat: {
    id: 'frat', tier: 1, zone: 1, name: 'Frat',
    description: 'A sallow flat-sign that sprouted a tail and whiskers — a fat grey rodent that gnaws pitches a half-step down and scurries off before you can correct it.',
    power: 10, maxHp: 50, attackDescription: 'A grating burst of wrong notes',
    specialAttackName: 'Sour Blast', specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'manic', debuffDuration: 2, vulnerableTo: ['clarinet', 'flute'], isBoss: false,
  },

  // Zone 4 — The Grand Auditorium
  stage_phantom: {
    id: 'stage_phantom', tier: 2, zone: 4, name: 'Stage Phantom',
    description: "Graduation-night nerves given a shivering shape, it thrives on trembling hands and forgotten measures.",
    power: 16, maxHp: 100, attackDescription: 'A wave of cold dread that scatters the mind',
    specialAttackName: 'Blank Stare', specialAttackChallengeType: 'aural_melody_mapper',
    debuff: 'confusion', debuffDuration: 2, vulnerableTo: ['clarinet', 'flute', 'oboe'], isBoss: false,
  },

  // Zone 5 — Melodious Meadows
  fermoctopus: {
    id: 'fermoctopus', tier: 3, zone: 5, name: 'Fermoctopus',
    description: 'A many-armed meadow-pond octopus with a single great fermata for an eye — that unblinking hold-mark fixes a note in place and lets its tentacles seize the frozen prey.',
    power: 16, maxHp: 120, attackDescription: 'A held tone that roots the target in place',
    specialAttackName: 'Endless Hold', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'cramped', debuffDuration: 1, vulnerableTo: ['oboe', 'bassoon'], isBoss: false,
  },

  // Zone 6 — Sands of Time
  saxerpent: {
    id: 'saxerpent', tier: 3, zone: 6, name: 'Saxerpent',
    description: 'A dune-snake that slides forever a half-step off, its hypnotic chromatic slither churning the sand.',
    power: 18, maxHp: 130, attackDescription: 'A sliding, off-pitch coil-strike',
    specialAttackName: 'Chromatic Coil', specialAttackChallengeType: 'aural_pitch_spy',
    debuff: 'poison', debuffDuration: 3, vulnerableTo: ['clarinet', 'oboe'], isBoss: false,
  },

  // Zone 7 — Clef Cliffs
  glissanghost: {
    id: 'glissanghost', tier: 4, zone: 7, name: 'Glissanghost',
    description: 'A smear of sliding sound haunting the passes, never quite settling on a pitch as it swoops the cliff faces.',
    power: 20, maxHp: 145, attackDescription: 'A dizzying swoop that blurs the vision',
    specialAttackName: 'Falling Slide', specialAttackChallengeType: 'aural_melody_mapper',
    debuff: 'blind', debuffDuration: 2, vulnerableTo: ['trombone', 'french_horn'], isBoss: false,
  },

  // Zone 9 — Chromatic Coasts
  stingcatto: {
    id: 'stingcatto', tier: 5, zone: 9, name: 'Stingcatto',
    description: 'A swarm of needle-sharp coastal darters that attack in clipped, stabbing bursts and scatter before you can answer.',
    power: 25, maxHp: 200, attackDescription: 'A flurry of short, stabbing strikes',
    specialAttackName: 'Pizzicato Volley', specialAttackChallengeType: 'aural_rhythm_echo',
    vulnerableTo: ['percussion', 'trumpet'], isBoss: false,
  },

  // Zone 11 — Dissonant Dunes
  dissonaut: {
    id: 'dissonaut', tier: 6, zone: 11, name: 'Dissonaut',
    description: 'A wanderer of the dunes warped by raw dissonance, its every step ringing two clashing pitches at once.',
    power: 31, maxHp: 240, attackDescription: 'A grinding double-pitch assault',
    specialAttackName: 'Tritone Lurch', specialAttackChallengeType: 'aural_interval_quest',
    debuff: 'manic', debuffDuration: 2, vulnerableTo: ['euphonium', 'tuba'], isBoss: false,
  },

  // Zone 12 — The Hall of Discord
  tacetus: {
    id: 'tacetus', tier: 6, zone: 12, name: 'Tacetus',
    description: 'A vast, silent warden of the inner hall that answers sound with a suffocating void, letting no note ring twice.',
    power: 35, maxHp: 290, attackDescription: 'A wave of imposed silence that smothers the ensemble',
    specialAttackName: 'Total Tacet', specialAttackChallengeType: 'aural_chord_oracle',
    debuff: 'sleep', debuffDuration: 2, vulnerableTo: ['flute', 'clarinet'], isBoss: false,
  },
};

// ── Class effectiveness (GDD: "Highly Effective ×1.5") ─────────────────────────
// An enemy's vulnerableTo lists the instrument classes whose stat emphasis
// counters its musical nature. Matching classes deal bonus damage with their
// own abilities. (Summons are the maestros' instruments, not the player's, so
// they are unaffected.)
export const EFFECTIVENESS_MULT = 1.5;

export function isHighlyEffective(def: EnemyDef, instrument: InstrumentId): boolean {
  return def.vulnerableTo.includes(instrument);
}

// ── Skirmish composition ──────────────────────────────────────────────────────
// Non-boss enemies whose placement (authored location → zone, else their default
// `zone`) puts them in this zone — the pool a random skirmish draws from.
export function zoneMobs(zoneId: number): EnemyDef[] {
  return Object.values(ENEMIES).filter((e) => !e.isBoss && isEnemyInZone(e.id, e.zone, zoneId));
}

// Compose a random skirmish group of `size` enemies from a zone's mob pool.
export function randomSkirmish(zoneId: number, size = 2): EnemyDef[] {
  const pool = zoneMobs(zoneId);
  if (pool.length === 0) return [];
  return Array.from({ length: Math.max(1, size) }, () => pool[Math.floor(Math.random() * pool.length)]);
}

export type BattleId = string;

export interface BattleConfig {
  id: BattleId;
  name: string;
  enemies: string[]; // enemy ids
  zoneId: number;
  isBoss: boolean;
  isMiniBuffer: boolean;
  rewardXp: number;
  rewardCoins: number;
  rewardGearId?: string;
  victoryNarrative: string;
  defeatNarrative: string;
}

export const BATTLES: Record<BattleId, BattleConfig> = {
  // Zone 1 encounters
  z1_flatling_encounter: {
    id: 'z1_flatling_encounter',
    name: 'Flatling Encounter',
    enemies: ['flatling'],
    zoneId: 1,
    isBoss: false,
    isMiniBuffer: false,
    rewardXp: 200,
    rewardCoins: 5,
    victoryNarrative: 'The Flatling dissolves into a off-key sigh. Your pitch holds true.',
    defeatNarrative: 'The Flatling\'s influence drags your tone flat. Retreat to the Academy.',
  },
  z1_mini_boss: {
    id: 'z1_mini_boss',
    name: 'The Enchanted Music Stand',
    enemies: ['enchanted_music_stand'],
    zoneId: 1,
    isBoss: false,
    isMiniBuffer: true,
    rewardXp: 600,
    rewardCoins: 15,
    rewardGearId: 'iron_stand',
    victoryNarrative: 'The Flatling\'s grip on the stand shatters. It tips over harmlessly, an ordinary object once more.',
    defeatNarrative: 'The stand\'s rattling overwhelms your focus. You retreat to the practice hall.',
  },
  z1_boss: {
    id: 'z1_boss',
    name: 'The Graduation Trial',
    enemies: ['flat_dragon'],
    zoneId: 1,
    isBoss: true,
    isMiniBuffer: false,
    rewardXp: 1500,
    rewardCoins: 40,
    victoryNarrative: 'The Flat Dragon retreats into the mountains. The Academy cheers. Headmaster Fennelio nods.',
    defeatNarrative: 'The dragon\'s breath pulls every note flat. You withdraw to the practice halls.',
  },
  z2_mini_boss: {
    id: 'z2_mini_boss',
    name: 'The Interval Imp',
    enemies: ['interval_imp'],
    zoneId: 2,
    isBoss: false,
    isMiniBuffer: true,
    rewardXp: 600,
    rewardCoins: 15,
    victoryNarrative: 'The Interval Imp dissolves in a cascade of correctly identified intervals. Maestro Persichetti looks unsurprised.',
    defeatNarrative: 'The Imp\'s tritone scramble overwhelms your training. Retreat to the Theory Wing.',
  },
};
