// Accuracy → colour ramp for the note overlay. t = 1 (perfect) → forest green;
// t = 0 (way off) → brick red, through the requested 8-stop gradient:
// forest green · chartreuse · yellow · light orange · orange · red-orange · red · brick red.
const STOPS: [number, number, number][] = [
  [139, 26, 26],   // brick red      (worst, t=0)
  [227, 27, 27],   // red
  [255, 69, 0],    // red-orange
  [255, 140, 0],   // orange
  [255, 179, 71],  // light orange
  [255, 236, 0],   // yellow
  [127, 255, 0],   // chartreuse
  [34, 139, 34],   // forest green   (best, t=1)
];

/** CSS rgb() colour for an accuracy in [0,1]. */
export function accuracyColor(t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const pos = c * (STOPS.length - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const a = STOPS[i];
  const b = STOPS[Math.min(STOPS.length - 1, i + 1)];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r}, ${g}, ${bl})`;
}
