import type { RhythmShape, RhythmValue } from '../../lib/minigames/rhythmSudoku';

// Standalone rhythm notation, drawn off a staff. Every note keeps its head on
// the same baseline with the stem up, the way a method-book rhythm chart lays
// them out, so a whole note and an eighth read as the same family at a glance.
//
// All coordinates live in one 30×40 viewBox; the SVG scales to whatever `size`
// the caller asks for.

const HEAD_CX = 11;
const HEAD_CY = 29;
const RX = 6.0;
const RY = 4.2;
const STEM_X = HEAD_CX + RX - 0.7;   // stem rides the right edge of the head
const STEM_TOP = 5;
const DOT_X = HEAD_CX + RX + 4.5;
const DOT_R = 1.8;

/** One flag hanging off a stem-up note, starting at `y` on the stem. */
function flagPath(y: number, len: number): string {
  return `M ${STEM_X} ${y} C ${STEM_X + 9} ${y + 4} ${STEM_X + 9} ${y + 12} ${STEM_X + 1.5} ${y + len}`;
}

// Ink extents per shape, measured off the rendered SVG (stroke width included).
// Used to optically centre a glyph inside a square cell — without this a whole
// note sits on the baseline and reads low next to a stemmed note.
const INK: Record<RhythmShape, { x0: number; y0: number; x1: number; y1: number }> = {
  whole:        { x0: 4.05, y0: 23.65, x1: 19.95, y1: 34.35 },
  half:         { x0: 4.15, y0: 4.15,  x1: 17.85, y1: 34.05 },
  quarter:      { x0: 4.60, y0: 4.15,  x1: 17.40, y1: 33.60 },
  eighth:       { x0: 4.60, y0: 4.00,  x1: 24.25, y1: 33.60 },
  sixteenth:    { x0: 4.60, y0: 4.00,  x1: 24.25, y1: 33.60 },
  rest_quarter: { x0: 10.55, y0: 6.65, x1: 17.49, y1: 39.75 },
  rest_eighth:  { x0: 7.80, y0: 10.73, x1: 18.30, y1: 34.60 },
};

/** Translation that moves a glyph's ink to the middle of the viewBox. */
function centringShift(value: RhythmValue): string {
  const ink = INK[value.shape];
  const x1 = value.dotted ? Math.max(ink.x1, DOT_X + DOT_R) : ink.x1;
  return `translate(${(15 - (ink.x0 + x1) / 2).toFixed(2)}, ${(20 - (ink.y0 + ink.y1) / 2).toFixed(2)})`;
}

interface Props {
  value: RhythmValue;
  /** Rendered width in px; height follows the 30:40 viewBox ratio. */
  size?: number;
  /** Ink colour. */
  color?: string;
  /** Fill used inside hollow noteheads — should match the tile background. */
  hollowFill?: string;
  /** Extra opacity for dimmed states (used-up palette entries). */
  opacity?: number;
  /**
   * Optically centre the ink in the viewBox — right for a square grid cell.
   * Left off, notes share a baseline, which is what a legend or palette wants.
   */
  centered?: boolean;
}

export default function RhythmGlyph({
  value, size = 34, color = '#F5ECD7', hollowFill = '#0d1520', opacity = 1, centered = false,
}: Props) {
  return (
    <svg
      width={size}
      height={(size * 40) / 30}
      viewBox="0 0 30 40"
      role="img"
      aria-label={value.name}
      style={{ display: 'block', opacity, overflow: 'visible' }}
    >
      <title>{value.name}</title>
      <g transform={centered ? centringShift(value) : undefined}>
        <Shape value={value} color={color} hollowFill={hollowFill} />
        {value.dotted && <circle cx={DOT_X} cy={HEAD_CY} r={DOT_R} fill={color} />}
      </g>
    </svg>
  );
}

function Shape({ value, color, hollowFill }: { value: RhythmValue; color: string; hollowFill: string }) {
  switch (value.shape) {
    case 'whole':
      // No stem, and a wider un-slanted head — the whole note's own silhouette.
      return (
        <ellipse
          cx={HEAD_CX + 1} cy={HEAD_CY} rx={7.0} ry={4.4}
          fill={hollowFill} stroke={color} strokeWidth={1.9}
        />
      );

    case 'half':
      return (
        <g>
          <line x1={STEM_X} y1={HEAD_CY} x2={STEM_X} y2={STEM_TOP} stroke={color} strokeWidth={1.7} />
          <Head color={color} fill={hollowFill} strokeWidth={1.7} />
        </g>
      );

    case 'quarter':
      return (
        <g>
          <line x1={STEM_X} y1={HEAD_CY} x2={STEM_X} y2={STEM_TOP} stroke={color} strokeWidth={1.7} />
          <Head color={color} fill={color} strokeWidth={0.8} />
        </g>
      );

    case 'eighth':
      return (
        <g>
          <line x1={STEM_X} y1={HEAD_CY} x2={STEM_X} y2={STEM_TOP} stroke={color} strokeWidth={1.7} />
          <path d={flagPath(STEM_TOP, 18)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Head color={color} fill={color} strokeWidth={0.8} />
        </g>
      );

    case 'sixteenth':
      return (
        <g>
          <line x1={STEM_X} y1={HEAD_CY} x2={STEM_X} y2={STEM_TOP} stroke={color} strokeWidth={1.7} />
          <path d={flagPath(STEM_TOP, 14)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <path d={flagPath(STEM_TOP + 6.5, 14)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Head color={color} fill={color} strokeWidth={0.8} />
        </g>
      );

    case 'rest_quarter':
      // The zigzag squiggle, matching the shape used on the performance staff.
      return (
        <path
          d="M 12 7.8 C 18.6 12.2 7.6 18.8 14.2 23.2 C 20.8 27.6 9.8 34.2 12 38.6"
          fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round"
        />
      );

    case 'rest_eighth':
      // "Like the number seven": stem slanting down-left from the top right,
      // with a curved hook ending in a blob on the left.
      return (
        <g>
          <path
            d="M 11 14.5 Q 15 10.4 17.2 12.6 L 9.5 33.5"
            fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx={11} cy={14.5} r={3.2} fill={color} />
        </g>
      );
  }
}

function Head({ color, fill, strokeWidth }: { color: string; fill: string; strokeWidth: number }) {
  return (
    <ellipse
      cx={HEAD_CX} cy={HEAD_CY} rx={RX} ry={RY}
      transform={`rotate(-18, ${HEAD_CX}, ${HEAD_CY})`}
      fill={fill} stroke={color} strokeWidth={strokeWidth}
    />
  );
}
