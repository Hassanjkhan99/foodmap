import { describe, it, expect } from "vitest";
import type { CatalogProvider } from "@foodmap/integrations";
import { PostgisCatalogProvider, rowToVenue } from "../src/index.js";

// Compile-time check: the PostGIS provider satisfies the CatalogProvider port
// structurally, so it can be swapped for the fixture catalog by config alone.
// (Never executed — assignability is the assertion.)
export function _assignableToPort(p: PostgisCatalogProvider): CatalogProvider {
  return p;
}

describe("rowToVenue", () => {
  const base = {
    id: "v-1",
    brand_id: "b-1",
    name: "Burger Town",
    lat: 24.86,
    lng: 67.0,
    cuisines: ["burgers"],
    open_state: "open",
    opens_at_label: null,
    source: "delivery_linked",
    delivery_restaurant_slug: "burger-town",
    delivery_branch_id: "br_1",
    distinguishing_fact: "Flame-grilled",
  };

  it("maps a full row to a domain Venue", () => {
    const v = rowToVenue(base);
    expect(v).toMatchObject({
      id: "v-1",
      brandId: "b-1",
      name: "Burger Town",
      point: { lat: 24.86, lng: 67.0 },
      openState: "open",
      source: "delivery_linked",
      deliveryBranchRef: { restaurantSlug: "burger-town", branchId: "br_1" },
      distinguishingFact: "Flame-grilled",
    });
  });

  it("omits optional fields when null (never emits null/0/false)", () => {
    const v = rowToVenue({
      ...base,
      opens_at_label: null,
      delivery_restaurant_slug: null,
      delivery_branch_id: null,
      distinguishing_fact: null,
      source: "foodmap",
    });
    expect(v.deliveryBranchRef).toBeUndefined();
    expect(v.opensAtLabel).toBeUndefined();
    expect(v.distinguishingFact).toBeUndefined();
  });

  it("coerces numeric strings from PostGIS ST_Y/ST_X", () => {
    const v = rowToVenue({ ...base, lat: "24.86" as unknown as number, lng: "67.0" as unknown as number });
    expect(v.point).toEqual({ lat: 24.86, lng: 67.0 });
  });

  it("rejects an invalid open_state at the boundary", () => {
    expect(() => rowToVenue({ ...base, open_state: "banana" })).toThrow();
  });
});
