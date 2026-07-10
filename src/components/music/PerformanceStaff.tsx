import type { SeatedExcerpt, SeatedNote } from '../../lib/music/transposition';
import { seatedStep } from '../../lib/music/transposition';
import type { Clef } from '../../lib/music/staff';

const BG = '#0d1520';
const CREAM = '#d4c9a8';
const GOLD = '#D4A017';

const LINE_SP = 11;
const PAD_T = 34;
const STAFF_H = 4 * LINE_SP;
const SVG_H = PAD_T + STAFF_H + 34;
const NOTE_RX = 5.5;
const NOTE_RY = 3.7;
const STEM_LEN = 30;

// Key-signature accidental step positions (from MusicDiagram).
const TREBLE_SHARP_STEPS = [8, 5, 9, 6, 3, 7, 4];
const TREBLE_FLAT_STEPS = [4, 7, 3, 6, 2, 5, 1];
const BASS_SHARP_STEPS = [6, 3, 7, 4, 1, 5, 2];
const BASS_FLAT_STEPS = [2, 5, 1, 4, 0, 3, -1];

function stepY(step: number): number {
  return PAD_T + STAFF_H - step * (LINE_SP / 2);
}

interface Props {
  seated: SeatedExcerpt;
  timeSig: [number, number];
  totalBeats: number;
  pxPerBeat?: number;
  playheadBeat?: number | null;   // current position (sweeping line); null hides it
  noteColors?: (string | null)[]; // per note index → override colour (Phase 2 overlay)
}

export default function PerformanceStaff({
  seated, timeSig, totalBeats, pxPerBeat = 40, playheadBeat = null, noteColors,
}: Props) {
  const clef = seated.clef;
  const keyCount = Math.abs(seated.writtenKeySig);
  const isSharp = seated.writtenKeySig > 0;
  const CLEF_W = 30;
  const LEFT = 8;
  const keyW = keyCount * 9 + (keyCount ? 8 : 0);
  const timeW = 20;
  const notesX = LEFT + CLEF_W + keyW + timeW + 10;
  const width = notesX + Math.max(1, totalBeats) * pxPerBeat + 24;

  const keySteps = isSharp
    ? clef === 'treble' ? TREBLE_SHARP_STEPS : BASS_SHARP_STEPS
    : clef === 'treble' ? TREBLE_FLAT_STEPS : BASS_FLAT_STEPS;

  return (
    <div className="overflow-x-auto rounded-lg" style={{ background: BG, border: '1px solid rgba(212,160,23,0.2)' }}>
      <svg width={width} height={SVG_H} style={{ display: 'block' }}>
        {/* staff lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={LEFT} y1={PAD_T + i * LINE_SP} x2={width - 10} y2={PAD_T + i * LINE_SP}
            stroke={CREAM} strokeWidth={0.8} opacity={0.65} />
        ))}

        {/* clef */}
        {clef === 'treble' ? (
          <text x={LEFT + 2} y={PAD_T + STAFF_H + 7} fontSize={54} fill={CREAM} fontFamily="serif" opacity={0.9}>𝄞</text>
        ) : (
          <text x={LEFT + 2} y={PAD_T + LINE_SP + 5} fontSize={30} fill={CREAM} fontFamily="serif" opacity={0.9}>𝄢</text>
        )}

        {/* key signature */}
        {Array.from({ length: keyCount }, (_, i) => (
          <text key={i} x={LEFT + CLEF_W + i * 9} y={stepY(keySteps[i] ?? 4) + 5}
            fontSize={14} fill={CREAM} fontFamily="serif" opacity={0.9}>{isSharp ? '♯' : '♭'}</text>
        ))}

        {/* time signature */}
        <text x={LEFT + CLEF_W + keyW + 6} y={PAD_T + 1 * LINE_SP + 3} fontSize={13} fill={CREAM} textAnchor="middle" fontFamily="serif">{timeSig[0]}</text>
        <text x={LEFT + CLEF_W + keyW + 6} y={PAD_T + 3 * LINE_SP + 3} fontSize={13} fill={CREAM} textAnchor="middle" fontFamily="serif">{timeSig[1]}</text>

        {/* barlines */}
        {Array.from({ length: Math.ceil(totalBeats / timeSig[0]) + 1 }, (_, b) => {
          const beat = b * timeSig[0];
          if (beat > totalBeats) return null;
          const x = notesX + beat * pxPerBeat - 6;
          return <line key={`bar${b}`} x1={x} y1={PAD_T} x2={x} y2={PAD_T + STAFF_H} stroke={CREAM} strokeWidth={0.7} opacity={0.25} />;
        })}

        {/* notes */}
        {seated.notes.map((n) => (
          <NoteGlyph key={n.index} note={n} clef={clef} cx={notesX + n.startBeat * pxPerBeat}
            color={noteColors?.[n.index] ?? undefined} />
        ))}

        {/* playhead */}
        {playheadBeat !== null && playheadBeat >= 0 && (
          <line x1={notesX + playheadBeat * pxPerBeat} y1={PAD_T - 8} x2={notesX + playheadBeat * pxPerBeat} y2={PAD_T + STAFF_H + 8}
            stroke={GOLD} strokeWidth={1.6} opacity={0.9} />
        )}
      </svg>
    </div>
  );
}

