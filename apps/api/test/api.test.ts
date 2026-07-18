import { describe, it, expect } from "vitest";
import { HeadingEstimator, type Heading } from "@foodmap/domain";
import { SEED_ORIGIN, straightEastbound } from "@foodmap/test-fixtures";
import { createFoodMapYoga } from "../src/yoga.js";
import { verifyVenueRef } from "../src/refs.js";

const SECRET = "test-secret";
const yoga = createFoodMapYoga({ refSecret: SECRET, now: () => 1_000_000 });

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await yoga.fetch("http://localhost/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return { res, json: (await res.json()) as { data?: any; errors?: any } };
}

const DISCOVER = /* GraphQL */ `
  query D($input: DiscoverInput!) {
    foodMapDiscover(input: $input) {
      status
      warnings
      configVersion
      selectionVersion
      candidates { ref name source aheadClass distanceM deliveryMenuUrl actions { kind } }
    }
  }
`;

function eastHeadingAndUser() {
  const est = new HeadingEstimator();
  const samples = straightEastbound(SEED_ORIGIN);
  let heading: Heading | null = null;
  for (const s of samples) heading = est.update(s);
  return { heading: heading!, user: samples.at(-1)!.point };
}

describe("GraphQL API", () => {
  it("reports capabilities (radar on, route off in Phase 1)", async () => {
    const { json } = await gql(
      `{ foodMapCapabilities { radarEnabled routeEnabled mapEnabled placesEnabled configVersion } }`,
    );
    expect(json.errors).toBeUndefined();
    expect(json.data.foodMapCapabilities.radarEnabled).toBe(true);
    expect(json.data.foodMapCapabilities.routeEnabled).toBe(false);
    expect(json.data.foodMapCapabilities.placesEnabled).toBe(false);
  });

  it("guest discovery with unknown heading is a typed degraded payload", async () => {
    const { json } = await gql(DISCOVER, {
      input: { lat: SEED_ORIGIN.lat, lng: SEED_ORIGIN.lng, sessionId: "s1" },
    });
    expect(json.errors).toBeUndefined();
    const p = json.data.foodMapDiscover;
    expect(p.status).toBe("DEGRADED_HEADING_UNKNOWN");
    expect(p.warnings).toContain("heading_unknown");
    expect(p.candidates.length).toBeGreaterThan(0);
  });

  it("sets a private no-store cache header on discovery responses", async () => {
    const { res } = await gql(DISCOVER, {
      input: { lat: SEED_ORIGIN.lat, lng: SEED_ORIGIN.lng, sessionId: "s1" },
    });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("returns opaque signed refs the server can verify", async () => {
    const { json } = await gql(DISCOVER, {
      input: { lat: SEED_ORIGIN.lat, lng: SEED_ORIGIN.lng, sessionId: "s1" },
    });
    const ref: string = json.data.foodMapDiscover.candidates[0].ref;
    expect(ref).not.toContain("v-"); // internal id not exposed in the clear
    const payload = verifyVenueRef(ref, SECRET, 1_000_000);
    expect(payload?.venueId).toMatch(/^v-/);
  });

  it("suppresses behind venues once heading is confident and links menus", async () => {
    const { heading, user } = eastHeadingAndUser();
    const { json } = await gql(DISCOVER, {
      input: {
        lat: user.lat,
        lng: user.lng,
        headingDeg: heading.deg,
        headingConfidence: heading.confidence,
        sessionId: "s1",
        resultLimit: 15,
      },
    });
    const p = json.data.foodMapDiscover;
    expect(p.status).toBe("OK");
    const names: string[] = p.candidates.map((c: any) => c.name);
    expect(names).toContain("Burger Town");
    expect(names).not.toContain("Old Town Pizza");

    const burger = p.candidates.find((c: any) => c.name === "Burger Town");
    expect(burger.deliveryMenuUrl).toContain("/r/burger-town");
    expect(burger.actions.map((a: any) => a.kind)).toContain("view_menu");
  });
});
