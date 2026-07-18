import { destinationPoint, type GeoPoint, type Venue } from "@foodmap/domain";

/** Base point for the seeded world (Karachi — matches Herald's locale). */
export const SEED_ORIGIN: GeoPoint = { lat: 24.8607, lng: 67.0011 };

interface Seed {
  id: string;
  brandId: string;
  name: string;
  bearing: number;
  distM: number;
  cuisines: string[];
  open?: boolean;
  source?: Venue["source"];
  slug?: string;
  branchId?: string;
  fact?: string;
}

const SEEDS: Seed[] = [
  // Eastbound-ahead cluster
  { id: "v-burger-town", brandId: "b-burger-town", name: "Burger Town", bearing: 88, distM: 450,
    cuisines: ["burgers", "fast_food"], source: "delivery_linked", slug: "burger-town",
    branchId: "br_clifton", fact: "Flame-grilled since 1998" },
  { id: "v-karachi-biryani", brandId: "b-kb", name: "Karachi Biryani House", bearing: 92, distM: 900,
    cuisines: ["pakistani", "biryani"], source: "merchant", fact: "Double-egg Sindhi biryani" },
  { id: "v-cafe-aroma", brandId: "b-aroma", name: "Cafe Aroma", bearing: 84, distM: 1300,
    cuisines: ["cafe", "continental"], source: "foodmap" },
  // A chain with two nearby branches (diversity test in the real world)
  { id: "v-chai-co-1", brandId: "b-chai-co", name: "Chai Co", bearing: 90, distM: 600,
    cuisines: ["cafe", "tea"], source: "delivery_linked", slug: "chai-co", branchId: "br_1" },
  { id: "v-chai-co-2", brandId: "b-chai-co", name: "Chai Co", bearing: 95, distM: 1500,
    cuisines: ["cafe", "tea"], source: "delivery_linked", slug: "chai-co", branchId: "br_2" },
  // Closed venue (Open Now filter)
  { id: "v-night-owl", brandId: "b-owl", name: "Night Owl Diner", bearing: 90, distM: 750,
    cuisines: ["american"], open: false, source: "foodmap" },
  // External-only provider venue (no ordering)
  { id: "v-street-tikka", brandId: "b-tikka", name: "Street Tikka", bearing: 96, distM: 1100,
    cuisines: ["bbq", "pakistani"], source: "provider", fact: "Charcoal seekh kebabs" },
  // Behind (west) — should be suppressed once heading is confident
  { id: "v-old-town-pizza", brandId: "b-otp", name: "Old Town Pizza", bearing: 270, distM: 500,
    cuisines: ["pizza", "italian"], source: "foodmap" },
  { id: "v-dosa-corner", brandId: "b-dosa", name: "Dosa Corner", bearing: 250, distM: 800,
    cuisines: ["south_indian"], source: "merchant" },
];

export const SEED_VENUES: readonly Venue[] = SEEDS.map((s) => {
  const deliveryBranchRef = s.slug
    ? { restaurantSlug: s.slug, ...(s.branchId ? { branchId: s.branchId } : {}) }
    : undefined;
  return {
    id: s.id,
    brandId: s.brandId,
    name: s.name,
    point: destinationPoint(SEED_ORIGIN, s.bearing, s.distM),
    cuisines: s.cuisines,
    openState: s.open === false ? ("closed" as const) : ("open" as const),
    source: s.source ?? "foodmap",
    ...(deliveryBranchRef ? { deliveryBranchRef } : {}),
    ...(s.fact ? { distinguishingFact: s.fact } : {}),
  };
});
