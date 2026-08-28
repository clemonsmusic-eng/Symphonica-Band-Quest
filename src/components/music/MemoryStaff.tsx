import type { Pad } from '../../lib/music/memoryGame';
import type { Clef } from '../../lib/music/staff';

// The Echo Chamber's playfield: a single staff whose noteheads are the game's
// buttons. Ink and geometry follow PerformanceStaff so the game reads as the
// same notation the rest of the app uses — just larger, and touchable.

const BG = '#0d1520';
const CREAM = '#d4c9a8';
const GOLD = '#D4A017';
const GREEN = '#4ADE80';
const RED = '#F87171';

const LINE_SP = 14;
const PAD_T = 58;                    // room above for ledger lines and stems
const STAFF_H = 4 * LINE_SP;
const BOTTOM_NAMED = 74;             // room below for letter names + key hints
const BOTTOM_PLAIN = 50;             // …just the key hints
const NOTE_RX = 8;
const NOTE_RY = 5.4;
const STEM_LEN = 40;
const COL_W = 62;
const LEFT = 10;
const CLEF_W = 38;
// How far the staff may scale up to fill its panel before it just centres.
const MAX_SCALE = 1.5;

// Clef baselines, tuned at this size so the glyph's defining feature lands on
// its own line: the G-clef's spiral on the G line, the F-clef's dots astride
// the F line. (The app's smaller staves carry a slightly different offset,
// where half a line space reads as a rounding difference rather than an error.)
const TREBLE_CLEF_Y = PAD_T + STAFF_H + 3;
const BASS_CLEF_Y = PAD_T + LINE_SP + 13;

// Key-signature accidental step positions (shared with PerformanceStaff).
const TREBLE_SHARP_STEPS = [8, 5, 9, 6, 3, 7, 4];
const TREBLE_FLAT_STEPS = [4, 7, 3, 6, 2, 5, 1];
const BASS_SHARP_STEPS = [6, 3, 7, 4, 1, 5, 2];
const BASS_FLAT_STEPS = [2, 5, 1, 4, 0, 3, -1];

/** How a pad is currently lit. */
export type PadTone = 'echo' | 'input' | 'wrong';

const TONE_COLOR: Record<PadTone, string> = { echo: GOLD, input: GREEN, wrong: RED };

function stepY(step: number): number {
  return PAD_T + STAFF_H - step * (LINE_SP / 2);
}

interface Props {
  pads: Pad[];
  clef: Clef;
  writtenKeySig: number;
  showNames: boolean;
  /** Pad currently lit, and why. */
  lit: { pad: number; tone: PadTone } | null;
  /** Dim the staff and ignore presses (during the Chamber's turn). */
  disabled: boolean;
  onPress: (padId: number) => void;
}

export default function MemoryStaff({
  pads, clef, writtenKeySig, showNames, lit, disabled, onPress,
}: Props) {
  const keyCount = Math.abs(writtenKeySig);
  const isSharp = writtenKeySig > 0;
  const keyW = keyCount * 11 + (keyCount ? 10 : 0);
  const padsX = LEFT + CLEF_W + keyW + 16;
  const width = padsX + pads.length * COL_W + 12;
  const svgH = PAD_T + STAFF_H + (showNames ? BOTTOM_NAMED : BOTTOM_PLAIN);

  const keySteps = isSharp
    ? clef === 'treble' ? TREBLE_SHARP_STEPS : BASS_SHARP_STEPS
    : clef === 'treble' ? TREBLE_FLAT_STEPS : BASS_FLAT_STEPS;

  return (
    <div className="rounded-lg select-none" style={{ background: BG, border: '1px solid rgba(212,160,23,0.2)' }}>
      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          // Always fit the panel — every pad has to be reachable without
          // scrolling — growing only to a readable ceiling before it centres.
          width: '100%', maxWidth: width * MAX_SCALE, margin: '0 auto',
          aspectRatio: `${width} / ${svgH}`,
          opacity: disabled ? 0.82 : 1, transition: 'opacity 200ms',
        }}
      >
        {/* staff lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={LEFT} y1={PAD_T + i * LINE_SP} x2={width - 10} y2={PAD_T + i * LINE_SP}
            stroke={CREAM} strokeWidth={0.9} opacity={0.65} />
        ))}

        {/* clef */}
        {clef === 'treble' ? (
          <text x={LEFT + 2} y={TREBLE_CLEF_Y} fontSize={68} fill={CREAM} fontFamily="serif" opacity={0.9}>𝄞</text>
        ) : (
          <text x={LEFT + 2} y={BASS_CLEF_Y} fontSize={38} fill={CREAM} fontFamily="serif" opacity={0.9}>𝄢</text>
        )}

        {/* key signature */}
        {Array.from({ length: keyCount }, (_, i) => (
          <text key={i} x={LEFT + CLEF_W + i * 11} y={stepY(keySteps[i] ?? 4) + 6}
            fontSize={18} fill={CREAM} fontFamily="serif" opacity={0.9}>{isSharp ? '♯' : '♭'}</text>
        ))}

        {pads.map((pad) => (
          <PadColumn
            key={pad.id}
            pad={pad}
            cx={padsX + pad.id * COL_W + COL_W / 2}
            svgH={svgH}
            tone={lit?.pad === pad.id ? lit.tone : null}
            showName={showNames}
            disabled={disabled}
            onPress={onPress}
          />
        ))}
      </svg>
    </div>
  );
}

