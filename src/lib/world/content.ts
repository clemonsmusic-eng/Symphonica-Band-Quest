import type { Character } from '../../types/game';

// A challenge as ChallengeModal consumes it (id/title/type/description/xpBase),
// plus `required` for progress grouping.
export interface ChallengeSpec {
  id: string;
  title: string;
  type: string;
  description: string;
  uilStandard?: string;
  xpBase: number;
  required?: boolean;
}

export type Activity =
  | { kind: 'challenge'; challenge: ChallengeSpec }
  | { kind: 'battle'; id: string; name: string; desc: string; icon: string; enemyKeys: string[]; doneKey: string; awardType: 'mini_boss' | 'zone_boss'; unlock?: (c: Character) => boolean; lockedNote?: string; hideUntilReady?: boolean }
  | { kind: 'gate'; challenge: ChallengeSpec; advanceTo: number; label: string; unlock: (c: Character) => boolean };

const done = (c: Character, id: string) => c.completedChallenges.includes(id);
const countDone = (c: Character, ids: string[]) => ids.filter((id) => done(c, id)).length;

// ── Zone 1 · The Rehearsal Halls ────────────────────────────────────────────
const Z1_REQUIRED = [
  'z1_bb_scale_1oct', 'z1_long_tone', 'z1_rhythm_44', 'z1_articulation_tongue',
  'z1_articulation_slur', 'z1_aural_pitch', 'z1_aural_rhythm',
];
const z1MiniBossReady = (c: Character) => countDone(c, Z1_REQUIRED) >= 4;
const z1MiniBossDone = (c: Character) => done(c, 'z1_mini_boss_defeated');
const z1GraduationReady = (c: Character) =>
  Z1_REQUIRED.every((id) => done(c, id)) && z1MiniBossDone(c);

const CH = (id: string, title: string, type: string, uilStandard: string, description: string, xpBase: number, required = true): Activity =>
  ({ kind: 'challenge', challenge: { id, title, type, uilStandard, description, xpBase, required } });

const ZONE1: Record<string, Activity[]> = {
  rehearsal_halls: [
    CH('z1_bb_scale_1oct', 'Concert B♭ Major Scale', 'technique_scale', 'UIL Zone 1 · Scales', 'Play the Concert B♭ major scale, one octave, in steady quarter notes.', 150),
    CH('z1_long_tone', 'Long Tone Exercise', 'prepared_performance', 'UIL Zone 1 · Tone', 'Sustain a Concert B♭ for a full 4 beats at mf — tone quality and pitch stability are assessed.', 150),
    CH('z1_rhythm_44', 'Rhythm: 4/4 Quarter Notes', 'rhythm_performance', 'UIL Zone 1 · Rhythm', 'Tap the given rhythm: whole, half, and quarter notes in 4/4 time.', 150),
    CH('z1_articulation_tongue', 'All-Tongue Articulation', 'prepared_performance', 'UIL Zone 1 · Articulation', 'Play the given 4-bar melody with all-separate tongue articulation.', 150),
    CH('z1_articulation_slur', 'Slurred Articulation', 'prepared_performance', 'UIL Zone 1 · Articulation', 'Play the same 4-bar melody, now fully slurred.', 150),
    CH('z1_dynamics_mp_mf', 'Dynamics: mp and mf', 'prepared_performance', 'UIL Zone 1 · Dynamics', 'Play the phrase at mp, then mf — the volume difference must be audible.', 150, false),
    {
      kind: 'gate', advanceTo: 2, label: 'Perform for Fennelio', unlock: z1GraduationReady,
      challenge: {
        id: 'z1_graduation', title: 'Boot Camp Graduation — First 3-Note Song', type: 'prepared_performance',
        uilStandard: 'Zone 1 · Quarter End', xpBase: 1500,
        description: 'Play your first complete 3-note song for Director Fennelio. Good or better makes you a student of Harmonia Academy — and opens the road to Concerta.',
      },
    },
  ],
  practice_rooms: [
    CH('z1_aural_pitch', 'Pitch Spy: Recognize Pitches', 'aural_pitch_spy', 'UIL Zone 1 · Aural', 'Listen to a single note and identify it by name.', 75),
    CH('z1_aural_rhythm', 'Rhythm Echo: 4-Beat Patterns', 'aural_rhythm_echo', 'UIL Zone 1 · Aural', 'Listen to a 4-beat rhythm pattern and tap it back.', 75),
    {
      kind: 'battle', id: 'z1_mini_boss', name: 'The Rest Wraith', icon: '😶',
      desc: 'A pocket of unnatural silence in the east-wing practice rooms — it swallows sound and lulls you into missing your entrance.',
      enemyKeys: ['rest_wraith'], doneKey: 'z1_mini_boss_defeated', awardType: 'mini_boss', unlock: z1MiniBossReady,
      lockedNote: 'Complete 4 required challenges',
    },
  ],
};

