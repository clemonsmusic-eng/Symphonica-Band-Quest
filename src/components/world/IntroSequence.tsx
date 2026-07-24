import { useState } from 'react';

interface Beat { emoji: string; image?: string; text: string }

// The premise, drawn from NARRATIVE.md §1–2. Shown once before Boot Camp and
// replayable from the Hub. Per-beat key art lives in public/intro/ (FF6-style
// pixel art); a beat without art falls back to its emoji.
const BEATS: Beat[] = [
  { emoji: '✍️', image: '/intro/scene1.webp', text: 'In the beginning there was the Composer, who wrote the world of Symphonica into being, note by note. Its every heartbeat is the Grand Symphony — ten Sacred Scores that, sounded whole, keep the world alive.' },
  { emoji: '🎼', image: '/intro/scene2.webp', text: 'To keep it alive, the ten Maestros perform the Grand Symphony anew each year — the Renewal — led by a single Conductor. In those early days the baton was Fennelio\'s, and under it the whole world sang.' },
  { emoji: '📜', image: '/intro/scene3.webp', text: 'Fennelio\'s finest student was Vexus, who loved the Grand Symphony beyond all reason — night after night he pored over the ten original Scores, alight with ideas. Watching that fire, the old Conductor thought: here is my heir.' },
  { emoji: '🤝', image: '/intro/scene4.webp', text: 'So Fennelio placed his baton in Vexus\'s hands and stepped down from the podium. Vexus wept with gratitude — to conduct the Grand Symphony was all he had ever dreamed. No one loved the music more.' },
  { emoji: '🏛️', image: '/intro/scene5.webp', text: 'His conducting days behind him, Fennelio founded Harmonia Academy and gathered the ten Maestros as its teachers — so every new generation would learn to sound the Renewal, and the world would never fall silent.' },
  { emoji: '🎺', image: '/intro/scene6.webp', text: 'That is the world you were born into. Today you arrive at the Academy gates as its newest student — a Maestro, perhaps, in the making. But greatness starts small. Your very first lesson awaits.' },
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
