import {
  destinationPoint,
  type GeoPoint,
  type Heading,
  type LocationSample,
  type Venue,
} from "@foodmap/domain";
import { simulateDrive } from "./simulated-driver.js";

/**
 * Versioned, deterministic scenario library for the FoodMap simulator + CI.
 * Two families:
 *  - MOTION_SCENARIOS: synthetic GPS tracks (+ optional route) that exercise the
 *    heading/motion/location/route engines, each with expected checkpoints.
 *  - DISCOVERY_SCENARIOS: catalog + stepped requests that exercise the discovery
 *    pipeline (ahead/behind, dedup/merge, diversity, passed-candidate).
 *
 * Bump SCENARIO_LIBRARY_VERSION on any change to a scenario's expected outcome.
 */
export const SCENARIO_LIBRARY_VERSION = 1;

export const ORIGIN: GeoPoint = { lat: 24.8607, lng: 67.0011 };

const drive = (
  start: GeoPoint,
  legs: { bearingDeg: number; speedMps: number; steps: number }[],
  opts?: { accuracyM?: number; intervalMs?: number; reportSpeed?: boolean },
): LocationSample[] =>
  simulateDrive({
    start,
    legs,
    startTime: 0,
    intervalMs: opts?.intervalMs ?? 1000,
    accuracyM: opts?.accuracyM ?? 6,
    ...(opts?.reportSpeed ? { reportSpeed: true } : {}),
  });

export type MotionExpectation =
  | { readonly kind: "heading"; readonly aboutDeg: number; readonly minConfidence: number }
  | { readonly kind: "heading_unknown" }
  | { readonly kind: "motion"; readonly value: "unknown" | "stationary" | "slow" | "moving" };

export interface MotionScenario {
  readonly id: string;
  readonly title: string;
  readonly samples: readonly LocationSample[];
  readonly route?: readonly GeoPoint[];
  readonly expect: readonly MotionExpectation[];
  readonly notes?: string;
}

/** Jitter within accuracy at a fixed spot — must NOT produce a heading. */
function stationaryDrift(): LocationSample[] {
  const base = ORIGIN;
  const offsets = [
    [0, 0],
    [0.00002, 0.00001],
    [-0.00001, 0.00002],
    [0.00001, -0.00002],
    [-0.00002, -0.00001],
  ];
  return offsets.map(([dLat, dLng], i) => ({
    point: { lat: base.lat + dLat!, lng: base.lng + dLng! },
    timestamp: i * 1000,
    accuracyM: 18,
  }));
}

/** Mostly-east track with one bounded backward regression sample in the middle. */
function shortRegression(): LocationSample[] {
  const s = drive(ORIGIN, [{ bearingDeg: 90, speedMps: 14, steps: 8 }]);
  // Nudge sample 5 backwards (west) a little — a bounded GPS glitch.
  const glitched = s.map((sample, i) =>
    i === 5 ? { ...sample, point: destinationPoint(sample.point, 270, 25) } : sample,
  );
  return glitched;
}