// ── Zone 2 · The Theory Wing ────────────────────────────────────────────────
const Z2_REQUIRED = ['z2_f_scale', 'z2_eighth_notes', 'z2_three_four', 'z2_dynamics_pf', 'z2_aural_stepwise', 'z2_aural_rhythm_eighth'];
const z2MiniBossReady = (c: Character) => countDone(c, Z2_REQUIRED) >= 3;
const z2ConcertReady = (c: Character) => Z2_REQUIRED.every((id) => done(c, id)) && done(c, 'z2_mini_boss_defeated');
const z2PhantomDone = (c: Character) => done(c, 'z2_shard_phantom_defeated');

const ZONE2: Record<string, Activity[]> = {
  theory_wing: [
    CH('z2_f_scale', 'Concert F Major Scale', 'technique_scale', 'UIL Zone 2 · Scales', 'Play the Concert F major scale, one octave, at a steady quarter-note tempo.', 150),
    CH('z2_eighth_notes', 'Rhythm: Eighth Notes in 4/4', 'rhythm_performance', 'UIL Zone 2 · Rhythm', 'Tap the given pattern using eighth notes and quarter notes in 4/4.', 150),
    CH('z2_three_four', 'Rhythm: 3/4 Time', 'rhythm_performance', 'UIL Zone 2 · Rhythm', 'Tap a 3/4 rhythm — three beats per measure. Feel the waltz.', 150),
    CH('z2_dynamics_pf', 'Dynamics: p and f', 'prepared_performance', 'UIL Zone 2 · Dynamics', 'Perform the phrase at piano (p), then forte (f) — a clear dynamic difference is required.', 150),
    CH('z2_cresc_decresc', 'Crescendo and Decrescendo', 'prepared_performance', 'UIL Zone 2 · Dynamics', 'Perform a 4-bar phrase that grows louder, then softer.', 150, false),
    {
      kind: 'battle', id: 'z2_concert_crash', name: 'A Frat crashes the concert', icon: '🐀',
      desc: 'A grey flat-sign rodent, flushed out of the wings by the swell of live music, scurries across the stage gnawing the sheet music a half-step flat. Shoo it off.',
      enemyKeys: ['frat'], doneKey: 'z2_shard_phantom_defeated', awardType: 'mini_boss', unlock: z2ConcertReady, hideUntilReady: true,
    },
    {
      kind: 'gate', advanceTo: 3, label: 'Perform', unlock: z2PhantomDone,
      challenge: {
        id: 'z2_winter_concert', title: 'The Winter Concert', type: 'prepared_performance',
        uilStandard: 'Zone 2 · Quarter End', xpBase: 1500,
        description: 'The hall is silent, the pest gone. Perform your best — the first time your class sounds like an ensemble. Good or better advances to Concerta.',
      },
    },
  ],
  theory_stacks: [
    CH('z2_aural_stepwise', 'Melody Mapper: Stepwise Melodies', 'aural_melody_mapper', 'UIL Zone 2 · Aural', 'Hear a short stepwise melody and pick the correct notation.', 75),
    CH('z2_aural_rhythm_eighth', 'Rhythm Echo: Eighth-Note Patterns', 'aural_rhythm_echo', 'UIL Zone 2 · Aural', 'Hear a rhythm using eighth notes and tap it back.', 75),
    CH('z2_two_octave_intro', 'Two-Octave Scale Introduction', 'technique_scale', 'UIL Zone 2 · Scales', 'Extend the Concert B♭ scale to two octaves for the first time. Slowly.', 150, false),
    {
      kind: 'battle', id: 'z2_mini_boss', name: 'The Interval Imp', icon: '😈',
      desc: 'Born from a mis-played tritone deep in the stacks — it scrambles your timing.',
      enemyKeys: ['interval_imp'], doneKey: 'z2_mini_boss_defeated', awardType: 'mini_boss', unlock: z2MiniBossReady,
      lockedNote: 'Complete 3 required challenges',
    },
  ],
};

const ZONE_CONTENT: Record<number, Record<string, Activity[]>> = { 1: ZONE1, 2: ZONE2 };

/** Activities available at a location (unlock gates still apply in the UI). */
export function locationActivities(zoneId: number, locationId: string): Activity[] {
  return ZONE_CONTENT[zoneId]?.[locationId] ?? [];
}

/** Required-challenge progress for a zone's header bar. */
export function zoneRequired(zoneId: number): string[] {
  return zoneId === 1 ? Z1_REQUIRED : zoneId === 2 ? Z2_REQUIRED : [];
}
export { countDone };
