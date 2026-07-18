import { describe, it, expect } from "vitest";
import { HeadingEstimator, type Heading } from "@foodmap/domain";
import { DEFAULT_CONFIG, type RuntimeConfig } from "@foodmap/config";
import { SEED_ORIGIN, SEED_VENUES, straightEastbound } from "@foodmap/test-fixtures";
import {
  DiscoveryService,
  FixtureCatalogProvider,
  MemoryAnalyticsSink,
  MockDeliveryPlatformClient,
  appleMapsUrl,
  googleMapsUrl,
} from "../src/index.js";

const catalog = new FixtureCatalogProvider();

describe("nav URLs", () => {
  const target = { point: { lat: 24.87, lng: 67.01 }, label: "Burger Town" };
  it("builds a Google Maps directions URL with no origin leak", () => {
    const u = new URL(googleMapsUrl(target));
    expect(u.searchParams.get("destination")).toBe("24.87,67.01");
    expect(u.searchParams.get("api")).toBe("1");
    expect(u.searchParams.has("origin")).toBe(false);
  });
  it("builds an Apple Maps URL", () => {
    const u = new URL(appleMapsUrl(target));
    expect(u.searchParams.get("daddr")).toBe("24.87,67.01");
    expect(u.searchParams.get("q")).toBe("Burger Town");
  });
});

describe("mock delivery client", () => {
  const client = new MockDeliveryPlatformClient({ heraldBaseUrl: "https://herald.example/" });
  it("builds the Herald deep-link /r/<slug>?branch=&item=", () => {
    const url = client.buildBranchUrl(
      { restaurantSlug: "burger-town", branchId: "br_clifton" },
      { itemId: "dish_42" },
    );
    const u = new URL(url);
    expect(u.pathname).toBe("/r/burger-town");
    expect(u.searchParams.get("branch")).toBe("br_clifton");
    expect(u.searchParams.get("item")).toBe("dish_42");
  });
  it("resolves a branch (mock always available)", async () => {
    const b = await client.getBranch({ restaurantSlug: "chai-co", branchId: "br_1" });
    expect(b?.ref.restaurantSlug).toBe("chai-co");
  });
});

describe("fixture catalog", () => {
  it("returns seeded venues within radius", async () => {
    const near = await catalog.nearby({ center: SEED_ORIGIN, radiusM: 5000 });
    expect(near.length).toBe(SEED_VENUES.length);
    const tiny = await catalog.nearby({ center: SEED_ORIGIN, radiusM: 100 });
    expect(tiny.length).toBeLessThan(SEED_VENUES.length);
  });
});

describe("discovery service — vertical slice", () => {
  it("with unknown heading, does not suppress behind venues", async () => {
    const svc = new DiscoveryService(catalog, DEFAULT_CONFIG);
    const r = await svc.radar({ location: SEED_ORIGIN, heading: null });
    expect(r.status).toBe("DEGRADED_HEADING_UNKNOWN");
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.configVersion).toBe(DEFAULT_CONFIG.version);
  });

  it("after a simulated eastbound drive builds heading confidence and suppresses behind", async () => {
    // Derive heading from the simulated drive, like the app would.
    const est = new HeadingEstimator();
    const samples = straightEastbound(SEED_ORIGIN);
    let heading: Heading | null = null;
    for (const s of samples) heading = est.update(s);
    expect(heading).not.toBeNull();
    expect(heading!.confidence).toBeGreaterThan(0.3);
    expect(Math.min(Math.abs(heading!.deg - 90), 360 - Math.abs(heading!.deg - 90))).toBeLessThan(8);

    const user = samples.at(-1)!.point;
    const svc = new DiscoveryService(catalog, DEFAULT_CONFIG);
    const r = await svc.radar({ location: user, heading });
    const ids = r.candidates.map((c) => c.venue.id);
    expect(r.status).toBe("OK");
    expect(ids).toContain("v-burger-town"); // east / ahead
    expect(ids).not.toContain("v-old-town-pizza"); // west / behind
    expect(ids).not.toContain("v-dosa-corner"); // west / behind
    expect(r.candidates.length).toBeLessThanOrEqual(DEFAULT_CONFIG.discovery.defaultResultCount);
  });

  it("linked venue exposes a view_menu action; external-only does not", async () => {
    const est = new HeadingEstimator();
    const samples = straightEastbound(SEED_ORIGIN);
    let heading: Heading | null = null;
    for (const s of samples) heading = est.update(s);
    const svc = new DiscoveryService(catalog, DEFAULT_CONFIG);
    const r = await svc.radar({ location: samples.at(-1)!.point, heading, requestedResultCount: 15 });

    const burger = r.candidates.find((c) => c.venue.id === "v-burger-town");
    expect(burger?.actions.map((a) => a.kind)).toContain("view_menu");
    const tikka = r.candidates.find((c) => c.venue.id === "v-street-tikka");
    if (tikka) expect(tikka.actions.map((a) => a.kind)).not.toContain("view_menu");
  });

  it("respects the radar kill switch", async () => {
    const disabled: RuntimeConfig = {
      ...DEFAULT_CONFIG,
      killSwitches: { ...DEFAULT_CONFIG.killSwitches, "foodmap.radar": false },
    };
    const svc = new DiscoveryService(catalog, disabled);
    const r = await svc.radar({ location: SEED_ORIGIN, heading: null });
    expect(r.status).toBe("FEATURE_DISABLED");
    expect(r.candidates).toHaveLength(0);
  });
});

describe("analytics privacy", () => {
  it("drops events carrying forbidden keys, keeps safe ones, never throws", async () => {
    const sink = new MemoryAnalyticsSink();
    await sink.record([
      { type: "candidate_impression", schemaVersion: 1, sessionId: "s1", props: { count: 5 } },
      { type: "leak", schemaVersion: 1, sessionId: "s1", props: { lat: 24.8, lng: 67 } },
    ]);
    expect(sink.events.map((e) => e.type)).toEqual(["candidate_impression"]);
    expect(sink.dropped).toHaveLength(1);
  });
});