export const MOTION_SCENARIOS: readonly MotionScenario[] = [
  {
    id: "straight-eastbound",
    title: "Straight eastbound drive",
    samples: drive(ORIGIN, [{ bearingDeg: 90, speedMps: 14, steps: 10 }], { reportSpeed: true }),
    expect: [
      { kind: "heading", aboutDeg: 90, minConfidence: 0.5 },
      { kind: "motion", value: "moving" },
    ],
  },
  {
    id: "heading-wrap-north",
    title: "Northbound drive crossing the 359°/1° wrap",
    samples: drive(ORIGIN, [{ bearingDeg: 0, speedMps: 12, steps: 8 }]),
    expect: [{ kind: "heading", aboutDeg: 0, minConfidence: 0.5 }],
    notes: "Circular smoothing must not average north to ~180°.",
  },
  {
    id: "stationary-drift",
    title: "Parked with GPS drift",
    samples: stationaryDrift(),
    expect: [{ kind: "heading_unknown" }, { kind: "motion", value: "stationary" }],
  },
  {
    id: "unknown-heading-start",
    title: "First fix — heading not yet known",
    // A single fix: no displacement yet, so no trustworthy heading exists.
    samples: [{ point: ORIGIN, timestamp: 0, accuracyM: 6 }],
    expect: [{ kind: "heading_unknown" }],
  },
  {
    id: "real-u-turn",
    title: "Eastbound then a real U-turn to westbound",
    samples: drive(ORIGIN, [
      { bearingDeg: 90, speedMps: 14, steps: 8 },
      { bearingDeg: 270, speedMps: 14, steps: 8 },
    ]),
    expect: [{ kind: "heading", aboutDeg: 270, minConfidence: 0.4 }],
    notes: "Heading must eventually reflect the new westbound direction.",
  },
  {
    id: "short-gps-regression",
    title: "Eastbound with a bounded backward GPS glitch",
    samples: shortRegression(),
    expect: [{ kind: "heading", aboutDeg: 90, minConfidence: 0.4 }],
    notes: "A single backward sample must not flip the heading.",
  },
  {
    id: "accelerate-from-stop",
    title: "Stationary then accelerating away",
    samples: [
      { point: ORIGIN, timestamp: 0, accuracyM: 6 },
      { point: ORIGIN, timestamp: 1000, accuracyM: 6 },
      ...drive(destinationPoint(ORIGIN, 90, 1), [{ bearingDeg: 90, speedMps: 15, steps: 5 }]).map(
        (s) => ({ ...s, timestamp: s.timestamp + 2000 }),
      ),
    ],
    expect: [{ kind: "motion", value: "moving" }],
  },
  {
    id: "route-turn-L",
    title: "Route that turns (east then north)",
    samples: drive(ORIGIN, [
      { bearingDeg: 90, speedMps: 14, steps: 5 },
      { bearingDeg: 0, speedMps: 14, steps: 5 },
    ]),
    route: [ORIGIN, destinationPoint(ORIGIN, 90, 2000), destinationPoint(destinationPoint(ORIGIN, 90, 2000), 0, 2000)],
    expect: [{ kind: "motion", value: "moving" }],
  },
  {
    id: "route-loop",
    title: "Route loop returning near the start",
    samples: drive(ORIGIN, [
      { bearingDeg: 90, speedMps: 14, steps: 4 },
      { bearingDeg: 0, speedMps: 14, steps: 4 },
      { bearingDeg: 270, speedMps: 14, steps: 4 },
      { bearingDeg: 180, speedMps: 14, steps: 4 },
    ]),
    expect: [{ kind: "motion", value: "moving" }],
    notes: "Position returns near ORIGIN; route geometry must stay stable.",
  },
];

// ---------------------------------------------------------------------------
// Discovery scenarios
// ---------------------------------------------------------------------------

export interface DiscoveryStep {
  readonly location: GeoPoint;
  readonly heading: Heading | null;
  readonly expectPresent?: readonly string[];
  readonly expectAbsent?: readonly string[];
  readonly expectStatus?: string;
}

export interface DiscoveryScenario {
  readonly id: string;
  readonly title: string;
  readonly venues: readonly Venue[];
  readonly steps: readonly DiscoveryStep[];
  readonly resultLimit?: number;
  readonly notes?: string;
}

const EAST: Heading = { deg: 90, confidence: 0.9 };

