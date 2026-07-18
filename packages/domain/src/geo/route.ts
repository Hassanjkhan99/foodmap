import type { GeoPoint } from "../types.js";
import { haversineM } from "./distance.js";

/**
 * Route geometry — framework-free. Uses a local equirectangular projection
 * (metres relative to a reference point) which is accurate for the short
 * segment lengths involved in road routing.
 */

const DEG = Math.PI / 180;
const EARTH_R = 6_371_008.8;

interface XY {
  readonly x: number;
  readonly y: number;
}

function toXY(p: GeoPoint, ref: GeoPoint): XY {
  return {
    x: (p.lng - ref.lng) * DEG * Math.cos(ref.lat * DEG) * EARTH_R,
    y: (p.lat - ref.lat) * DEG * EARTH_R,
  };
}

export interface RoutePolyline {
  readonly points: readonly GeoPoint[];
  /** cumulative distance from start to each vertex, metres */
  readonly cumulativeM: readonly number[];
  readonly lengthM: number;
}

/** Build a route with precomputed cumulative distances. Requires >= 2 points. */
export function buildRoute(points: readonly GeoPoint[]): RoutePolyline {
  if (points.length < 2) throw new Error("buildRoute: need at least 2 points");
  const cumulative: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1]! + haversineM(points[i - 1]!, points[i]!));
  }
  return { points, cumulativeM: cumulative, lengthM: cumulative[cumulative.length - 1]! };
}

export interface RouteProjection {
  /** distance from route start to the projected point, metres */
  readonly alongM: number;
  /** perpendicular distance from the point to the route, metres */
  readonly lateralM: number;
  /** the projected point on the route */
  readonly snapped: GeoPoint;
  /** index of the segment start vertex */
  readonly segmentIndex: number;
}

/** Project a point onto the route, returning along/lateral distances. */
export function projectOntoRoute(route: RoutePolyline, p: GeoPoint): RouteProjection {
  const ref = p;
  const pxy = { x: 0, y: 0 };
  let best: RouteProjection | null = null;

  for (let i = 0; i < route.points.length - 1; i++) {
    const a = toXY(route.points[i]!, ref);
    const b = toXY(route.points[i + 1]!, ref);
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const segLen2 = abx * abx + aby * aby;
    let t = segLen2 === 0 ? 0 : ((pxy.x - a.x) * abx + (pxy.y - a.y) * aby) / segLen2;
    t = Math.max(0, Math.min(1, t));
    const projx = a.x + t * abx;
    const projy = a.y + t * aby;
    const lateralM = Math.hypot(pxy.x - projx, pxy.y - projy);
    if (best === null || lateralM < best.lateralM) {
      const segStart = route.cumulativeM[i]!;
      const segFull = route.cumulativeM[i + 1]! - segStart;
      const alongM = segStart + t * segFull;
      const snapped: GeoPoint = {
        lat: route.points[i]!.lat + t * (route.points[i + 1]!.lat - route.points[i]!.lat),
        lng: route.points[i]!.lng + t * (route.points[i + 1]!.lng - route.points[i]!.lng),
      };
      best = { alongM, lateralM, snapped, segmentIndex: i };
    }
  }
  return best!;
}

/** Remaining route from a given along-distance to the end. */
export function remainingRoute(route: RoutePolyline, fromAlongM: number): RoutePolyline {
  const from = Math.max(0, Math.min(route.lengthM, fromAlongM));
  const pts: GeoPoint[] = [];
  for (let i = 0; i < route.points.length; i++) {
    if (route.cumulativeM[i]! >= from) pts.push(route.points[i]!);
  }
  // Ensure the remaining route starts exactly at the projected position.
  const head = interpolateAt(route, from);
  if (pts.length === 0 || route.cumulativeM.find((c) => c >= from) !== from) {
    pts.unshift(head);
  }
  if (pts.length < 2) pts.push(route.points[route.points.length - 1]!);
  return buildRoute(pts);
}

/** Point on the route at a given along-distance. */
export function interpolateAt(route: RoutePolyline, alongM: number): GeoPoint {
  const d = Math.max(0, Math.min(route.lengthM, alongM));
  for (let i = 0; i < route.points.length - 1; i++) {
    const a = route.cumulativeM[i]!;
    const b = route.cumulativeM[i + 1]!;
    if (d <= b) {
      const t = b === a ? 0 : (d - a) / (b - a);
      return {
        lat: route.points[i]!.lat + t * (route.points[i + 1]!.lat - route.points[i]!.lat),
        lng: route.points[i]!.lng + t * (route.points[i + 1]!.lng - route.points[i]!.lng),
      };
    }
  }
  return route.points[route.points.length - 1]!;
}
