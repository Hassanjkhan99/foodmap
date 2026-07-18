import { describe, it, expect } from "vitest";
import {
  angularDifferenceDeg,
  angularSeparationDeg,
  bearingDeg,
  circularMeanDeg,
  decodePolyline,
  destinationPoint,
  encodePolyline,
  haversineM,
  normalizeDeg,
} from "../src/index.js";

describe("angles", () => {
  it("normalizes into [0,360)", () => {
    expect(normalizeDeg(-10)).toBeCloseTo(350);
    expect(normalizeDeg(370)).toBeCloseTo(10);
    expect(normalizeDeg(360)).toBeCloseTo(0);
  });

  it("computes smallest signed difference across the wrap", () => {
    expect(angularDifferenceDeg(1, 359)).toBeCloseTo(2);
    expect(angularDifferenceDeg(359, 1)).toBeCloseTo(-2);
    expect(angularSeparationDeg(350, 10)).toBeCloseTo(20);
  });

  it("circular mean handles the 359/1 wrap", () => {
    const mean = circularMeanDeg([359, 1, 0]);
    expect(mean).not.toBeNull();
    expect(angularSeparationDeg(mean!, 0)).toBeLessThan(1);
  });

  it("returns null circular mean when directions cancel", () => {
    expect(circularMeanDeg([0, 180])).toBeNull();
  });
});

describe("distance & bearing", () => {
  it("haversine ~ known short distance", () => {
    const d = haversineM({ lat: 24.86, lng: 67.0 }, { lat: 24.87, lng: 67.0 });
    expect(d).toBeGreaterThan(1050);
    expect(d).toBeLessThan(1150);
  });

  it("bearing north is ~0 and east ~90", () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0, 0);
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90, 0);
  });

  it("destinationPoint round-trips with distance/bearing", () => {
    const origin = { lat: 24.86, lng: 67.0 };
    const dest = destinationPoint(origin, 90, 500);
    expect(haversineM(origin, dest)).toBeCloseTo(500, -1);
    expect(bearingDeg(origin, dest)).toBeCloseTo(90, 0);
  });
});

describe("polyline", () => {
  it("decodes the canonical Google example", () => {
    const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(pts).toHaveLength(3);
    expect(pts[0]!.lat).toBeCloseTo(38.5, 5);
    expect(pts[0]!.lng).toBeCloseTo(-120.2, 5);
    expect(pts[2]!.lat).toBeCloseTo(43.252, 3);
  });

  it("encode/decode round-trips", () => {
    const pts = [
      { lat: 24.86, lng: 67.0 },
      { lat: 24.87, lng: 67.01 },
      { lat: 24.88, lng: 67.02 },
    ];
    const round = decodePolyline(encodePolyline(pts));
    for (let i = 0; i < pts.length; i++) {
      expect(round[i]!.lat).toBeCloseTo(pts[i]!.lat, 4);
      expect(round[i]!.lng).toBeCloseTo(pts[i]!.lng, 4);
    }
  });

  it("decodes a single complete point and throws on truncated input", () => {
    expect(decodePolyline("_p~iF~ps|U")).toHaveLength(1); // 2 full values = 1 point
    expect(() => decodePolyline("_p~iF~ps|U_ulL")).toThrow(); // partial 3rd value
    expect(() => decodePolyline("_")).toThrow();
  });
});
