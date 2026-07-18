import type { LocationSample } from "../types.js";

export type SampleRejectReason =
  | "nan"
  | "out_of_range"
  | "bad_accuracy"
  | "stale"
  | "implausible_speed";

export interface SampleValidationOk {
  readonly ok: true;
  readonly sample: LocationSample;
}
export interface SampleValidationErr {
  readonly ok: false;
  readonly reason: SampleRejectReason;
}
export type SampleValidation = SampleValidationOk | SampleValidationErr;

export interface ValidateOptions {
  /** reference "now" in epoch ms (injected for determinism) */
  readonly now: number;
  /** reject samples older than this many ms */
  readonly maxAgeMs: number;
  /** reject accuracy worse (larger) than this many metres outright */
  readonly maxAccuracyM: number;
  /** reject speeds above this m/s as sensor errors (~360 km/h) */
  readonly maxSpeedMps: number;
}

const DEFAULTS: ValidateOptions = {
  now: 0,
  maxAgeMs: 15_000,
  maxAccuracyM: 500,
  maxSpeedMps: 100,
};

/** Validate a raw location observation. Deterministic (no Date.now). */
export function validateSample(
  raw: LocationSample,
  options: Partial<ValidateOptions> & Pick<ValidateOptions, "now">,
): SampleValidation {
  const o = { ...DEFAULTS, ...options };
  const { point, accuracyM, timestamp, speedMps, headingDeg } = raw;

  if (
    !isFiniteNum(point.lat) ||
    !isFiniteNum(point.lng) ||
    !isFiniteNum(accuracyM) ||
    !isFiniteNum(timestamp) ||
    (speedMps !== undefined && !isFiniteNum(speedMps)) ||
    (headingDeg !== undefined && !isFiniteNum(headingDeg))
  ) {
    return { ok: false, reason: "nan" };
  }
  if (point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180) {
    return { ok: false, reason: "out_of_range" };
  }
  if (accuracyM <= 0 || accuracyM > o.maxAccuracyM) {
    return { ok: false, reason: "bad_accuracy" };
  }
  if (o.now - timestamp > o.maxAgeMs || timestamp - o.now > 5_000) {
    return { ok: false, reason: "stale" };
  }
  if (speedMps !== undefined && (speedMps < 0 || speedMps > o.maxSpeedMps)) {
    return { ok: false, reason: "implausible_speed" };
  }
  return { ok: true, sample: raw };
}

function isFiniteNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}
