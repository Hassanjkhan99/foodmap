/** Circular-angle utilities. All angles in degrees. */

/** Normalize any angle into [0, 360). */
export function normalizeDeg(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/**
 * Smallest signed difference a - b, in (-180, 180].
 * Positive means `a` is clockwise from `b`.
 */
export function angularDifferenceDeg(a: number, b: number): number {
  let d = normalizeDeg(a) - normalizeDeg(b);
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Absolute smallest separation between two bearings, in [0, 180]. */
export function angularSeparationDeg(a: number, b: number): number {
  return Math.abs(angularDifferenceDeg(a, b));
}

const DEG = Math.PI / 180;

/**
 * Circular mean of bearings weighted by `weights` (default equal).
 * Correctly handles the 359°/1° wrap. Returns null if the vector sum is ~0
 * (directions cancel out, so no meaningful mean exists).
 */
export function circularMeanDeg(
  bearings: readonly number[],
  weights?: readonly number[],
): number | null {
  let x = 0;
  let y = 0;
  for (let i = 0; i < bearings.length; i++) {
    const w = weights?.[i] ?? 1;
    const b = bearings[i]! * DEG;
    x += Math.cos(b) * w;
    y += Math.sin(b) * w;
  }
  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) return null;
  return normalizeDeg(Math.atan2(y, x) / DEG);
}

/**
 * Resultant length R in [0,1] of the weighted unit vectors — a concentration
 * measure. R near 1 = tightly clustered bearings; near 0 = spread out.
 */
export function circularConcentration(
  bearings: readonly number[],
  weights?: readonly number[],
): number {
  let x = 0;
  let y = 0;
  let wsum = 0;
  for (let i = 0; i < bearings.length; i++) {
    const w = weights?.[i] ?? 1;
    const b = bearings[i]! * DEG;
    x += Math.cos(b) * w;
    y += Math.sin(b) * w;
    wsum += w;
  }
  if (wsum === 0) return 0;
  return Math.hypot(x, y) / wsum;
}
