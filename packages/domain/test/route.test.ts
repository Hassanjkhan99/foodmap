import { describe, it, expect } from "vitest";
import {
  buildRoute,
  destinationPoint,
  interpolateAt,
  projectOntoRoute,
  remainingRoute,
} from "../src/index.js";

const A = { lat: 24.8, lng: 67.0 };

describe("route geometry", () => {
  // A straight eastbound route of ~4 km built from a start point.
  const p0 = A;
  const p1 = destinationPoint(A, 90, 2000);
  const p2 = destinationPoint(A, 90, 4000);
  const route = buildRoute([p0, p1, p2]);

  it("computes route length", () => {
    expect(route.lengthM).toBeCloseTo(4000, -1);
  });

  it("projects a point near the middle to ~2km along, small lateral", () => {
    const nearMid = destinationPoint(p1, 0, 30); // 30 m north of the midpoint
    const proj = projectOntoRoute(route, nearMid);
    expect(proj.alongM).toBeCloseTo(2000, -2);
    expect(proj.lateralM).toBeGreaterThan(20);
    expect(proj.lateralM).toBeLessThan(40);
  });

  it("remaining route shrinks as you progress", () => {
    const rem = remainingRoute(route, 1500);
    expect(rem.lengthM).toBeCloseTo(2500, -2);
  });

  it("interpolates a point at a given along-distance", () => {
    const mid = interpolateAt(route, 2000);
    expect(mid.lat).toBeCloseTo(p1.lat, 4);
    expect(mid.lng).toBeCloseTo(p1.lng, 4);
  });

  it("tolerates a bounded GPS regression (small backward jump)", () => {
    const forward = projectOntoRoute(route, destinationPoint(A, 90, 2100));
    const jittered = projectOntoRoute(route, destinationPoint(A, 90, 2050));
    // both project near 2.05-2.1 km; regression is small and bounded
    expect(Math.abs(forward.alongM - jittered.alongM)).toBeLessThan(120);
  });
});
