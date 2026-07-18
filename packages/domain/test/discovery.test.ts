import { describe, it, expect } from "vitest";
import {
  destinationPoint,
  discover,
  type DiscoveryRequest,
  type Heading,
  type Venue,
} from "../src/index.js";

const USER = { lat: 24.8, lng: 67.0 };
const EAST: Heading = { deg: 90, confidence: 0.9 };

function venue(part: Partial<Venue> & { id: string; bearing: number; distM: number }): Venue {
  return {
    brandId: part.brandId ?? `brand-${part.id}`,
    name: part.name ?? `Venue ${part.id}`,
    cuisines: part.cuisines ?? ["burgers"],
    openState: part.openState ?? "open",
    source: part.source ?? "foodmap",
    ...(part.deliveryBranchRef ? { deliveryBranchRef: part.deliveryBranchRef } : {}),
    id: part.id,
    point: destinationPoint(USER, part.bearing, part.distM),
  };
}

// Ahead (east) and behind (west) venues.
const ahead1 = venue({ id: "a1", bearing: 90, distM: 400 });
const ahead2 = venue({ id: "a2", bearing: 80, distM: 900, brandId: "b2" });
const behind1 = venue({ id: "b1", bearing: 270, distM: 400, brandId: "b3" });

const baseReq = (over: Partial<DiscoveryRequest> = {}): DiscoveryRequest => ({
  location: USER,
  heading: EAST,
  resultLimit: 5,
  ...over,
});

describe("discovery — ahead/behind", () => {
  it("suppresses behind venues when heading is confident", () => {
    const r = discover([ahead1, ahead2, behind1], baseReq());
    const ids = r.candidates.map((c) => c.venue.id);
    expect(ids).toContain("a1");
    expect(ids).toContain("a2");
    expect(ids).not.toContain("b1");
    expect(r.status).toBe("OK");
  });

  it("does NOT suppress behind venues when heading is unknown", () => {
    const r = discover([ahead1, behind1], baseReq({ heading: null }));
    const ids = r.candidates.map((c) => c.venue.id);
    expect(ids).toContain("a1");
    expect(ids).toContain("b1");
    expect(r.status).toBe("DEGRADED_HEADING_UNKNOWN");
    expect(r.warnings).toContain("heading_unknown");
  });

  it("does NOT suppress behind venues when heading confidence is low", () => {
    const r = discover([ahead1, behind1], baseReq({ heading: { deg: 90, confidence: 0.1 } }));
    expect(r.candidates.map((c) => c.venue.id)).toContain("b1");
  });
});

describe("discovery — dedupe & merge", () => {
  it("merges an exact duplicate id, preferring the richer/linked source", () => {
    const linked = venue({
      id: "a1",
      bearing: 90,
      distM: 400,
      source: "delivery_linked",
      deliveryBranchRef: { restaurantSlug: "burger-town", branchId: "br_1" },
    });
    const r = discover([ahead1, linked], baseReq());
    const a1 = r.candidates.find((c) => c.venue.id === "a1")!;
    expect(a1.venue.deliveryBranchRef?.restaurantSlug).toBe("burger-town");
    expect(a1.actions.map((x) => x.kind)).toContain("view_menu");
  });

  it("suppresses a probable duplicate (same name, within radius)", () => {
    const near = venue({ id: "a1b", bearing: 90, distM: 415, name: "Venue a1", brandId: "b9" });
    const r = discover([ahead1, near], baseReq());
    const matching = r.candidates.filter((c) => c.venue.name === "Venue a1");
    expect(matching).toHaveLength(1);
  });

  it("keeps distinct nearby venues with different names separate", () => {
    const near = venue({ id: "a1c", bearing: 90, distM: 420, name: "Totally Different" });
    const r = discover([ahead1, near], baseReq());
    expect(r.candidates.map((c) => c.venue.id).sort()).toEqual(["a1", "a1c"]);
  });
});

describe("discovery — diversity, filters, bound", () => {
  it("caps chain flooding (one per brand) unless the limit forces more", () => {
    const c1 = venue({ id: "c1", bearing: 90, distM: 300, brandId: "chain" });
    const c2 = venue({ id: "c2", bearing: 90, distM: 500, brandId: "chain" });
    const c3 = venue({ id: "c3", bearing: 95, distM: 700, brandId: "chain" });
    const other = venue({ id: "o1", bearing: 88, distM: 600, brandId: "indie" });
    const r = discover([c1, c2, c3, other], baseReq({ resultLimit: 2 }));
    const brands = r.candidates.map((c) => c.venue.brandId);
    expect(brands).toContain("indie");
    expect(brands.filter((b) => b === "chain")).toHaveLength(1);
  });

  it("applies openNow, cuisine, and maxMetresAhead filters", () => {
    const closed = venue({ id: "cl", bearing: 90, distM: 300, openState: "closed" });
    const sushi = venue({ id: "su", bearing: 90, distM: 350, cuisines: ["sushi"], brandId: "s" });
    const far = venue({ id: "fa", bearing: 90, distM: 9000, brandId: "f" });
    const r = discover([ahead1, closed, sushi, far], baseReq({
      filters: { openNow: true, cuisines: ["burgers"], maxMetresAhead: 2000 },
    }));
    const ids = r.candidates.map((c) => c.venue.id);
    expect(ids).toContain("a1");
    expect(ids).not.toContain("cl"); // closed
    expect(ids).not.toContain("su"); // wrong cuisine
    expect(ids).not.toContain("fa"); // too far
  });

  it("returns ALL_FILTERED when everything is filtered out but venues existed", () => {
    const r = discover([ahead1], baseReq({ filters: { cuisines: ["thai"] } }));
    expect(r.status).toBe("ALL_FILTERED");
    expect(r.candidates).toHaveLength(0);
  });

  it("returns NO_RESULTS with an empty catalog", () => {
    expect(discover([], baseReq()).status).toBe("NO_RESULTS");
  });

  it("bounds the result count", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      venue({ id: `m${i}`, bearing: 90, distM: 200 + i * 50, brandId: `br${i}` }),
    );
    expect(discover(many, baseReq({ resultLimit: 5 })).candidates).toHaveLength(5);
  });
});

describe("discovery — determinism & stability", () => {
  it("is deterministic for identical inputs", () => {
    const venues = [ahead1, ahead2, behind1];
    const a = discover(venues, baseReq());
    const b = discover(venues, baseReq());
    expect(a.candidates.map((c) => c.venue.id)).toEqual(b.candidates.map((c) => c.venue.id));
  });

  it("preserves prior order for near-equal scores (no reshuffle)", () => {
    // two nearly-equidistant venues; prior order lists a2 before a1
    const nearA = venue({ id: "x1", bearing: 90, distM: 500, brandId: "bx1" });
    const nearB = venue({ id: "x2", bearing: 90, distM: 505, brandId: "bx2" });
    const withPrior = discover([nearA, nearB], baseReq({ priorOrder: ["x2", "x1"] }));
    expect(withPrior.candidates.map((c) => c.venue.id)).toEqual(["x2", "x1"]);
  });

  it("respects a session dismissal cooldown", () => {
    const r = discover([ahead1, ahead2], baseReq({ dismissed: ["a1"] }));
    expect(r.candidates.map((c) => c.venue.id)).not.toContain("a1");
  });
});