function PadColumn({ pad, cx, svgH, tone, showName, disabled, onPress }: {
  pad: Pad;
  cx: number;
  svgH: number;
  tone: PadTone | null;
  showName: boolean;
  disabled: boolean;
  onPress: (padId: number) => void;
}) {
  const ink = tone ? TONE_COLOR[tone] : CREAM;
  const cy = stepY(pad.step);
  const acc = pad.spelled.forceAcc;
  const accChar = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : acc === 'natural' ? '♮' : null;
  const stemUp = pad.step < 4;
  const stemX = stemUp ? cx + NOTE_RX - 1 : cx - NOTE_RX + 1;

  // Ledger lines out to the notehead, every other step beyond the staff.
  const ledgers: number[] = [];
  if (pad.step <= -2) for (let s = -2; s >= (pad.step % 2 === 0 ? pad.step : pad.step + 1); s -= 2) ledgers.push(s);
  if (pad.step >= 10) for (let s = 10; s <= (pad.step % 2 === 0 ? pad.step : pad.step - 1); s += 2) ledgers.push(s);

  return (
    <g
      onPointerDown={(e) => { e.preventDefault(); if (!disabled) onPress(pad.id); }}
      style={{ cursor: disabled ? 'default' : 'pointer' }}
      className={`echo-pad${disabled ? ' echo-pad-locked' : ''}${tone ? ' echo-pad-lit' : ''}`}
      role="button"
      aria-label={`${pad.name}, scale degree ${pad.degree}`}
    >
      {/* hit target + hover/lit column wash */}
      <rect
        className="echo-pad-wash"
        x={cx - COL_W / 2 + 3} y={8} width={COL_W - 6} height={svgH - 16} rx={8}
        fill={tone ? TONE_COLOR[tone] : '#ffffff'}
        opacity={tone ? 0.12 : 0}
      />

      {/* glow behind a lit notehead */}
      {tone && (
        <>
          <circle cx={cx} cy={cy} r={20} fill={TONE_COLOR[tone]} opacity={0.18} />
          <circle cx={cx} cy={cy} r={12} fill={TONE_COLOR[tone]} opacity={0.3} />
        </>
      )}

      {ledgers.map((s) => (
        <line key={s} x1={cx - 14} y1={stepY(s)} x2={cx + 14} y2={stepY(s)}
          stroke={ink} strokeWidth={1.1} opacity={0.75} />
      ))}

      {accChar && (
        <text x={cx - NOTE_RX - 10} y={cy + 6} fontSize={17} fill={ink} textAnchor="middle" fontFamily="serif">
          {accChar}
        </text>
      )}

      {/* quarter note */}
      <line x1={stemX} y1={cy} x2={stemX} y2={stemUp ? cy - STEM_LEN : cy + STEM_LEN} stroke={ink} strokeWidth={1.6} />
      <ellipse cx={cx} cy={cy} rx={NOTE_RX} ry={NOTE_RY} transform={`rotate(-18, ${cx}, ${cy})`}
        fill={ink} stroke={ink} strokeWidth={0.8} />

      {/* letter name (easier difficulties) and the keyboard shortcut */}
      {showName && (
        <text x={cx} y={svgH - 30} fontSize={15} fill={ink} textAnchor="middle" fontFamily="serif" opacity={0.9}>
          {pad.name}
        </text>
      )}
      <text x={cx} y={svgH - 11} fontSize={10} fill={CREAM} textAnchor="middle" opacity={0.3}>
        {pad.id + 1}
      </text>
    </g>
  );
}
