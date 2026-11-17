/*
 * Chart geometry, following the rules of the chart library the original
 * Admin Portal used (recharts 3), so the charts look the same.
 */

const RADIAN = Math.PI / 180;

/** Angles in degrees: 0 = 3 o'clock, counter-clockwise positive. */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
) {
  return {
    x: cx + Math.cos(-RADIAN * angle) * radius,
    y: cy + Math.sin(-RADIAN * angle) * radius,
  };
}

/** SVG path of a ring segment. */
export function sectorPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
): string {
  const delta = end - start;
  const large = +(Math.abs(delta) > 180);
  const os = polarToCartesian(cx, cy, outer, start);
  const oe = polarToCartesian(cx, cy, outer, end);
  let path = `M ${os.x},${os.y} A ${outer},${outer},0,${large},${+(start > end)},${oe.x},${oe.y}`;
  if (inner > 0) {
    const is = polarToCartesian(cx, cy, inner, start);
    const ie = polarToCartesian(cx, cy, inner, end);
    path += ` L ${ie.x},${ie.y} A ${inner},${inner},0,${large},${+(start <= end)},${is.x},${is.y} Z`;
  } else path += ` L ${cx},${cy} Z`;
  return path;
}

/** Start and end angle of each slice of a full donut with `padding` degrees between slices. */
export function pieAngles(
  values: readonly number[],
  padding: number,
): { start: number; end: number }[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  const nonZero = values.filter((v) => v !== 0).length;
  const pad = values.length <= 1 ? 0 : padding;
  const real = 360 - nonZero * pad;
  const out: { start: number; end: number }[] = [];
  let previousEnd = 0;
  values.forEach((value, i) => {
    const start = i === 0 ? 0 : previousEnd + pad * (value !== 0 ? 1 : 0);
    const end = start + (total > 0 ? value / total : 0) * real;
    out.push({ start, end });
    previousEnd = end;
  });
  return out;
}

/** Step of "nice" axis ticks for a value range (recharts' getFormatStep). */
function formatStep(rough: number, allowDecimals: boolean): number {
  if (rough <= 0) return 1;
  const digitCount = Math.floor(Math.log10(Math.abs(rough))) + 1;
  const digitValue = 10 ** digitCount;
  const ratio = rough / digitValue;
  const scale = digitCount !== 1 ? 0.05 : 0.1;
  // Rounded to 12 significant digits: the original computes in exact decimals,
  // and plain floating point would turn 0.3 into 0.30000000000000004.
  const exact = (n: number) => Number(n.toPrecision(12));
  const step = exact(Math.ceil(exact(ratio / scale)) * scale * digitValue);
  return allowDecimals ? step : Math.ceil(step);
}

/** Ticks from 0 for values up to `max` (`count` ticks, integers unless `allowDecimals`). */
export function niceTicks(
  max: number,
  count = 5,
  allowDecimals = false,
): number[] {
  const step = max <= 0 ? 1 : formatStep(max / (count - 1), allowDecimals);
  return Array.from({ length: count }, (_, i) => i * step);
}

/** Path of a bar with rounded top corners. */
export function topRoundedBar(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + r}A ${r},${r},0,0,1,${x + r},${y}L ${x + width - r},${y}A ${r},${r},0,0,1,${x + width},${y + r}L ${x + width},${y + height}L ${x},${y + height}Z`;
}
