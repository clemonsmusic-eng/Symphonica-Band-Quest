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
  // A performance gate. `winKey` is the completion key recorded on a pass
  // (defaults to the challenge id); `awardType` the award bucket. A gate with
  // `advanceTo` advances the campaign and returns to the Hub; one without it is
  // a non-advancing "win gate" (e.g. a contest semifinal) that stays in place
  // and unlocks the next activity. `climax: 'shatter'` plays the Act-1 finale.
  | { kind: 'gate'; challenge: ChallengeSpec; label: string; unlock: (c: Character) => boolean;
      icon?: string; winKey?: string; awardType?: string; gearKey?: string; advanceTo?: number; climax?: 'shatter' };

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

// ── Zone 3 · The City of Concerta (contest bracket) ─────────────────────────
const Z3_REQUIRED = [
  'z3_eb_scale', 'z3_dotted_quarter', 'z3_two_octave_scale',
  'z3_aural_intervals', 'z3_aural_two_bar', 'z3_accent',
];
const z3AllRequired = (c: Character) => Z3_REQUIRED.every((id) => done(c, id));
const z3SemifinalWon = (c: Character) => done(c, 'z3_semifinal_won');

const ZONE3: Record<string, Activity[]> = {
  crotchet: [
    CH('z3_eb_scale', 'Concert E♭ Major Scale', 'technique_scale', 'UIL Zone 3 · Scales', 'Play the Concert E♭ major scale, one octave, then attempt two octaves.', 150),
    CH('z3_dotted_quarter', 'Rhythm: Dotted Quarter + Eighth', 'rhythm_performance', 'UIL Zone 3 · Rhythm', 'Tap a pattern using the dotted quarter–eighth note rhythm combination.', 150),
    CH('z3_two_octave_scale', 'Two-Octave Scale: Concert B♭', 'technique_scale', 'UIL Zone 3 · Scales', 'Perform the Concert B♭ major scale across two full octaves.', 150),
    CH('z3_aural_intervals', 'Aural: Simple Intervals', 'aural_interval_quest', 'UIL Zone 3 · Aural', 'Identify three simple intervals by ear: unison, perfect octave, and perfect fifth.', 75),
    CH('z3_aural_two_bar', 'Rhythm Echo: Two-Bar Patterns', 'aural_rhythm_echo', 'UIL Zone 3 · Aural', 'Listen to a two-bar rhythm pattern and tap it back.', 75),
    CH('z3_cresc_decresc_long', 'Crescendo and Decrescendo', 'prepared_performance', 'UIL Zone 3 · Dynamics', 'Perform an 8-bar phrase with a full dynamic arc: p → mf → f → mf → p.', 150, false),
  ],
  concerta: [
    CH('z3_accent', 'Articulation: Accent', 'prepared_performance', 'UIL Zone 3 · Articulation', 'Perform a phrase with accented notes. The accent (>) mark means a sudden, heavier attack.', 150),
    {
      kind: 'gate', label: 'Perform', icon: '🏆', unlock: z3AllRequired,
      winKey: 'z3_semifinal_won', awardType: 'mini_boss',
      challenge: {
        id: 'z3_semifinal', title: 'Semifinal — vs Piano Preparatory', type: 'prepared_performance',
        uilStandard: 'The Concerta Invitational · Semifinal', xpBase: 600,
        description: 'Perform your prepared piece for the judges. Piano Preparatory just played a crisp, confident set — match or beat them (Good or better) to reach the final.',
      },
    },
    {
      kind: 'gate', label: 'Perform', icon: '🏆', unlock: z3SemifinalWon, advanceTo: 4,
      winKey: 'z3_contest_won', awardType: 'zone_boss', gearKey: 'z3_contest_won',
      challenge: {
        id: 'z3_final', title: 'Final — vs The String School', type: 'prepared_performance',
        uilStandard: 'The Concerta Invitational · Final', xpBase: 1500,
        description: 'The whole town has packed the square. The String School are the favorites — perform a Sacred Score fragment and take the trophy (Good or better).',
      },
    },
  ],
};

// ── Zone 4 · The Grand Auditorium (graduation → the Shattering) ──────────────
const Z4_REQUIRED = [
  'z4_ab_scale', 'z4_syncopation', 'z4_sight_reading_1',
  'z4_aural_major_minor', 'z4_ensemble_fragment',
];
const z4AllRequired = (c: Character) => Z4_REQUIRED.every((id) => done(c, id));

const ZONE4: Record<string, Activity[]> = {
  backstage: [
    CH('z4_ab_scale', 'Concert A♭ Major Scale', 'technique_scale', 'UIL Zone 4 · Scales', 'Play the Concert A♭ major scale. Four flats — check your key signature.', 150),
    CH('z4_syncopation', 'Rhythm: Basic Syncopation', 'rhythm_performance', 'UIL Zone 4 · Rhythm', 'Tap a pattern with a tie across the barline — the off-beat held into the next measure.', 150),
    CH('z4_sight_reading_1', 'Sight-Reading: Grade 1–2 Excerpt', 'prepared_performance', 'UIL Zone 4 · Sight-Reading', 'A Grade 1–2 sight-reading excerpt. Study time: 60 seconds. Then perform.', 225),
    CH('z4_aural_major_minor', 'Aural: Major vs. Minor', 'aural_chord_oracle', 'UIL Zone 4 · Aural', 'Listen to short passages and identify whether each is major or minor.', 75),
    CH('z4_ensemble_fragment', 'Dress Rehearsal: Sacred Score Fragment', 'prepared_performance', 'UIL Zone 4 · Ensemble', 'Rehearse your part in the Sacred Score fragment with your section — the piece you\'ll perform at graduation.', 500),
    CH('z4_all_bb_eb_f', 'Scale Review: B♭, E♭, F', 'technique_scale', 'UIL Zone 4 · Scales', 'Play Concert B♭, E♭, and F major scales back-to-back without stopping.', 150, false),
    CH('z4_staccato_tenuto', 'Articulation: Staccato and Tenuto', 'prepared_performance', 'UIL Zone 4 · Articulation', 'Perform a 4-bar phrase alternating between staccato (detached) and tenuto (full value) markings.', 150, false),
  ],
  grand_auditorium: [
    {
      kind: 'gate', label: 'Perform', icon: '🎓', unlock: z4AllRequired, advanceTo: 5, climax: 'shatter',
      winKey: 'z4_graduation', awardType: 'zone_boss', gearKey: 'z4_graduation',
      challenge: {
        id: 'z4_graduation', title: 'The Graduation Performance', type: 'prepared_performance',
        uilStandard: 'Zone 4 · Graduation', xpBase: 1500,
        description: 'Your final performance as a student: your part in a restored Sacred Score fragment, with the whole Academy listening. Good or better to graduate — and then, the Renewal.',
      },
    },
  ],
};

const ZONE_CONTENT: Record<number, Record<string, Activity[]>> = { 1: ZONE1, 2: ZONE2, 3: ZONE3, 4: ZONE4 };

/** Activities available at a location (unlock gates still apply in the UI). */
export function locationActivities(zoneId: number, locationId: string): Activity[] {
  return ZONE_CONTENT[zoneId]?.[locationId] ?? [];
}

/** Required-challenge progress for a zone's header bar. */
export function zoneRequired(zoneId: number): string[] {
  return zoneId === 1 ? Z1_REQUIRED : zoneId === 2 ? Z2_REQUIRED
    : zoneId === 3 ? Z3_REQUIRED : zoneId === 4 ? Z4_REQUIRED : [];
}
export { countDone };
