import type { Candidate, GeoPoint, Heading, OpenState, Venue, VenueAction } from "../types.js";
import { classifyRadar, DEFAULT_RADAR_CLASSIFY, type RadarClassifyOptions } from "./classify.js";
import { haversineM } from "../geo/distance.js";

export interface DiscoveryFilters {
  readonly cuisines?: readonly string[];
  readonly openNow?: boolean;
  readonly maxMetresAhead?: number;
}

export interface DiscoveryRequest {
  readonly location: GeoPoint;
  readonly heading: Heading | null;
  readonly filters?: DiscoveryFilters;
  /** server-bounded result count */
  readonly resultLimit: number;
  /** venue ids in the order last shown, for session stability */
  readonly priorOrder?: readonly string[];
  /** venue ids dismissed this session (cooldown) */
  readonly dismissed?: readonly string[];
}

export interface PipelineOptions {
  readonly classify: RadarClassifyOptions;
  /** max candidates per brand before diversity relaxation */
  readonly maxPerBrand: number;
  /** two venues within this distance with equal normalized name = duplicate */
  readonly duplicateRadiusM: number;
  /** score bucket size for stability (larger = stickier order) */
  readonly stabilityBucket: number;
  readonly weights: { readonly distance: number; readonly ahead: number; readonly open: number };
  /** distance (m) treated as the far edge for proximity scoring */
  readonly proximityRangeM: number;
}

export const DEFAULT_PIPELINE: PipelineOptions = {
  classify: DEFAULT_RADAR_CLASSIFY,
  maxPerBrand: 1,
  duplicateRadiusM: 40,
  stabilityBucket: 0.05,
  weights: { distance: 0.6, ahead: 0.3, open: 0.1 },
  proximityRangeM: 5000,
};

export type DiscoveryStatus = "OK" | "NO_RESULTS" | "ALL_FILTERED" | "DEGRADED_HEADING_UNKNOWN";

export interface DiscoverResult {
  readonly candidates: readonly Candidate[];
  readonly status: DiscoveryStatus;
  readonly warnings: readonly string[];
}

const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Deterministic discovery pipeline over a set of venues:
 * normalize → exact-identity merge → probable-duplicate suppression →
 * ahead eligibility → explicit filters → diversity → session stability →
 * bounded response. Same input + options → same output.
 */
export function discover(
  venues: readonly Venue[],
  request: DiscoveryRequest,
  options: PipelineOptions = DEFAULT_PIPELINE,
): DiscoverResult {
  const warnings: string[] = [];
  const headingTrusted =
    request.heading !== null &&
    request.heading.confidence >= options.classify.minHeadingConfidence;
  if (!headingTrusted) warnings.push("heading_unknown");

  // 1) exact-identity merge (same venue id / same delivery link) + dedupe
  const merged = mergeAndDedupe(venues, options);
  const anyVenues = merged.length > 0;

  // 2) classify + score
  const dismissed = new Set(request.dismissed ?? []);
  let scored: Candidate[] = merged.map((v) => toCandidate(v, request, options));

  // 3) ahead eligibility (only suppress "behind" when heading is trusted)
  scored = scored.filter((c) => {
    if (dismissed.has(c.venue.id)) return false;
    if (headingTrusted && c.aheadClass === "likely_passed") return false;
    return true;
  });
  const afterAhead = scored.length;

  // 4) explicit user filters
  scored = applyFilters(scored, request.filters);
  const afterFilters = scored.length;

  // 5) order by score (desc), tie-break by distance then id for determinism
  scored.sort(
    (a, b) => b.score - a.score || a.distanceM - b.distanceM || cmp(a.venue.id, b.venue.id),
  );

  // 6) session stability — keep prior relative order within a score bucket
  scored = applyStability(scored, request.priorOrder, options.stabilityBucket);

  // 7) diversity — cap per brand, relaxing if we'd fall short of the limit
  const diverse = applyDiversity(scored, request.resultLimit, options.maxPerBrand);

  // 8) bound
  const candidates = diverse.slice(0, Math.max(0, request.resultLimit));

  const status: DiscoveryStatus = !anyVenues
    ? "NO_RESULTS"
    : candidates.length === 0
      ? afterAhead > 0 && afterFilters === 0
        ? "ALL_FILTERED"
        : "NO_RESULTS"
      : headingTrusted
        ? "OK"
        : "DEGRADED_HEADING_UNKNOWN";

  return { candidates, status, warnings };
}