function NoteGlyph({ note, clef, cx, color }: { note: SeatedNote; clef: Clef; cx: number; color?: string }) {
  const ink = color ?? CREAM;
  if (note.rest) return <RestGlyph dur={note.dur} cx={cx} />;

  const step = seatedStep(note, clef);
  const cy = stepY(step);
  const filled = note.dur === 'q' || note.dur === 'e';
  const isWhole = note.dur === 'w';
  const stemUp = step < 4;

  const stemX = stemUp ? cx + NOTE_RX - 1 : cx - NOTE_RX + 1;
  const stemY2 = stemUp ? cy - STEM_LEN : cy + STEM_LEN;
  const acc = note.spelled?.forceAcc;
  const accChar = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : acc === 'natural' ? '♮' : null;

  // ledger lines
  const ledgers: number[] = [];
  if (step <= -2) for (let s = -2; s >= (step % 2 === 0 ? step : step + 1); s -= 2) ledgers.push(s);
  if (step >= 10) for (let s = 10; s <= (step % 2 === 0 ? step : step - 1); s += 2) ledgers.push(s);

  return (
    <g>
      {ledgers.map((s) => (
        <line key={s} x1={cx - 9} y1={stepY(s)} x2={cx + 9} y2={stepY(s)} stroke={ink} strokeWidth={0.9} opacity={0.75} />
      ))}
      {accChar && <text x={cx - NOTE_RX - 8} y={cy + 4} fontSize={11} fill={ink} textAnchor="middle" fontFamily="serif">{accChar}</text>}
      {!isWhole && <line x1={stemX} y1={cy} x2={stemX} y2={stemY2} stroke={ink} strokeWidth={1.2} />}
      {note.dur === 'e' && (
        <path d={stemUp
          ? `M ${stemX} ${stemY2} C ${stemX + 10} ${stemY2 + 5} ${stemX + 10} ${stemY2 + 15} ${stemX + 2} ${stemY2 + 22}`
          : `M ${stemX} ${stemY2} C ${stemX + 10} ${stemY2 - 5} ${stemX + 10} ${stemY2 - 15} ${stemX + 2} ${stemY2 - 22}`}
          fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      )}
      <ellipse cx={cx} cy={cy} rx={NOTE_RX} ry={NOTE_RY} transform={`rotate(-18, ${cx}, ${cy})`}
        fill={filled ? ink : BG} stroke={ink} strokeWidth={filled ? 0.6 : 1.3} />
    </g>
  );
}

function RestGlyph({ dur, cx }: { dur: SeatedNote['dur']; cx: number }) {
  const midLine = PAD_T + 2 * LINE_SP;
  if (dur === 'w') return <rect x={cx - 5} y={PAD_T + LINE_SP - 1} width={10} height={4} fill={CREAM} opacity={0.7} />;
  if (dur === 'h') return <rect x={cx - 5} y={midLine} width={10} height={4} fill={CREAM} opacity={0.7} />;
  if (dur === 'q') return (
    <path d={`M ${cx} ${midLine - 12} C ${cx + 6} ${midLine - 8} ${cx - 4} ${midLine - 2} ${cx + 2} ${midLine + 2} C ${cx + 8} ${midLine + 6} ${cx - 2} ${midLine + 12} ${cx} ${midLine + 16}`}
      fill="none" stroke={CREAM} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
  );
  return (
    <g opacity={0.7}>
      <circle cx={cx + 1} cy={midLine} r={2.5} fill={CREAM} />
      <line x1={cx + 1} y1={midLine} x2={cx - 4} y2={midLine - 12} stroke={CREAM} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}
