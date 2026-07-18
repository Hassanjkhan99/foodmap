import type { AnalyticsEvent, AnalyticsSink } from "../ports.js";

const FORBIDDEN_KEYS = new Set([
  "lat",
  "lng",
  "latitude",
  "longitude",
  "coord",
  "coords",
  "address",
  "name",
  "polyline",
  "destination",
  "phone",
  "email",
]);

/**
 * In-memory analytics sink. Enforces the privacy rule at the boundary: any
 * event carrying a forbidden key (coordinates, names, addresses, etc.) is
 * dropped rather than stored. Recording never throws — analytics must never
 * block discovery or navigation.
 */
export class MemoryAnalyticsSink implements AnalyticsSink {
  readonly events: AnalyticsEvent[] = [];
  readonly dropped: AnalyticsEvent[] = [];

  async record(events: readonly AnalyticsEvent[]): Promise<void> {
    for (const e of events) {
      if (this.isSafe(e)) this.events.push(e);
      else this.dropped.push(e);
    }
  }

  private isSafe(e: AnalyticsEvent): boolean {
    if (!e.props) return true;
    for (const key of Object.keys(e.props)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) return false;
    }
    return true;
  }
}
