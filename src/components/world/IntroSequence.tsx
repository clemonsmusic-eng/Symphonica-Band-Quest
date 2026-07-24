import { useState } from 'react';

interface Beat { emoji: string; image?: string; text: string }

// The premise, drawn from NARRATIVE.md §1–2. Shown once before Boot Camp and
// replayable from the Hub. Per-beat key art lives in public/intro/ (FF6-style
// pixel art); a beat without art falls back to its emoji.
const BEATS: Beat[] = [
  { emoji: '✍️', image: '/intro/scene1.webp', text: 'In the beginning there was the Composer, who wrote the world of Symphonica into being, note by note. Its every heartbeat is the Grand Symphony — ten Sacred Scores that, sounded whole, keep the world alive.' },
  { emoji: '🎼', image: '/intro/scene2.webp', text: 'The ten Maestros teach at Harmonia Academy, and each graduation they perform the Grand Symphony anew — the Renewal. Fennelio founded the school and first raised the baton, before he passed it to his star pupil and Conductor: Vexus.' },
  { emoji: '🎭', image: '/intro/scene3.webp', text: 'But Vexus judged the Composer\'s music timid. Alone in his office, in secret, he rewrote this year\'s Score — threading it through with poisoned, unresolving tritones.' },
  { emoji: '💥', image: '/intro/scene4.webp', text: 'At the Renewal his tritones curdled, and the Grand Symphony shattered. Ten Noteshards tore into the ten Maestros; Fennelio was struck down; and Vexus, blaming his players, fled west to his island — Discordia.' },
  { emoji: '🌫️', image: '/intro/scene5.webp', text: 'The color drained from the world. The Maestros are monsters now, the great musicians grey and still — everyone dulled but the newest players, whose hearts the corruption could not reach.' },
  { emoji: '🎺', image: '/intro/scene6.webp', text: 'You are one of them. Reclaim the ten Noteshards from the teachers you loved, make the Grand Symphony whole, and carry it to Discordia to silence Vexus. But every hero starts somewhere — and yours starts with your very first lesson.' },
];

export default function IntroSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === BEATS.length - 1;
  const b = BEATS[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-academy-dark"
      style={{ backgroundImage: 'radial-gradient(ellipse at top, #1a0e0240 0%, transparent 65%)' }}>
      <div className="text-academy-gold/50 text-[10px] uppercase tracking-[0.5em] font-fantasy mb-6">
        Symphonica · The Story So Far
      </div>
      {b.image ? (
        <img
          key={b.image}
          src={b.image}
          alt=""
          className="w-full max-w-xl mb-6 rounded-lg border border-academy-gold/30 shadow-lg"
          style={{ boxShadow: '0 0 32px #D4A01733' }}
        />
      ) : (
        <div className="text-6xl mb-6" style={{ filter: 'drop-shadow(0 0 24px #D4A01755)' }}>{b.emoji}</div>
      )}
      <div className="card-panel max-w-md w-full mb-8 border-academy-gold/30">
        <p className="text-academy-cream/85 text-sm leading-relaxed">{b.text}</p>
      </div>
      <div className="flex items-center gap-2 mb-8">
        {BEATS.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-academy-gold' : 'w-1.5 bg-academy-cream/20'}`} />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onDone} className="text-academy-cream/40 hover:text-academy-cream/70 text-xs">Skip</button>
        <button onClick={() => (last ? onDone() : setStep(step + 1))} className="btn-primary">
          {last ? 'Begin →' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
