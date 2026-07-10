import { useState } from 'react';

interface Beat { emoji: string; text: string }

// The premise, drawn from NARRATIVE.md §1–2. Shown once before Boot Camp and
// replayable from the Hub.
const BEATS: Beat[] = [
  { emoji: '✍️', text: 'The Composer wrote the world of Symphonica into being. Its life is held by the Grand Symphony — the ten Sacred Scores, sounded whole.' },
  { emoji: '🎼', text: 'Ten Maestros — the section-leader professors of Harmonia Academy — perform it each year at graduation. This Renewal keeps the world alive. To direct them, the Composer appointed a Conductor: Vexus.' },
  { emoji: '🎭', text: 'But Vexus grew obsessed with proving himself the Composer\'s equal. In secret, he threaded dissonant tritones through this year\'s Score.' },
  { emoji: '💥', text: 'At the Renewal it curdled and shattered. Each shard drove into a Maestro, corrupting them. Vexus blamed his players, abandoned living music, and retreated to his island — Discordia.' },
  { emoji: '🌫️', text: 'The world grays. The professors are twisted into monsters. Only the newest musicians — this year\'s students — remain clear-headed enough to play with a whole heart.' },
  { emoji: '🎺', text: 'You are one of them. Reclaim the ten Noteshards from your own professors, restore the Grand Symphony, and perform it at the source to silence Vexus. But first — your very first lesson.' },
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
      <div className="text-6xl mb-6" style={{ filter: 'drop-shadow(0 0 24px #D4A01755)' }}>{b.emoji}</div>
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
