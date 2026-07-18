import { describe, it, expect } from "vitest";
import {
  locationReducer,
  validateSample,
  watcherActive,
  type LocationState,
  type LocationEvent,
} from "../src/index.js";

function run(events: LocationEvent[], start: LocationState = "idle") {
  let state = start;
  const effects: string[] = [];
  for (const e of events) {
    const t = locationReducer(state, e);
    state = t.state;
    effects.push(t.effect);
  }
  return { state, effects };
}

describe("location state machine", () => {
  it("requests permission only after an explicit START", () => {
    // No event should ever leave idle without START
    expect(locationReducer("idle", { type: "GOOD_SAMPLE" }).state).toBe("idle");
    const { state } = run([{ type: "START" }, { type: "PERMISSION_RESULT", result: "prompt" }]);
    expect(state).toBe("permissionRequired");
  });

  it("reaches tracking on grant + good sample and starts the watcher", () => {
    const { state, effects } = run([
      { type: "START" },
      { type: "PERMISSION_RESULT", result: "granted" },
      { type: "GOOD_SAMPLE" },
    ]);
    expect(state).toBe("tracking");
    expect(effects).toContain("start_watcher");
  });

  it("STOP always tears down the watcher from any state", () => {
    const { state, effects } = run([
      { type: "START" },
      { type: "PERMISSION_RESULT", result: "granted" },
      { type: "GOOD_SAMPLE" },
      { type: "STOP" },
    ]);
    expect(state).toBe("stopped");
    expect(effects.at(-1)).toBe("stop_watcher");
  });

  it("denial does not auto re-prompt; only START retries", () => {
    let s: LocationState = "denied";
    // arbitrary events do nothing
    s = locationReducer(s, { type: "PERMISSION_RESULT", result: "prompt" }).state;
    expect(s).toBe("denied");
    s = locationReducer(s, { type: "GOOD_SAMPLE" }).state;
    expect(s).toBe("denied");
    // explicit retry
    s = locationReducer(s, { type: "START" }).state;
    expect(s).toBe("checkingPermission");
  });

  it("degrades on poor accuracy and recovers on a good sample", () => {
    const { state } = run(
      [{ type: "POOR_ACCURACY" }, { type: "GOOD_SAMPLE" }],
      "tracking",
    );
    expect(state).toBe("tracking");
    expect(locationReducer("tracking", { type: "POOR_ACCURACY" }).state).toBe("degraded");
  });

  it("pause stops the watcher; resume restarts it", () => {
    expect(locationReducer("tracking", { type: "PAUSE" })).toEqual({
      state: "paused",
      effect: "stop_watcher",
    });
    expect(locationReducer("paused", { type: "RESUME" })).toEqual({
      state: "acquiring",
      effect: "start_watcher",
    });
  });

  it("unsupported geolocation is terminal-ish", () => {
    expect(locationReducer("checkingPermission", { type: "GEOLOCATION_UNSUPPORTED" }).state).toBe(
      "unsupported",
    );
  });

  it("watcherActive reflects the running states", () => {
    expect(watcherActive("tracking")).toBe(true);
    expect(watcherActive("acquiring")).toBe(true);
    expect(watcherActive("degraded")).toBe(true);
    expect(watcherActive("paused")).toBe(false);
    expect(watcherActive("stopped")).toBe(false);
  });
});

describe("validateSample", () => {
  const base = { point: { lat: 24.8, lng: 67.0 }, timestamp: 1000, accuracyM: 10 };

  it("accepts a good sample", () => {
    expect(validateSample(base, { now: 1000 }).ok).toBe(true);
  });
  it("rejects NaN", () => {
    expect(validateSample({ ...base, point: { lat: NaN, lng: 67 } }, { now: 1000 })).toMatchObject({
      ok: false,
      reason: "nan",
    });
  });
  it("rejects out-of-range coords", () => {
    expect(validateSample({ ...base, point: { lat: 100, lng: 0 } }, { now: 1000 })).toMatchObject({
      reason: "out_of_range",
    });
  });
  it("rejects bad accuracy", () => {
    expect(validateSample({ ...base, accuracyM: 0 }, { now: 1000 })).toMatchObject({
      reason: "bad_accuracy",
    });
    expect(validateSample({ ...base, accuracyM: 9999 }, { now: 1000 })).toMatchObject({
      reason: "bad_accuracy",
    });
  });
  it("rejects stale samples", () => {
    expect(validateSample(base, { now: 999_999 })).toMatchObject({ reason: "stale" });
  });
  it("rejects implausible speed", () => {
    expect(validateSample({ ...base, speedMps: 999 }, { now: 1000 })).toMatchObject({
      reason: "implausible_speed",
    });
  });
});
