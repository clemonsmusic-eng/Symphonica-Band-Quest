import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { allExcerpts } from '../lib/music/customExcerpts';
import type { Excerpt, ExcerptChallengeType } from '../lib/music/types';
import { excerptBeats } from '../lib/music/types';
import {
  DIFFICULTIES, LANE_COLORS, LANE_KEY_LABELS, LANE_LETTERS, bestForExcerpt,
} from '../lib/music/noteRush';
import type { Difficulty, DifficultyId, RushResult } from '../lib/music/noteRush';
import NoteRushGame from '../components/music/NoteRushGame';
import type { InputMode } from '../components/music/NoteRushGame';

const TYPE_LABELS: Record<ExcerptChallengeType, string> = {
  technique_scale: 'Scales & Technique',
  prepared_performance: 'Prepared Pieces',
  sight_reading: 'Sight-Reading',
  rhythm_performance: 'Rhythm',
};

export default function NoteRushPage() {
  const navigate = useNavigate();
  const { character, awardChallenge } = useGameStore();
  const demoMode = useUiStore((s) => s.demoMode);

  const [selected, setSelected] = useState<Excerpt | null>(null);
  const [difficultyId, setDifficultyId] = useState<DifficultyId>('player');
  const [inputMode, setInputMode] = useState<InputMode>('keys');
  const excerpts = useMemo(() => allExcerpts(), []);

  if (!character) return null;
  const char = character;
  const difficulty: Difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) ?? DIFFICULTIES[1];
  const effectiveInput: InputMode = demoMode ? 'keys' : inputMode;

  // Every run is practice: XP and RP at the simulator's half rate, and it never
  // marks a campaign challenge complete.
  async function handleFinish(excerpt: Excerpt, result: RushResult) {
    await awardChallenge(
      `note_rush_${excerpt.id}_${difficultyId}`, 'performance', result.accuracyPct, result.rating,
      { xpMultiplier: 0.5, trackCompletion: false },
    );
  }

  const byType = excerpts.reduce<Record<string, Excerpt[]>>((acc, e) => {
    (acc[e.challengeType] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-academy-dark/95 backdrop-blur-sm border-b border-academy-gold/10 px-4 py-3 flex items-center justify-between">
        <div className="fantasy-title text-lg text-academy-gold">Note Rush</div>
        <button onClick={() => navigate('/hub')}
          className="text-academy-cream/40 hover:text-academy-cream/80 text-xs transition-colors">
          ← Hub
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        {selected ? (
          <>
            <NoteRushGame
              key={`${selected.id}:${difficultyId}:${effectiveInput}`}
              excerpt={selected}
              character={char}
              difficulty={difficulty}
              inputMode={effectiveInput}
              onFinish={(result) => { void handleFinish(selected, result); }}
              onExit={() => setSelected(null)}
            />
            <p className="text-academy-cream/30 text-[11px] mt-4 text-center">
              Runs award practice XP and Resonance Points at half rate — they never mark a
              campaign challenge complete.
            </p>
          </>
        ) : (
          <>
            <p className="text-academy-cream/55 text-sm leading-relaxed mb-5">
              The notes come to you. A line of music scrolls in from the right; press the letter each
              note sits on the instant it crosses the gold line. Everything is written for your{' '}
              <span className="text-academy-cream/80">{char.instrument.replace('_', ' ')}</span> —
              real clef, real key signature, real transposition.
            </p>

            <HowToPlay />

            <Section title="Difficulty">
              <div className="grid gap-2 sm:grid-cols-3">
                {DIFFICULTIES.map((d) => (
                  <button key={d.id} onClick={() => setDifficultyId(d.id)}
                    className={`card-panel py-3 text-left transition-all ${
                      difficultyId === d.id ? 'border-academy-gold/70' : 'hover:border-academy-gold/30'}`}>
                    <div className={`font-fantasy text-sm ${difficultyId === d.id ? 'text-academy-gold' : 'text-academy-cream/80'}`}>
                      {d.name}
                    </div>
                    <div className="text-academy-cream/40 text-[11px] mt-1 leading-snug">{d.blurb}</div>
                    <div className="text-academy-cream/30 text-[10px] mt-1.5">
                      Tempo ×{d.tempoMult} · Score ×{d.scoreMult}
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {!demoMode && (
              <Section title="Input">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button onClick={() => setInputMode('keys')}
                    className={`card-panel py-3 text-left transition-all ${
                      inputMode === 'keys' ? 'border-academy-gold/70' : 'hover:border-academy-gold/30'}`}>
                    <div className={`font-fantasy text-sm ${inputMode === 'keys' ? 'text-academy-gold' : 'text-academy-cream/80'}`}>
                      Keys &amp; Taps
                    </div>
                    <div className="text-academy-cream/40 text-[11px] mt-1">
                      Home row or the seven buttons. Silent — play anywhere.
                    </div>
                  </button>
                  <button onClick={() => setInputMode('mic')}
                    className={`card-panel py-3 text-left transition-all ${
                      inputMode === 'mic' ? 'border-academy-gold/70' : 'hover:border-academy-gold/30'}`}>
                    <div className={`font-fantasy text-sm ${inputMode === 'mic' ? 'text-academy-gold' : 'text-academy-cream/80'}`}>
                      Live Instrument
                    </div>
                    <div className="text-academy-cream/40 text-[11px] mt-1">
                      Play the notes for real — the microphone hears the pitch and times it.
                    </div>
                  </button>
                </div>
              </Section>
            )}

            <Section title="Charts">
              {(Object.keys(byType) as ExcerptChallengeType[]).map((type) => (
                <div key={type} className="mb-5">
                  <h3 className="text-academy-cream/35 text-[10px] uppercase tracking-widest mb-2">
                    {TYPE_LABELS[type]}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {byType[type].map((e) => {
                      const best = bestForExcerpt(char.id, e.id);
                      return (
                        <button key={e.id} onClick={() => setSelected(e)}
                          className="card-panel text-left py-3 hover:border-academy-gold/40 transition-all">
                          <div className="text-academy-cream/85 text-xs font-fantasy leading-tight mb-1">{e.title}</div>
                          <div className="text-academy-cream/30 text-[9px]">
                            {e.grade ? `Grade ${e.grade} · ` : ''}♩={e.bpm} · {Math.round(excerptBeats(e))} beats
                          </div>
                          {best && (
                            <div className="text-academy-gold/70 text-[9px] mt-1.5 tabular-nums">
                              Best {best.score.toLocaleString()} · {best.accuracyPct}%
                              {best.fullCombo && ' · FC'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="fantasy-title text-xs text-academy-gold/60 uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="card-panel py-4 mb-6">
      <div className="text-academy-cream/40 text-[10px] uppercase tracking-widest mb-3">How to play</div>
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {LANE_LETTERS.map((letter, i) => (
          <div key={letter} className="rounded-lg py-2 text-center"
            style={{ border: `2px solid ${LANE_COLORS[i]}`, background: `${LANE_COLORS[i]}1f` }}>
            <div className="font-fantasy text-base leading-none" style={{ color: LANE_COLORS[i] }}>{letter}</div>
            <div className="text-[9px] mt-0.5 font-mono text-academy-cream/35">{LANE_KEY_LABELS[i]}</div>
          </div>
        ))}
      </div>
      <ul className="text-academy-cream/50 text-[11px] space-y-1.5 leading-relaxed">
        <li>· Seven lanes, one per letter name. The home row <span className="font-mono text-academy-cream/70">A S D F G H J</span> (or <span className="font-mono text-academy-cream/70">1–7</span>) plays C D E F G A B — octave and accidentals don't change the lane, so just read the line or space.</li>
        <li>· Noteheads carry the chime-bar colours of their letter, so the colour and the staff position teach each other.</li>
        <li>· Hold a half or whole note's tail down for bonus points.</li>
        <li>· Eight in a row raises your multiplier, up to ×4. Perfect hits charge <span className="text-academy-gold">Resonance Surge</span> — spend it with <span className="font-mono text-academy-cream/70">Space</span> to double the multiplier for eight beats.</li>
      </ul>
    </div>
  );
}
