import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getInstrumentColor } from '../lib/instruments';
import RhythmGlyph from '../components/minigames/RhythmGlyph';
import {
  VARIANTS, DIFFICULTIES, PAR_SECONDS,
  generatePuzzle, conflictCells, isSolved, valueCounts, boxIndex,
  scoreRun, ratingForScore, formatClock,
} from '../lib/minigames/rhythmSudoku';
import type { Cell, Difficulty, Puzzle, VariantDef, VariantId } from '../lib/minigames/rhythmSudoku';
import type { Rating } from '../types/game';

const RATING_COLORS: Record<Rating, string> = {
  superior:  'text-rating-superior',
  excellent: 'text-rating-excellent',
  good:      'text-rating-good',
  fair:      'text-rating-fair',
  poor:      'text-rating-poor',
};

// XP weighting: a 9×9 is worth more than a 6×6, and sparse clues more than dense.
const VARIANT_XP: Record<VariantId, number> = { mini: 0.7, full: 1.3 };
const DIFFICULTY_XP: Record<Difficulty, number> = { apprentice: 0.8, performer: 1.0, maestro: 1.3 };

const CELL_BG = '#0d1520';

// ── Saved progress ────────────────────────────────────────────────────────────

interface SavedGame {
  puzzle: Puzzle;
  board: Cell[];
  marks: number[][];
  mistakes: number;
  hints: number;
  seconds: number;
  revealed: number[];
}

type BestTimes = Record<string, { seconds: number; score: number }>;

const saveKey = (charId: string) => `bq_rhythm_sudoku_${charId}`;
const bestKey = (charId: string) => `bq_rhythm_sudoku_best_${charId}`;
const runKey = (v: VariantId, d: Difficulty) => `${v}_${d}`;