function venue(part: {
  id: string;
  bearing: number;
  distM: number;
  name?: string;
  brandId?: string;
  cuisines?: string[];
  open?: boolean;
  source?: Venue["source"];
  slug?: string;
  branchId?: string;
}): Venue {
  const deliveryBranchRef = part.slug
    ? { restaurantSlug: part.slug, ...(part.branchId ? { branchId: part.branchId } : {}) }
    : undefined;
  return {
    id: part.id,
    brandId: part.brandId ?? `brand-${part.id}`,
    name: part.name ?? `Venue ${part.id}`,
    point: destinationPoint(ORIGIN, part.bearing, part.distM),
    cuisines: part.cuisines ?? ["burgers"],
    openState: part.open === false ? "closed" : "open",
    source: part.source ?? "foodmap",
    ...(deliveryBranchRef ? { deliveryBranchRef } : {}),
  };
}

export const DISCOVERY_SCENARIOS: readonly DiscoveryScenario[] = [
  {
    id: "ahead-and-behind",
    title: "Ahead venues shown, behind venues suppressed once heading is confident",
    venues: [
      venue({ id: "east", bearing: 90, distM: 400 }),
      venue({ id: "west", bearing: 270, distM: 400, brandId: "b-w" }),
    ],
    steps: [
      { location: ORIGIN, heading: null, expectPresent: ["east", "west"], expectStatus: "DEGRADED_HEADING_UNKNOWN" },
      { location: ORIGIN, heading: EAST, expectPresent: ["east"], expectAbsent: ["west"], expectStatus: "OK" },
    ],
  },
  {
    id: "linked-duplicate",
    title: "Exact-identity duplicate merges into one order-linked candidate",
    venues: [
      venue({ id: "dup", bearing: 90, distM: 500 }),
      venue({ id: "dup", bearing: 90, distM: 500, source: "delivery_linked", slug: "burger-town", branchId: "br1" }),
    ],
    steps: [{ location: ORIGIN, heading: EAST, expectPresent: ["dup"] }],
    notes: "Two entries, same id → one candidate carrying the delivery link.",
  },
  {
    id: "similar-neighbors",
    title: "Same-name neighbours dedupe; different names stay separate",
    venues: [
      venue({ id: "a", bearing: 90, distM: 400, name: "Chai Co" }),
      venue({ id: "b", bearing: 90, distM: 415, name: "Chai Co", brandId: "b-b" }),
      venue({ id: "c", bearing: 90, distM: 420, name: "Different Cafe", brandId: "b-c" }),
    ],
    steps: [{ location: ORIGIN, heading: EAST, expectPresent: ["c"] }],
    notes: "One of the two 'Chai Co' is suppressed; 'Different Cafe' remains.",
  },
  {
    id: "new-market",
    title: "New market — venues with no order history still appear",
    venues: [
      venue({ id: "n1", bearing: 90, distM: 300, source: "provider", brandId: "b1" }),
      venue({ id: "n2", bearing: 92, distM: 600, source: "foodmap", brandId: "b2" }),
    ],
    steps: [{ location: ORIGIN, heading: EAST, expectPresent: ["n1", "n2"], expectStatus: "OK" }],
  },
  {
    id: "chain-flooding",
    title: "Diversity caps chain flooding",
    venues: [
      venue({ id: "c1", bearing: 90, distM: 300, brandId: "chain" }),
      venue({ id: "c2", bearing: 90, distM: 500, brandId: "chain" }),
      venue({ id: "c3", bearing: 92, distM: 700, brandId: "chain" }),
      venue({ id: "indie", bearing: 88, distM: 600, brandId: "indie" }),
    ],
    resultLimit: 2,
    steps: [{ location: ORIGIN, heading: EAST, expectPresent: ["indie"] }],
    notes: "At most one 'chain' brand appears alongside the indie venue.",
  },
  {
    id: "selected-candidate-passed",
    title: "A candidate ahead becomes behind as the traveller passes it",
    venues: [venue({ id: "spot", bearing: 90, distM: 500 })],
    steps: [
      { location: ORIGIN, heading: EAST, expectPresent: ["spot"] },
      // Move the traveller 800 m east — the venue is now behind.
      { location: destinationPoint(ORIGIN, 90, 800), heading: EAST, expectAbsent: ["spot"] },
    ],
  },
];
