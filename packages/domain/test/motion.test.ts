import { describe, it, expect } from "vitest";
import {
  HeadingEstimator,
  MotionEstimator,
  destinationPoint,
  presentationContextFor,
  type LocationSample,
} from "../src/index.js";

const A = { lat: 24.8, lng: 67.0 };

function sampleAt(alongM: number, t: number, accuracyM = 5): LocationSample {
  return { point: destinationPoint(A, 90, alongM), timestamp: t, accuracyM };
}

describe("HeadingEstimator", () => {
  it("derives an eastbound heading (~90) after real displacement", () => {
    const est = new HeadingEstimator();
    let h = est.update(sampleAt(0, 0));
    expect(h).toBeNull(); // first sample: no displacement yet
    for (let i = 1; i <= 6; i++) h = est.update(sampleAt(i * 30, i * 1000));
    expect(h).not.toBeNull();
    expect(h!.confidence).toBeGreaterThan(0.5);
    expect(Math.abs(((h!.deg - 90 + 540) % 360) - 180)).toBeLessThan(6);
  });

  it("does NOT derive heading from stationary GPS drift", () => {
    const est = new HeadingEstimator();
    // jitter within accuracy at a fixed spot → no trusted displacement
    const jitter = [
      { point: { lat: 24.8, lng: 67.0 }, timestamp: 0, accuracyM: 15 },
      { point: { lat: 24.80002, lng: 67.00001 }, timestamp: 1000, accuracyM: 15 },
      { point: { lat: 24.79999, lng: 67.00002 }, timestamp: 2000, accuracyM: 15 },
      { point: { lat: 24.80001, lng: 66.99999 }, timestamp: 3000, accuracyM: 15 },
    ];
    let h = null as ReturnType<HeadingEstimator["update"]>;
    for (const s of jitter) h = est.update(s);
    expect(h).toBeNull();
  });

  it("handles the 359->1 heading wrap without averaging to ~180", () => {
    // travel due north (bearing ~0/360) — successive north steps
    const est = new HeadingEstimator();
    let h = null as ReturnType<HeadingEstimator["update"]>;
    for (let i = 0; i <= 6; i++) {
      h = est.update({ point: destinationPoint(A, 0, i * 30), timestamp: i * 1000, accuracyM: 5 });
    }
    expect(h).not.toBeNull();
    const sepFromNorth = Math.min(h!.deg, 360 - h!.deg);
    expect(sepFromNorth).toBeLessThan(6);
  });
});

describe("MotionEstimator", () => {
  it("reports moving at driving speed and applies hysteresis", () => {
    const est = new MotionEstimator();
    // ~15 m/s (54 km/h) eastbound
    let state = est.value;
    for (let i = 0; i <= 5; i++) {
      state = est.update({ point: destinationPoint(A, 90, i * 15), timestamp: i * 1000, accuracyM: 5 });
    }
    expect(state).toBe("moving");
  });

  it("treats sub-accuracy jitter as stationary", () => {
    const est = new MotionEstimator();
    est.update({ point: A, timestamp: 0, accuracyM: 20 });
    const s = est.update({ point: { lat: 24.80001, lng: 67.00001 }, timestamp: 1000, accuracyM: 20 });
    expect(s).toBe("stationary");
  });

  it("stays unknown before any evidence", () => {
    expect(new MotionEstimator().value).toBe("unknown");
  });
});

describe("presentationContextFor", () => {
  it("maps motion + passenger opt-in", () => {
    expect(presentationContextFor("moving", false)).toBe("moving_compact");
    expect(presentationContextFor("stationary", false)).toBe("stationary_rich");
    expect(presentationContextFor("unknown", false)).toBe("unknown_compact");
    expect(presentationContextFor("moving", true)).toBe("passenger_rich");
  });
});
