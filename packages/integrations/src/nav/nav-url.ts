import type { GeoPoint } from "@foodmap/domain";

/**
 * Safe navigation-handoff URL builders. Uses URL/URLSearchParams, omits a
 * stale origin by default, and does not assume any app is installed. Callers
 * always offer a browser/copy-address fallback. User action only.
 */

export interface NavTarget {
  readonly point: GeoPoint;
  readonly label?: string;
}

/** Universal Google Maps directions URL (opens app or web). */
export function googleMapsUrl(target: NavTarget): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${target.point.lat},${target.point.lng}`);
  return url.toString();
}

/** Apple Maps URL. */
export function appleMapsUrl(target: NavTarget): string {
  const url = new URL("https://maps.apple.com/");
  url.searchParams.set("daddr", `${target.point.lat},${target.point.lng}`);
  if (target.label) url.searchParams.set("q", target.label);
  return url.toString();
}

export type NavApp = "google" | "apple";

export function navUrlFor(app: NavApp, target: NavTarget): string {
  return app === "apple" ? appleMapsUrl(target) : googleMapsUrl(target);
}
