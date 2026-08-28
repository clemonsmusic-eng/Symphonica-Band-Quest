import { memo } from 'react';
import type { RefObject } from 'react';
import { keySigSteps, type Clef } from '../../lib/music/staff';
import type { NoteState, RushChart, RushNote, RushRest } from '../../lib/music/noteRush';
import { JUDGMENT_COLOR, LANE_COLORS } from '../../lib/music/noteRush';
import type { Duration } from '../../types/diagrams';

// The scrolling half of Note Rush. Everything that moves lives in one <g> whose
// transform the game loop writes directly (no re-render per frame); React only
// redraws when a note is judged, which happens a few times a second at most.

const BG = '#0b1119';
const CREAM = '#d4c9a8';
const GOLD = '#D4A017';

const LINE_SP = 14;
const STAFF_H = 4 * LINE_SP;
const PAD_T = 66;                          // headroom for ledger lines above
export const RUSH_SVG_H = PAD_T + STAFF_H + 62;
const NOTE_RX = 7;
const NOTE_RY = 5;
const STEM_LEN = 34;
const TAIL_H = 9;

/** Left edge of the scrolling area for a given key signature. */
export function panelWidth(keyCount: number): number {
  return 44 + keyCount * 11 + 28;
}
/** X of the strike line — where a note must be when you press its letter. */
export function strikeX(keyCount: number): number {
  return panelWidth(keyCount) + 40;
}

function stepY(step: number): number {
  return PAD_T + STAFF_H - step * (LINE_SP / 2);
}

interface Props {
  chart: RushChart;
  clef: Clef;
  writtenKeySig: number;
  timeSig: [number, number];
  width: number;
  pxPerBeat: number;
  /** Judgment state per chart note, by position in `chart.notes`. */
  states: NoteState[];
  /** Half-width of the timing window, in px — drawn as the strike band. */
  windowPx: number;
  showLetters: boolean;
  surgeActive: boolean;
  /** The game loop sets this group's transform each frame. */
  scrollRef: RefObject<SVGGElement>;
}

