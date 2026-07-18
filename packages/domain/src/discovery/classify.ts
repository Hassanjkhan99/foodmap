import type { AheadClass, GeoPoint, Heading } from "../types.js";
import { bearingDeg, haversineM } from "../geo/distance.js";
import { angularSeparationDeg } from "../geo/angles.js";

export interface RadarClassifyOptions {
  /** below this heading confidence, direction is untrusted → nothing is "behind" */
  readonly minHeadingConfidence: number;
  /** full width of the "ahead" cone in degrees (centred on heading) */
  readonly aheadConeDeg: number;
  /** separation beyond this (deg) is treated as passed/behind */
  readonly behindThresholdDeg: number;
}

export const DEFAULT_RADAR_CLASSIFY: RadarClassifyOptions = {
  minHeadingConfidence: 0.3,
  aheadConeDeg: 200, // ±100°
  behindThresholdDeg: 150,
};

export interface Classification {
  readonly distanceM: number;
  readonly aheadClass: AheadClass;
  /** 0..1 "aheadness" used in scoring; 0.5 when heading is untrusted */
  readonly aheadFactor: number;
  readonly separationDeg: number | null;
}

/**
 * Classify a venue relative to the traveller. When heading confidence is
 * below the threshold, EVERYTHING is "unknown" (never "behind") — a core
 * safety rule: low-confidence heading must not suppress restaurants.
 */
export function classifyRadar(
  user: GeoPoint,
  heading: Heading | null,
  venue: GeoPoint,
  options: RadarClassifyOptions = DEFAULT_RADAR_CLASSIFY,
): Classification {
  const distanceM = haversineM(user, venue);
  const trusted = heading !== null && heading.confidence >= options.minHeadingConfidence;
  if (!trusted) {
    return { distanceM, aheadClass: "unknown", aheadFactor: 0.5, separationDeg: null };
  }
  const sep = angularSeparationDeg(bearingDeg(user, venue), heading.deg);
  const aheadFactor = (Math.cos((sep * Math.PI) / 180) + 1) / 2;
  let aheadClass: AheadClass;
  if (sep <= options.aheadConeDeg / 2) aheadClass = "ahead";
  else if (sep <= options.behindThresholdDeg) aheadClass = "near_current";
  else aheadClass = "likely_passed";
  return { distanceM, aheadClass, aheadFactor, separationDeg: sep };
}