function toCandidate(v: Venue, req: DiscoveryRequest, o: PipelineOptions): Candidate {
  const cls = classifyRadar(req.location, req.heading, v.point, o.classify);
  const proximity = 1 - Math.min(1, cls.distanceM / o.proximityRangeM);
  const openBonus = v.openState === "open" ? 1 : v.openState === "unknown" ? 0.5 : 0;
  const score =
    o.weights.distance * proximity + o.weights.ahead * cls.aheadFactor + o.weights.open * openBonus;
  const reasons = [
    `dist:${Math.round(cls.distanceM)}m`,
    `class:${cls.aheadClass}`,
    `open:${v.openState}`,
  ];
  return {
    venue: v,
    distanceM: cls.distanceM,
    aheadClass: cls.aheadClass,
    score,
    reasons,
    actions: actionsFor(v),
  };
}

/** Capability-driven actions: only surface what the venue actually supports. */
function actionsFor(v: Venue): VenueAction[] {
  const actions: VenueAction[] = [{ kind: "navigate" }];
  if (v.deliveryBranchRef) {
    actions.push({ kind: "view_menu" }, { kind: "start_pickup" });
  }
  actions.push({ kind: "report_incorrect" });
  return actions;
}

function mergeAndDedupe(venues: readonly Venue[], o: PipelineOptions): Venue[] {
  const byId = new Map<string, Venue>();
  // exact-identity merge: later entries prefer the richer source
  for (const v of venues) {
    const existing = byId.get(v.id);
    byId.set(v.id, existing ? preferRicher(existing, v) : v);
  }
  const unique = [...byId.values()];

  // probable-duplicate suppression: same normalized name + within radius.
  const kept: Venue[] = [];
  for (const v of unique) {
    const dupIdx = kept.findIndex(
      (k) => norm(k.name) === norm(v.name) && haversineM(k.point, v.point) <= o.duplicateRadiusM,
    );
    if (dupIdx === -1) kept.push(v);
    else kept[dupIdx] = preferRicher(kept[dupIdx]!, v);
  }
  return kept;
}

const SOURCE_RANK: Record<Venue["source"], number> = {
  delivery_linked: 5,
  merchant: 4,
  foodmap: 3,
  mixed: 2,
  provider: 1,
  unknown: 0,
};

function preferRicher(a: Venue, b: Venue): Venue {
  // Merge into a source-aware candidate: keep the richer source but carry a
  // delivery link if either side has one.
  const base = SOURCE_RANK[b.source] > SOURCE_RANK[a.source] ? b : a;
  const deliveryBranchRef = a.deliveryBranchRef ?? b.deliveryBranchRef;
  const source: Venue["source"] =
    a.deliveryBranchRef || b.deliveryBranchRef
      ? base.source === "provider"
        ? "mixed"
        : base.source
      : base.source;
  return deliveryBranchRef ? { ...base, source, deliveryBranchRef } : { ...base, source };
}

function applyFilters(
  candidates: readonly Candidate[],
  filters: DiscoveryFilters | undefined,
): Candidate[] {
  if (!filters) return [...candidates];
  const cuisineSet = filters.cuisines && filters.cuisines.length > 0
    ? new Set(filters.cuisines.map(norm))
    : null;
  return candidates.filter((c) => {
    if (filters.openNow && c.venue.openState !== "open") return false;
    if (filters.maxMetresAhead !== undefined && c.distanceM > filters.maxMetresAhead) return false;
    if (cuisineSet && !c.venue.cuisines.some((cu) => cuisineSet.has(norm(cu)))) return false;
    return true;
  });
}

function applyStability(
  ordered: readonly Candidate[],
  priorOrder: readonly string[] | undefined,
  bucket: number,
): Candidate[] {
  if (!priorOrder || priorOrder.length === 0) return [...ordered];
  const priorRank = new Map(priorOrder.map((id, i) => [id, i] as const));
  const withRank = ordered.map((c, i) => ({ c, i }));
  withRank.sort((a, b) => {
    // higher score first, but quantized so near-equal scores don't reshuffle
    const ba = Math.round(b.c.score / bucket);
    const aa = Math.round(a.c.score / bucket);
    if (ba !== aa) return ba - aa;
    const pa = priorRank.get(a.c.venue.id) ?? Number.MAX_SAFE_INTEGER;
    const pb = priorRank.get(b.c.venue.id) ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    return a.i - b.i;
  });
  return withRank.map((x) => x.c);
}

function applyDiversity(
  ordered: readonly Candidate[],
  limit: number,
  maxPerBrand: number,
): Candidate[] {
  const perBrand = new Map<string, number>();
  const picked: Candidate[] = [];
  const overflow: Candidate[] = [];
  for (const c of ordered) {
    const n = perBrand.get(c.venue.brandId) ?? 0;
    if (n < maxPerBrand) {
      perBrand.set(c.venue.brandId, n + 1);
      picked.push(c);
    } else {
      overflow.push(c);
    }
  }
  // Relax the cap only if we'd otherwise fall short of the requested count.
  if (picked.length < limit) picked.push(...overflow.slice(0, limit - picked.length));
  return picked;
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export type { OpenState };