function NoteRushStaff({
  chart, clef, writtenKeySig, timeSig, width, pxPerBeat, states, windowPx,
  showLetters, surgeActive, scrollRef,
}: Props) {
  const keyCount = Math.abs(writtenKeySig);
  const isSharp = writtenKeySig > 0;
  const panelW = panelWidth(keyCount);
  const strike = strikeX(keyCount);
  const keySteps = keySigSteps(clef, writtenKeySig);
  const bars = Math.ceil(chart.endBeat / timeSig[0]) + 1;
  const beatBand = Math.max(6, windowPx);

  return (
    <svg width={width} height={RUSH_SVG_H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="nr-fade-right" x1="0" x2="1">
          <stop offset="0%" stopColor={BG} stopOpacity={0} />
          <stop offset="100%" stopColor={BG} stopOpacity={1} />
        </linearGradient>
        <linearGradient id="nr-fade-left" x1="0" x2="1">
          <stop offset="0%" stopColor={BG} stopOpacity={1} />
          <stop offset="100%" stopColor={BG} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="nr-strike" x1="0" x2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity={0} />
          <stop offset="50%" stopColor={GOLD} stopOpacity={0.28} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={RUSH_SVG_H} fill={BG} />

      {/* staff */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={0} y1={PAD_T + i * LINE_SP} x2={width} y2={PAD_T + i * LINE_SP}
          stroke={CREAM} strokeWidth={1} opacity={0.55} />
      ))}

      {/* strike zone — its width is the real timing window, so you can see your slack */}
      <rect x={strike - beatBand} y={PAD_T - 26} width={beatBand * 2} height={STAFF_H + 52}
        fill="url(#nr-strike)" opacity={surgeActive ? 1 : 0.75} />
      <line x1={strike} y1={PAD_T - 26} x2={strike} y2={PAD_T + STAFF_H + 26}
        stroke={surgeActive ? '#FFF3C4' : GOLD} strokeWidth={surgeActive ? 3.5 : 2.5} opacity={0.95} />
      <polygon points={`${strike - 6},${PAD_T - 30} ${strike + 6},${PAD_T - 30} ${strike},${PAD_T - 21}`}
        fill={surgeActive ? '#FFF3C4' : GOLD} opacity={0.95} />

      {/* everything below scrolls right → left */}
      <g ref={scrollRef}>
        {Array.from({ length: bars }, (_, b) => {
          const beat = b * timeSig[0];
          if (beat > chart.endBeat) return null;
          return (
            <line key={`bar${b}`} x1={strike + beat * pxPerBeat - 10} y1={PAD_T}
              x2={strike + beat * pxPerBeat - 10} y2={PAD_T + STAFF_H}
              stroke={CREAM} strokeWidth={1} opacity={0.3} />
          );
        })}

        {/* end-of-chart double bar */}
        <line x1={strike + chart.endBeat * pxPerBeat - 4} y1={PAD_T}
          x2={strike + chart.endBeat * pxPerBeat - 4} y2={PAD_T + STAFF_H}
          stroke={CREAM} strokeWidth={1} opacity={0.4} />
        <line x1={strike + chart.endBeat * pxPerBeat} y1={PAD_T}
          x2={strike + chart.endBeat * pxPerBeat} y2={PAD_T + STAFF_H}
          stroke={CREAM} strokeWidth={2.5} opacity={0.5} />

        {chart.rests.map((r, i) => (
          <RestGlyph key={`rest${i}`} rest={r} cx={strike + r.beat * pxPerBeat} />
        ))}

        {chart.notes.map((n, i) => (
          <NoteGlyph key={n.id} note={n} state={states[i]} cx={strike + n.beat * pxPerBeat}
            pxPerBeat={pxPerBeat} showLetter={showLetters} />
        ))}
      </g>

      {/* notes fade in at the right edge and vanish behind the clef panel */}
      <rect x={width - 60} y={0} width={60} height={RUSH_SVG_H} fill="url(#nr-fade-right)" />
      <rect x={panelW} y={0} width={34} height={RUSH_SVG_H} fill="url(#nr-fade-left)" />
      <rect x={0} y={0} width={panelW} height={RUSH_SVG_H} fill={BG} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`p${i}`} x1={0} y1={PAD_T + i * LINE_SP} x2={panelW} y2={PAD_T + i * LINE_SP}
          stroke={CREAM} strokeWidth={1} opacity={0.55} />
      ))}

      {clef === 'treble' ? (
        <text x={4} y={PAD_T + STAFF_H + 9} fontSize={68} fill={CREAM} fontFamily="serif" opacity={0.9}>𝄞</text>
      ) : (
        <text x={4} y={PAD_T + LINE_SP + 7} fontSize={38} fill={CREAM} fontFamily="serif" opacity={0.9}>𝄢</text>
      )}
      {keySteps.map((step, i) => (
        <text key={i} x={42 + i * 11} y={stepY(step) + 6} fontSize={18} fill={CREAM}
          fontFamily="serif" opacity={0.9}>{isSharp ? '♯' : '♭'}</text>
      ))}
      <text x={panelW - 14} y={PAD_T + LINE_SP + 5} fontSize={17} fill={CREAM} textAnchor="middle" fontFamily="serif">{timeSig[0]}</text>
      <text x={panelW - 14} y={PAD_T + 3 * LINE_SP + 5} fontSize={17} fill={CREAM} textAnchor="middle" fontFamily="serif">{timeSig[1]}</text>
    </svg>
  );
}

export default memo(NoteRushStaff);

