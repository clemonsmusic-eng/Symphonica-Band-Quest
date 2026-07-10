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
  | { kind: 'battle'; id: string; name: string; desc: string; icon: string; enemyKeys: string[]; doneKey: string; awardType: 'mini_boss' | 'zone_boss'; unlock?: (c: Character) => boolean }
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
    },
  ],
};

const ZONE_CONTENT: Record<number, Record<string, Activity[]>> = { 1: ZONE1 };

/** Activities available at a location (unlock gates still apply in the UI). */
export function locationActivities(zoneId: number, locationId: string): Activity[] {
  return ZONE_CONTENT[zoneId]?.[locationId] ?? [];
}

/** Required-challenge progress for a zone's header bar. */
export function zoneRequired(zoneId: number): string[] {
  return zoneId === 1 ? Z1_REQUIRED : [];
}
export { countDone };
