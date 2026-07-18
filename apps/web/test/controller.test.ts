import { describe, it, expect, vi } from "vitest";
import type { LocationSample } from "@foodmap/domain";
import {
  SessionController,
  type SessionSnapshot,
} from "../src/session/controller.js";
import type { LocationSource } from "../src/session/sources.js";
import type { ClientCandidate, ClientDiscoverPayload } from "../src/lib/graphql.js";

const flush = () => new Promise((r) => setTimeout(r, 0));

function manualSource() {
  let handler: ((s: LocationSample) => void) | null = null;
  const stop = vi.fn();
  const source: LocationSource = {
    start(onSample) {
      handler = onSample;
      return stop;
    },
  };
  return { source, stop, emit: (s: LocationSample) => handler?.(s) };
}

function candidate(key: string): ClientCandidate {
  return {
    ref: `ref-${key}`,
    key,
    name: key,
    cuisines: ["burgers"],
    openState: "open",
    opensAtLabel: null,
    distanceM: 300,
    aheadClass: "ahead",
    distinguishingFact: null,
    source: "foodmap",
    actions: [{ kind: "navigate" }],
    deliveryMenuUrl: null,
    navGoogleUrl: "https://maps.google/",
    navAppleUrl: "https://maps.apple/",
  };
}

const sample = (t: number): LocationSample => ({
  point: { lat: 24.86, lng: 67.0 },
  timestamp: t,
  accuracyM: 5,
});

describe("SessionController", () => {
  it("drives discovery from samples and shares selection by stable key", async () => {
    const discoverFn = vi.fn(
      async (): Promise<ClientDiscoverPayload> => ({
        status: "OK",
        warnings: [],
        candidates: [candidate("k1"), candidate("k2")],
        refreshAfterMs: 4000,
        configVersion: "c",
        selectionVersion: 1,
      }),
    );
    let snap: SessionSnapshot | null = null;
    const ctrl = new SessionController({ sessionId: "t", onState: (s) => (snap = s), discoverFn });
    const src = manualSource();

    ctrl.start(src.source);
    expect(snap!.running).toBe(true);
    src.emit(sample(0));
    await flush();
    expect(snap!.candidates.map((c) => c.key)).toEqual(["k1", "k2"]);

    ctrl.select("k2");
    expect(snap!.selectedKey).toBe("k2");
    src.emit(sample(1000));
    await flush();
    expect(snap!.selectedKey).toBe("k2"); // selection preserved across refresh
  });

  it("coalesces concurrent discovery calls (never one request per sample)", async () => {
    let resolve!: () => void;
    const gate = new Promise<void>((r) => (resolve = r));
    const discoverFn = vi.fn(async (): Promise<ClientDiscoverPayload> => {
      await gate;
      return { status: "OK", warnings: [], candidates: [], refreshAfterMs: 4000, configVersion: "c", selectionVersion: 1 };
    });
    let snap: SessionSnapshot | null = null;
    const ctrl = new SessionController({ sessionId: "t", onState: (s) => (snap = s), discoverFn });
    const src = manualSource();
    ctrl.start(src.source);
    src.emit(sample(0)); // starts in-flight call
    src.emit(sample(1)); // coalesced (pending)
    src.emit(sample(2)); // coalesced (pending)
    expect(discoverFn).toHaveBeenCalledTimes(1);
    resolve();
    await flush();
    // one coalesced follow-up, not three
    expect(discoverFn.mock.calls.length).toBeLessThanOrEqual(2);
    void snap;
  });

  it("stop() tears down the watcher and halts further work", async () => {
    const discoverFn = vi.fn(
      async (): Promise<ClientDiscoverPayload> => ({
        status: "OK",
        warnings: [],
        candidates: [candidate("k1")],
        refreshAfterMs: 4000,
        configVersion: "c",
        selectionVersion: 1,
      }),
    );
    let snap: SessionSnapshot | null = null;
    const ctrl = new SessionController({ sessionId: "t", onState: (s) => (snap = s), discoverFn });
    const src = manualSource();
    ctrl.start(src.source);
    ctrl.stop();
    expect(src.stop).toHaveBeenCalledTimes(1);
    expect(snap!.running).toBe(false);
    expect(snap!.status).toBe("SESSION_STOPPED");
  });
});
