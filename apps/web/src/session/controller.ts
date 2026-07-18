import {
  HeadingEstimator,
  MotionEstimator,
  presentationContextFor,
  type GeoPoint,
  type Heading,
  type LocationSample,
  type MotionContext,
  type PresentationContext,
} from "@foodmap/domain";
import { discover as defaultDiscover, type ClientCandidate, type ClientDiscoverPayload, type DiscoverArgs } from "../lib/graphql.js";
import type { LocationSource, StopFn } from "./sources.js";

export interface SessionSnapshot {
  readonly running: boolean;
  readonly acquiring: boolean;
  readonly status: string;
  readonly warnings: readonly string[];
  readonly candidates: readonly ClientCandidate[];
  readonly motion: MotionContext;
  readonly presentation: PresentationContext;
  readonly headingConfidence: number;
  readonly hasHeading: boolean;
  readonly location: GeoPoint | null;
  readonly selectedKey: string | null;
}

export type DiscoverFn = (args: DiscoverArgs, opts?: { signal?: AbortSignal }) => Promise<ClientDiscoverPayload>;

export interface ControllerOptions {
  readonly sessionId: string;
  readonly onState: (snapshot: SessionSnapshot) => void;
  readonly discoverFn?: DiscoverFn;
  readonly explicitPassenger?: boolean;
}

export const INITIAL_SNAPSHOT: SessionSnapshot = {
  running: false,
  acquiring: false,
  status: "IDLE",
  warnings: [],
  candidates: [],
  motion: "unknown",
  presentation: "unknown_compact",
  headingConfidence: 0,
  hasHeading: false,
  location: null,
  selectedKey: null,
};

/**
 * Drives a discovery session: subscribes to a LocationSource, updates the
 * heading + motion estimators, and coalesces discovery calls (never one request
 * per GPS sample). stop() tears down the watcher, aborts in-flight requests,
 * and clears pending work — the Phase-1 cleanup guarantee.
 */
export class SessionController {
  private readonly opts: ControllerOptions;
  private readonly discoverFn: DiscoverFn;
  private heading = new HeadingEstimator();
  private motion = new MotionEstimator();
  private stopSource: StopFn | null = null;
  private abort: AbortController | null = null;
  private inFlight = false;
  private pending = false;
  private selectionVersion = 0;
  private snapshot: SessionSnapshot = INITIAL_SNAPSHOT;

  constructor(opts: ControllerOptions) {
    this.opts = opts;
    this.discoverFn = opts.discoverFn ?? ((a, o) => defaultDiscover(a, o));
  }

  getSnapshot(): SessionSnapshot {
    return this.snapshot;
  }

  start(source: LocationSource): void {
    this.stop(); // idempotent; ensures a single watcher
    this.heading = new HeadingEstimator();
    this.motion = new MotionEstimator();
    this.selectionVersion = 0;
    this.patch({ ...INITIAL_SNAPSHOT, running: true, acquiring: true, status: "ACQUIRING" });
    this.stopSource = source.start(
      (sample) => this.onSample(sample),
      (reason) => this.patch({ status: reason === "unsupported" ? "GEOLOCATION_UNAVAILABLE" : "DEGRADED_GPS_ACCURACY" }),
    );
  }

  select(key: string | null): void {
    this.patch({ selectedKey: key });
  }

  stop(): void {
    this.stopSource?.();
    this.stopSource = null;
    this.abort?.abort();
    this.abort = null;
    this.inFlight = false;
    this.pending = false;
    if (this.snapshot.running || this.snapshot.acquiring) {
      this.patch({ running: false, acquiring: false, status: "SESSION_STOPPED" });
    }
  }

  private onSample(sample: LocationSample): void {
    const heading: Heading | null = this.heading.update(sample);
    const motion = this.motion.update(sample);
    this.patch({
      acquiring: false,
      location: sample.point,
      motion,
      presentation: presentationContextFor(motion, this.opts.explicitPassenger ?? false),
      headingConfidence: heading?.confidence ?? 0,
      hasHeading: heading !== null,
    });
    void this.runDiscovery(sample.point, heading);
  }

  private async runDiscovery(location: GeoPoint, heading: Heading | null): Promise<void> {
    if (this.inFlight) {
      this.pending = true;
      return;
    }
    this.inFlight = true;
    this.abort = new AbortController();
    const args: DiscoverArgs = {
      lat: location.lat,
      lng: location.lng,
      sessionId: this.opts.sessionId,
      selectionVersion: this.selectionVersion,
      ...(heading ? { headingDeg: heading.deg, headingConfidence: heading.confidence } : {}),
    };
    try {
      const payload = await this.discoverFn(args, { signal: this.abort.signal });
      this.selectionVersion = payload.selectionVersion;
      this.patch({
        status: payload.status,
        warnings: payload.warnings,
        candidates: payload.candidates,
        selectedKey: this.reconcileSelection(payload.candidates),
      });
    } catch {
      // Aborted or failed — keep last trustworthy state; do not crash the session.
    } finally {
      this.inFlight = false;
      if (this.pending && this.snapshot.running) {
        this.pending = false;
        void this.runDiscovery(location, heading);
      }
    }
  }

  /** Keep the current selection if the venue is still present (stable key), else clear it. */
  private reconcileSelection(candidates: readonly ClientCandidate[]): string | null {
    const cur = this.snapshot.selectedKey;
    if (cur && candidates.some((c) => c.key === cur)) return cur;
    return null;
  }

  private patch(part: Partial<SessionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...part };
    this.opts.onState(this.snapshot);
  }
}