function NoteGlyph({ note, state, cx, pxPerBeat, showLetter }: {
  note: RushNote; state: NoteState | undefined; cx: number; pxPerBeat: number; showLetter: boolean;
}) {
  const judged = state?.judgment ?? null;
  const laneColor = LANE_COLORS[note.lane];
  const ink = judged ? JUDGMENT_COLOR[judged] : laneColor;
  const opacity = judged === 'miss' ? 0.3 : judged ? 0.55 : 1;
  const cy = stepY(note.step);
  const hollow = note.dur === 'h' || note.dur === 'w';
  const stemUp = note.step < 4;
  const stemX = stemUp ? cx + NOTE_RX - 1 : cx - NOTE_RX + 1;
  const stemY2 = stemUp ? cy - STEM_LEN : cy + STEM_LEN;
  const accChar = note.accidental === 'sharp' ? '♯'
    : note.accidental === 'flat' ? '♭' : note.accidental === 'natural' ? '♮' : null;

  // ledger lines, every other step outside the staff
  const ledgers: number[] = [];
  if (note.step <= -2) for (let s = -2; s >= (note.step % 2 === 0 ? note.step : note.step + 1); s -= 2) ledgers.push(s);
  if (note.step >= 10) for (let s = 10; s <= (note.step % 2 === 0 ? note.step : note.step - 1); s += 2) ledgers.push(s);

  return (
    <g opacity={opacity}>
      {note.sustainBeats > 0 && (
        <rect x={cx} y={cy - TAIL_H / 2} width={note.sustainBeats * pxPerBeat} height={TAIL_H} rx={TAIL_H / 2}
          fill={ink} opacity={state?.sustainDone ? 0.7 : 0.3} />
      )}
      {ledgers.map((s) => (
        <line key={s} x1={cx - 12} y1={stepY(s)} x2={cx + 12} y2={stepY(s)} stroke={CREAM} strokeWidth={1.2} opacity={0.7} />
      ))}
      {accChar && (
        <text x={cx - NOTE_RX - 9} y={cy + 6} fontSize={16} fill={ink} textAnchor="middle" fontFamily="serif">{accChar}</text>
      )}
      <line x1={stemX} y1={cy} x2={stemX} y2={stemY2} stroke={ink} strokeWidth={1.6} opacity={note.dur === 'w' ? 0 : 1} />
      {note.dur === 'e' && (
        <path d={stemUp
          ? `M ${stemX} ${stemY2} C ${stemX + 11} ${stemY2 + 6} ${stemX + 11} ${stemY2 + 17} ${stemX + 2} ${stemY2 + 24}`
          : `M ${stemX} ${stemY2} C ${stemX + 11} ${stemY2 - 6} ${stemX + 11} ${stemY2 - 17} ${stemX + 2} ${stemY2 - 24}`}
          fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
      )}
      <ellipse cx={cx} cy={cy} rx={NOTE_RX} ry={NOTE_RY} transform={`rotate(-18, ${cx}, ${cy})`}
        fill={hollow ? BG : ink} stroke={ink} strokeWidth={hollow ? 2.4 : 1.4} />
      {judged && judged !== 'miss' && (
        <circle cx={cx} cy={cy} r={NOTE_RX + 5} fill="none" stroke={ink} strokeWidth={1.2} opacity={0.7} />
      )}
      {showLetter && (
        <text x={cx} y={stemUp ? cy + 20 : cy - 14} fontSize={11} fill={ink} textAnchor="middle"
          fontFamily="monospace" opacity={0.85}>{note.letter}</text>
      )}
    </g>
  );
}

function RestGlyph({ rest, cx }: { rest: RushRest; cx: number }) {
  const midLine = PAD_T + 2 * LINE_SP;
  const dur: Duration = rest.dur;
  if (dur === 'w') return <rect x={cx - 7} y={PAD_T + LINE_SP - 2} width={14} height={5} fill={CREAM} opacity={0.6} />;
  if (dur === 'h') return <rect x={cx - 7} y={midLine} width={14} height={5} fill={CREAM} opacity={0.6} />;
  if (dur === 'q') return (
    <path d={`M ${cx} ${midLine - 15} C ${cx + 8} ${midLine - 10} ${cx - 5} ${midLine - 3} ${cx + 3} ${midLine + 2} C ${cx + 10} ${midLine + 8} ${cx - 3} ${midLine + 15} ${cx} ${midLine + 20}`}
      fill="none" stroke={CREAM} strokeWidth={1.9} strokeLinecap="round" opacity={0.6} />
  );
  return (
    <g opacity={0.6}>
      <circle cx={cx + 1} cy={midLine} r={3} fill={CREAM} />
      <line x1={cx + 1} y1={midLine} x2={cx - 5} y2={midLine - 15} stroke={CREAM} strokeWidth={1.9} strokeLinecap="round" />
    </g>
  );
}