function loadSaved(charId: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(saveKey(charId));
    return raw ? (JSON.parse(raw) as SavedGame) : null;
  } catch { return null; }
}
function writeSaved(charId: string, game: SavedGame | null) {
  try {
    if (game) localStorage.setItem(saveKey(charId), JSON.stringify(game));
    else localStorage.removeItem(saveKey(charId));
  } catch { /* ignore */ }
}
function loadBests(charId: string): BestTimes {
  try {
    const raw = localStorage.getItem(bestKey(charId));
    return raw ? (JSON.parse(raw) as BestTimes) : {};
  } catch { return {}; }
}
function writeBests(charId: string, bests: BestTimes) {
  try { localStorage.setItem(bestKey(charId), JSON.stringify(bests)); } catch { /* ignore */ }
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Phase = 'select' | 'playing' | 'won';

interface Snapshot { board: Cell[]; marks: number[][]; revealed: number[] }

export default function RhythmSudokuPage() {
  const navigate = useNavigate();
  const { character, awardChallenge } = useGameStore();

  const [phase, setPhase] = useState<Phase>('select');
  const [variant, setVariant] = useState<VariantId>('mini');
  const [difficulty, setDifficulty] = useState<Difficulty>('apprentice');
  const [building, setBuilding] = useState(false);

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<Cell[]>([]);
  const [marks, setMarks] = useState<number[][]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [counted, setCounted] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<Snapshot[]>([]);

  const [selected, setSelected] = useState<number | null>(null);
  const [pencil, setPencil] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const [result, setResult] = useState<{ score: number; rating: Rating; seconds: number; xp: number } | null>(null);
  const [bests, setBests] = useState<BestTimes>({});
  const [saved, setSaved] = useState<SavedGame | null>(null);

  const awardedRef = useRef(false);

  const charId = character?.id ?? '';
  const color = character ? getInstrumentColor(character.instrument) : '#C9A227';

  const def: VariantDef = VARIANTS[puzzle?.variant ?? variant];
  const conflicts = useMemo(() => (board.length ? conflictCells(def, board) : new Set<number>()), [def, board]);
  const counts = useMemo(() => (board.length ? valueCounts(def, board) : []), [def, board]);

  // Restore any in-progress puzzle and personal bests once the character loads.
  useEffect(() => {
    if (!charId) return;
    setBests(loadBests(charId));
    setSaved(loadSaved(charId));
  }, [charId]);

  // Clock — pauses with the board, and stops the moment the puzzle is solved.
  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase, paused]);

  // Persist progress so a student can leave mid-puzzle and come back to it.
  useEffect(() => {
    if (phase !== 'playing' || !puzzle || !charId) return;
    writeSaved(charId, { puzzle, board, marks, mistakes, hints, seconds, revealed: [...revealed] });
  }, [phase, puzzle, board, marks, mistakes, hints, seconds, revealed, charId]);

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  const beginGame = useCallback((p: Puzzle, restore?: SavedGame) => {
    setPuzzle(p);
    setBoard(restore ? restore.board : p.givens.slice());
    setMarks(restore ? restore.marks : p.givens.map(() => []));
    setRevealed(new Set(restore?.revealed ?? []));
    setMistakes(restore?.mistakes ?? 0);
    setHints(restore?.hints ?? 0);
    setSeconds(restore?.seconds ?? 0);
    setWrong(new Set());
    setCounted(new Set());
    setHistory([]);
    setSelected(null);
    setPencil(false);
    setPaused(false);
    setResult(null);
    awardedRef.current = false;
    setPhase('playing');
  }, []);

  function startNew(v: VariantId, d: Difficulty) {
    setBuilding(true);
    // Yield a frame so the "composing" state paints before the generator runs.
    setTimeout(() => {
      beginGame(generatePuzzle(v, d));
      setBuilding(false);
    }, 20);
  }

  function resumeSaved() {
    if (!saved) return;
    setVariant(saved.puzzle.variant);
    setDifficulty(saved.puzzle.difficulty);
    beginGame(saved.puzzle, saved);
  }

  /** Back to the board picker, leaving the puzzle saved for a Resume. */
  function leaveToSelect() {
    setSaved(loadSaved(charId));
    setPuzzle(null);
    setPhase('select');
  }

  /** Throw the puzzle away for good. */
  function abandon() {
    writeSaved(charId, null);
    setSaved(null);
    setPuzzle(null);
    setPhase('select');
  }

  // ── Board edits ─────────────────────────────────────────────────────────────

  const isGiven = (i: number) => !!puzzle && puzzle.givens[i] !== null;
  const isLocked = (i: number) => isGiven(i) || revealed.has(i);

  function pushHistory() {
    setHistory((h) => [...h.slice(-49), {
      board: board.slice(), marks: marks.map((m) => m.slice()), revealed: [...revealed],
    }]);
  }

  /**
   * Step back one move. Undoing a reveal unlocks the cell again but keeps the
   * hint on the tally — you don't get to un-see the answer.
   */
  function undo() {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (!prev) return h;
      setBoard(prev.board);
      setMarks(prev.marks);
      setRevealed(new Set(prev.revealed));
      setWrong(new Set());
      return h.slice(0, -1);
    });
  }

  /** Place a value in the selected cell, or toggle it as a pencil mark. */
  function enterValue(value: number) {
    if (selected === null || !puzzle || isLocked(selected)) return;
    pushHistory();

    if (pencil && board[selected] === null) {
      setMarks((ms) => ms.map((m, i) => {
        if (i !== selected) return m;
        return m.includes(value) ? m.filter((v) => v !== value) : [...m, value].sort((a, b) => a - b);
      }));
      return;
    }

    const next = board.slice();
    next[selected] = board[selected] === value ? null : value;   // tap again to clear
    setBoard(next);
    setWrong((w) => { const n = new Set(w); n.delete(selected); return n; });

    setMarks((ms) => {
      const out = ms.map((m, i) => (i === selected ? [] : m));
      if (next[selected] === null) return out;
      // Placing a value retires it from the pencil marks of every peer cell.
      const row = Math.floor(selected / def.size);
      const col = selected % def.size;
      const box = boxIndex(def, row, col);
      return out.map((m, i) => {
        if (i === selected || m.length === 0) return m;
        const r = Math.floor(i / def.size);
        const c = i % def.size;
        const peer = r === row || c === col || boxIndex(def, r, c) === box;
        return peer ? m.filter((v) => v !== value) : m;
      });
    });
  }

  function eraseCell() {
    if (selected === null || isLocked(selected)) return;
    pushHistory();
    setBoard((b) => { const n = b.slice(); n[selected] = null; return n; });
    setMarks((ms) => ms.map((m, i) => (i === selected ? [] : m)));
    setWrong((w) => { const n = new Set(w); n.delete(selected); return n; });
  }

  /** Flag every entry that contradicts the solution; each cell counts once. */
  function checkBoard() {
    if (!puzzle) return;
    const bad = new Set<number>();
    board.forEach((c, i) => {
      if (c !== null && !isLocked(i) && c !== puzzle.solution[i]) bad.add(i);
    });
    setWrong(bad);
    const fresh = [...bad].filter((i) => !counted.has(i));
    if (fresh.length) {
      setMistakes((m) => m + fresh.length);
      setCounted((s) => new Set([...s, ...fresh]));
    }
  }

  /** Fill one cell from the solution — the selected one, else a random empty. */
  function revealCell() {
    if (!puzzle) return;
    const empties = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
    const target = selected !== null && board[selected] === null ? selected
      : empties.length ? empties[Math.floor(Math.random() * empties.length)]
      : null;
    if (target === null) return;

    pushHistory();
    setBoard((b) => { const n = b.slice(); n[target] = puzzle.solution[target]; return n; });
    setMarks((ms) => ms.map((m, i) => (i === target ? [] : m)));
    setRevealed((r) => new Set([...r, target]));
    setHints((h) => h + 1);
    setSelected(target);
  }

  // ── Win detection ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || !puzzle || board.length === 0) return;
    if (!isSolved(def, board)) return;
    if (awardedRef.current) return;
    awardedRef.current = true;

    const stats = { mistakes, hints, seconds };
    const score = scoreRun(puzzle.variant, puzzle.difficulty, stats);
    const rating = ratingForScore(score) as Rating;

    const key = runKey(puzzle.variant, puzzle.difficulty);
    const prevBest = bests[key];
    if (!prevBest || seconds < prevBest.seconds || score > prevBest.score) {
      const nextBests: BestTimes = {
        ...bests,
        [key]: {
          seconds: prevBest ? Math.min(prevBest.seconds, seconds) : seconds,
          score: prevBest ? Math.max(prevBest.score, score) : score,
        },
      };
      setBests(nextBests);
      writeBests(charId, nextBests);
    }
    writeSaved(charId, null);
    setSaved(null);

    const challengeId = `rhythm_sudoku_${puzzle.variant}_${puzzle.difficulty}`;
    const firstClear = !character?.completedChallenges.includes(challengeId);
    const xpMultiplier = VARIANT_XP[puzzle.variant] * DIFFICULTY_XP[puzzle.difficulty] * (firstClear ? 1 : 0.5);
    const xp = Math.round(150 * xpMultiplier * ({ superior: 1, excellent: 0.8, good: 0.6, fair: 0.3, poor: 0.1 }[rating]));

    setResult({ score, rating, seconds, xp });
    setPhase('won');
    void awardChallenge(challengeId, 'rhythm_puzzle', score, rating, { xpMultiplier, trackCompletion: true });
  }, [phase, board, def, puzzle, mistakes, hints, seconds, bests, charId, character, awardChallenge]);

  // ── Keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    function onKey(e: KeyboardEvent) {
      const size = def.size;
      if (e.key >= '1' && e.key <= '9') {
        const v = parseInt(e.key, 10) - 1;
        if (v < size) { e.preventDefault(); enterValue(v); }
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { e.preventDefault(); eraseCell(); return; }
      if (e.key.toLowerCase() === 'p') { setPencil((p) => !p); return; }
      if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
      const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -size, ArrowDown: size };
      const d = deltas[e.key];
      if (d !== undefined) {
        e.preventDefault();
        setSelected((cur) => {
          if (cur === null) return 0;
          if ((e.key === 'ArrowLeft' && cur % size === 0) || (e.key === 'ArrowRight' && cur % size === size - 1)) return cur;
          const next = cur + d;
          return next >= 0 && next < size * size ? next : cur;
        });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!character) return null;

  // ── Selection screen ────────────────────────────────────────────────────────

  if (phase === 'select') {
    return (
      <div className="min-h-screen pb-16">
        <TopBar label="← Hub" onBack={() => navigate('/hub')} />
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <p className="text-academy-cream/50 text-sm text-center mb-6">
            Every row, every column and every box must hold each rhythmic value exactly once.
            No arithmetic — just reading the notation.
          </p>

          {saved && (
            <button
              onClick={resumeSaved}
              className="w-full card-panel py-4 mb-5 flex items-center gap-4 text-left hover:border-academy-gold/60 transition-all cursor-pointer"
            >
              <div className="text-3xl">⏱</div>
              <div className="flex-1">
                <div className="text-academy-cream/90 text-sm font-fantasy">Resume your puzzle</div>
                <div className="text-academy-cream/40 text-xs">
                  {VARIANTS[saved.puzzle.variant].name} · {DIFFICULTIES.find((d) => d.id === saved.puzzle.difficulty)?.name}
                  {' · '}{formatClock(saved.seconds)} elapsed
                </div>
              </div>
              <div className="text-xs font-fantasy text-academy-gold">RESUME →</div>
            </button>
          )}

          {/* Board size */}
          <SectionLabel>Choose your board</SectionLabel>
          <div className="grid gap-3 mb-6">
            {(['mini', 'full'] as VariantId[]).map((id) => {
              const v = VARIANTS[id];
              const active = variant === id;
              return (
                <button
                  key={id}
                  onClick={() => setVariant(id)}
                  className="card-panel py-4 text-left transition-all cursor-pointer"
                  style={{
                    borderColor: active ? color : 'rgba(201,162,39,0.2)',
                    backgroundColor: active ? `${color}12` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="fantasy-title text-base" style={{ color: active ? color : undefined }}>
                      {v.name}
                    </div>
                    <div className="text-academy-cream/40 text-xs font-fantasy">{v.size}×{v.size}</div>
                  </div>
                  <div className="text-academy-cream/40 text-xs mb-3">{v.blurb}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {v.values.map((val) => (
                      <div
                        key={val.id}
                        className="rounded flex items-center justify-center"
                        style={{ width: 32, height: 32, background: CELL_BG, border: '1px solid rgba(245,236,215,0.12)' }}
                      >
                        <RhythmGlyph value={val} size={19} centered color="#F5ECD7" hollowFill={CELL_BG} />
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Difficulty */}
          <SectionLabel>Choose your part</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.id;
              const best = bests[runKey(variant, d.id)];
              return (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className="card-panel py-3 px-3 text-left transition-all cursor-pointer"
                  style={{
                    borderColor: active ? color : 'rgba(201,162,39,0.2)',
                    backgroundColor: active ? `${color}12` : undefined,
                  }}
                >
                  <div className="text-academy-cream/90 text-xs font-fantasy mb-1">{d.name}</div>
                  <div className="text-academy-cream/35 text-[10px] leading-tight">{d.blurb}</div>
                  <div className="text-[10px] mt-2 font-fantasy" style={{ color: best ? color : 'rgba(245,236,215,0.25)' }}>
                    {best ? `best ${formatClock(best.seconds)}` : 'unplayed'}
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={() => startNew(variant, difficulty)} disabled={building} className="btn-primary w-full disabled:opacity-50">
            {building ? 'Composing…' : 'Begin'}
          </button>

          <ValueLegend variant={VARIANTS[variant]} className="mt-6" />
        </div>
      </div>
    );
  }

  if (!puzzle) return null;

  // ── Board ───────────────────────────────────────────────────────────────────

  const selValue = selected !== null ? board[selected] : null;
  const selRow = selected !== null ? Math.floor(selected / def.size) : -1;
  const selCol = selected !== null ? selected % def.size : -1;
  const selBox = selected !== null ? boxIndex(def, selRow, selCol) : -1;
  const filled = board.filter((c) => c !== null).length;

  return (
    <div className="min-h-screen pb-16">
      <TopBar label="← Boards" onBack={leaveToSelect} />

      <div className="max-w-lg mx-auto px-3 pt-3">
        {/* Run status */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="text-academy-cream/50 font-fantasy">
            {def.name} · {DIFFICULTIES.find((d) => d.id === puzzle.difficulty)?.name}
          </div>
          <div className="flex items-center gap-3 text-academy-cream/40">
            <span title="Wrong entries found by Check">✗ {mistakes}</span>
            <span title="Cells revealed">💡 {hints}</span>
            <button
              onClick={() => setPaused((p) => !p)}
              className="font-fantasy text-academy-cream/70 hover:text-academy-gold transition-colors tabular-nums"
              title={paused ? 'Resume the clock' : 'Pause the clock'}
            >
              {paused ? '▶' : '⏸'} {formatClock(seconds)}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="relative">
          <div
            className="grid rounded-lg overflow-hidden select-none"
            style={{
              gridTemplateColumns: `repeat(${def.size}, minmax(0, 1fr))`,
              border: '2px solid rgba(201,162,39,0.55)',
              background: CELL_BG,
              filter: paused ? 'blur(6px)' : undefined,
              pointerEvents: paused ? 'none' : undefined,
            }}
          >
            {board.map((cell, i) => {
              const r = Math.floor(i / def.size);
              const c = i % def.size;
              const given = isGiven(i);
              const hinted = revealed.has(i);
              const isSel = selected === i;
              const isPeer = !isSel && (r === selRow || c === selCol || boxIndex(def, r, c) === selBox);
              const sameValue = cell !== null && selValue !== null && cell === selValue && !isSel;
              const isWrong = wrong.has(i);
              const isConflict = conflicts.has(i);

              const ink = isWrong || isConflict ? '#F87171' : given ? '#F5ECD7' : hinted ? '#60A5FA' : color;

              let bg = 'transparent';
              if (given) bg = 'rgba(245,236,215,0.05)';
              if (isPeer) bg = 'rgba(201,162,39,0.07)';
              if (sameValue) bg = 'rgba(201,162,39,0.16)';
              if (isConflict || isWrong) bg = 'rgba(248,113,113,0.16)';
              if (isSel) bg = `${color}33`;

              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  aria-label={`Row ${r + 1}, column ${c + 1}: ${cell === null ? 'empty' : def.values[cell].name}`}
                  className="aspect-square flex items-center justify-center relative transition-colors"
                  style={{
                    background: bg,
                    borderTop: r === 0 ? 'none' : `${r % def.boxH === 0 ? 2 : 1}px solid rgba(201,162,39,${r % def.boxH === 0 ? 0.5 : 0.16})`,
                    borderLeft: c === 0 ? 'none' : `${c % def.boxW === 0 ? 2 : 1}px solid rgba(201,162,39,${c % def.boxW === 0 ? 0.5 : 0.16})`,
                    boxShadow: isSel ? `inset 0 0 0 2px ${color}` : undefined,
                  }}
                >
                  {cell !== null ? (
                    <RhythmGlyph
                      value={def.values[cell]}
                      size={def.size === 6 ? 26 : 19}
                      centered
                      color={ink}
                      hollowFill={CELL_BG}
                    />
                  ) : marks[i]?.length ? (
                    <PencilMarks values={marks[i]} def={def} />
                  ) : null}
                </button>
              );
            })}
          </div>

          {paused && (
            <button
              onClick={() => setPaused(false)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            >
              <div className="text-3xl">⏸</div>
              <div className="fantasy-title text-sm text-academy-gold">Paused — tap to resume</div>
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-3 mb-3">
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${(filled / board.length) * 100}%`, backgroundColor: color }} />
          </div>
        </div>

        {/* Value palette */}
        <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: `repeat(${def.size}, minmax(0, 1fr))` }}>
          {def.values.map((v, idx) => {
            const used = counts[idx] ?? 0;
            const exhausted = used >= def.size;
            return (
              <button
                key={v.id}
                onClick={() => enterValue(idx)}
                disabled={selected === null || isLocked(selected)}
                aria-label={`${pencil ? 'Pencil in' : 'Place'} ${v.name}`}
                title={`${v.name} — ${v.beats} beat${v.beats === 1 ? '' : 's'}`}
                className="rounded-lg flex flex-col items-center justify-center py-2 transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  background: CELL_BG,
                  border: `1px solid ${exhausted ? 'rgba(245,236,215,0.08)' : 'rgba(201,162,39,0.35)'}`,
                }}
              >
                <RhythmGlyph
                  value={v}
                  size={def.size === 6 ? 26 : 20}
                  centered
                  color={pencil ? '#C9A227' : color}
                  hollowFill={CELL_BG}
                  opacity={exhausted ? 0.3 : 1}
                />
                <div className="text-[9px] mt-1 tabular-nums" style={{ color: exhausted ? 'rgba(245,236,215,0.2)' : 'rgba(245,236,215,0.4)' }}>
                  {def.size - used}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tools */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          <ToolButton icon="✏️" label="Notes" active={pencil} onClick={() => setPencil((p) => !p)} />
          <ToolButton icon="⌫" label="Erase" onClick={eraseCell} disabled={selected === null || isLocked(selected)} />
          <ToolButton icon="↶" label="Undo" onClick={undo} disabled={history.length === 0} />
          <ToolButton icon="✓" label="Check" onClick={checkBoard} />
          <ToolButton icon="💡" label="Reveal" onClick={revealCell} />
        </div>

        <ValueLegend variant={def} open={showLegend} onToggle={() => setShowLegend((s) => !s)} />

        <button onClick={abandon} className="w-full text-academy-cream/30 hover:text-academy-cream/60 text-xs mt-4 transition-colors">
          Abandon this puzzle
        </button>
      </div>

      {/* Victory */}
      {phase === 'won' && result && (
        <div className="fixed inset-0 z-30 bg-academy-dark/95 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="card-panel w-full max-w-sm text-center">
            <div className="text-4xl mb-2">🥁</div>
            <div className="fantasy-title text-xl text-academy-gold mb-1">Rhythm Restored</div>
            <div className="text-academy-cream/50 text-xs mb-5">
              {def.name} · {DIFFICULTIES.find((d) => d.id === puzzle.difficulty)?.name}
            </div>

            <div className={`font-fantasy text-2xl uppercase mb-1 ${RATING_COLORS[result.rating]}`}>{result.rating}</div>
            <div className="text-academy-cream/40 text-xs mb-5">{result.score} / 100</div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <Stat label="Time" value={formatClock(result.seconds)} />
              <Stat label="Wrong" value={String(mistakes)} />
              <Stat label="Revealed" value={String(hints)} />
            </div>

            <div className="text-sm font-fantasy mb-1" style={{ color }}>+{result.xp} XP</div>
            <div className="text-academy-cream/35 text-[10px] mb-5">
              Par for this board is {formatClock(PAR_SECONDS[puzzle.variant][puzzle.difficulty])}
              {bests[runKey(puzzle.variant, puzzle.difficulty)]
                && ` · your best is ${formatClock(bests[runKey(puzzle.variant, puzzle.difficulty)].seconds)}`}
            </div>

            <div className="flex gap-2">
              <button onClick={() => startNew(puzzle.variant, puzzle.difficulty)} className="btn-primary flex-1 text-sm py-2.5">
                Another
              </button>
              <button onClick={abandon} className="btn-secondary flex-1 text-sm py-2.5">
                Change board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function TopBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-20 bg-academy-dark/95 backdrop-blur-sm border-b border-academy-gold/10 px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} className="text-academy-cream/40 hover:text-academy-cream/80 text-sm transition-colors whitespace-nowrap">
        {label}
      </button>
      <div className="fantasy-title text-lg text-academy-gold flex-1 text-center">Rhythm Sudoku</div>
      <div className="w-16" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="fantasy-title text-xs text-academy-gold/70 uppercase tracking-widest mb-3">{children}</h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="text-academy-cream/35 text-[9px] uppercase tracking-wider">{label}</div>
      <div className="text-academy-cream/80 text-sm font-fantasy tabular-nums">{value}</div>
    </div>
  );
}

function ToolButton({ icon, label, onClick, active, disabled }: {
  icon: string; label: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg py-2 flex flex-col items-center gap-0.5 transition-all disabled:opacity-30 cursor-pointer"
      style={{
        background: active ? 'rgba(201,162,39,0.18)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(201,162,39,0.6)' : 'rgba(201,162,39,0.18)'}`,
      }}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-academy-cream/50 text-[9px]">{label}</span>
    </button>
  );
}

/** Candidate values a player has pencilled into an empty cell. */
function PencilMarks({ values, def }: { values: number[]; def: VariantDef }) {
  return (
    <div
      className="grid w-full h-full p-[2px]"
      style={{ gridTemplateColumns: `repeat(${def.boxW}, minmax(0, 1fr))` }}
    >
      {def.values.map((v, idx) => (
        <div key={v.id} className="flex items-center justify-center">
          {values.includes(idx) && (
            <RhythmGlyph value={v} size={def.size === 6 ? 11 : 9} centered color="#C9A227" hollowFill={CELL_BG} opacity={0.85} />
          )}
        </div>
      ))}
    </div>
  );
}

/** The value chart: what each symbol is called and how long it lasts. */
function ValueLegend({ variant, className, open, onToggle }: {
  variant: VariantDef; className?: string; open?: boolean; onToggle?: () => void;
}) {
  const collapsible = onToggle !== undefined;
  const shown = collapsible ? !!open : true;
  return (
    <div className={className}>
      {collapsible && (
        <button
          onClick={onToggle}
          className="w-full text-academy-cream/40 hover:text-academy-cream/70 text-xs py-1.5 transition-colors"
        >
          {shown ? '▾' : '▸'} Rhythm chart
        </button>
      )}
      {shown && (
        <div className="card-panel py-3">
          {!collapsible && (
            <div className="text-academy-cream/35 text-[10px] uppercase tracking-widest mb-3">Rhythm chart</div>
          )}
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {variant.values.map((v, i) => (
              <div key={v.id} className="flex items-center gap-2">
                <div
                  className="rounded flex items-center justify-center flex-shrink-0"
                  style={{ width: 30, height: 30, background: CELL_BG, border: '1px solid rgba(245,236,215,0.1)' }}
                >
                  <RhythmGlyph value={v} size={18} centered hollowFill={CELL_BG} />
                </div>
                <div className="min-w-0">
                  <div className="text-academy-cream/70 text-[11px] truncate">{v.name}</div>
                  <div className="text-academy-cream/35 text-[9px]">
                    {v.beats} beat{v.beats === 1 ? '' : 's'}{v.rest ? ' of silence' : ''} · key {i + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
