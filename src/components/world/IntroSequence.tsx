import { useState } from 'react';

interface Beat { emoji: string; image?: string; text: string }

// The premise, drawn from NARRATIVE.md §1–2. Shown once before Boot Camp and
// replayable from the Hub. Per-beat key art lives in public/intro/ (FF6-style
// pixel art); a beat without art falls back to its emoji.
const BEATS: Beat[] = [
  { emoji: '✍️', image: '/intro/scene1.webp', text: 'In the beginning there was the Composer, who wrote the world of Symphonica into being, note by note. Its every heartbeat is the Grand Symphony — ten Sacred Scores that, sounded whole, keep the world alive.' },
  { emoji: '🎼', image: '/intro/scene2.webp', text: 'To keep it alive, ten Maestros perform the Grand Symphony anew each year — the Renewal. And to lead them, the Composer created a single office above all others: the Conductor.' },
  { emoji: '🏛️', text: 'The first Conductor was Fennelio. When his conducting days waned, he founded Harmonia Academy — a school to raise each new generation of Maestros, so the Renewal would sound on forever.' },
  { emoji: '🤝', text: 'His finest student was Vexus. When Fennelio at last offered him the baton, Vexus wept with gratitude — to conduct the Grand Symphony was all he had ever dreamed. No one loved the music more.' },
  { emoji: '📜', text: 'But Vexus could not leave the ten original Scores alone. Night after night he pored over them, certain the Composer had left them unfinished — that he, and he alone, might one day make them perfect.' },
  { emoji: '🎺', text: 'That is the world you were born into. Today you enter it as Harmonia Academy\'s newest student — a Maestro, perhaps, in the making. But greatness starts small. Your very first lesson awaits.' },
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
