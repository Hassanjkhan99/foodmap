import { destinationPoint, type GeoPoint, type LocationSample } from "@foodmap/domain";

export interface DriveLeg {
  /** bearing to travel on this leg, degrees */
  readonly bearingDeg: number;
  /** ground speed, m/s */
  readonly speedMps: number;
  /** number of samples on this leg */
  readonly steps: number;
}

export interface SimulatedDriveOptions {
  readonly start: GeoPoint;
  readonly legs: readonly DriveLeg[];
  /** time between samples, ms */
  readonly intervalMs: number;
  /** reported accuracy, metres */
  readonly accuracyM: number;
  /** epoch ms of the first sample (injected for determinism) */
  readonly startTime: number;
  /** include device speed/heading in the samples */
  readonly reportSpeed?: boolean;
  readonly reportHeading?: boolean;
}

/**
 * Deterministic, pure simulated location driver. Produces a fixed list of
 * `LocationSample`s from a start point and a sequence of legs — no timers, no
 * randomness, no Date.now. Used by the app's simulator and by CI in place of a
 * real geolocation watcher.
 */
export function simulateDrive(opts: SimulatedDriveOptions): LocationSample[] {
  const samples: LocationSample[] = [];
  let point = opts.start;
  let t = opts.startTime;
  // Emit the starting fix first.
  samples.push(sampleAt(point, t, opts, undefined));
  for (const leg of opts.legs) {
    const perStepM = leg.speedMps * (opts.intervalMs / 1000);
    for (let i = 0; i < leg.steps; i++) {
      point = destinationPoint(point, leg.bearingDeg, perStepM);
      t += opts.intervalMs;
      samples.push(sampleAt(point, t, opts, leg));
    }
  }
  return samples;
}

function sampleAt(
  point: GeoPoint,
  timestamp: number,
  opts: SimulatedDriveOptions,
  leg: DriveLeg | undefined,
): LocationSample {
  return {
    point,
    timestamp,
    accuracyM: opts.accuracyM,
    ...(opts.reportSpeed && leg ? { speedMps: leg.speedMps } : {}),
    ...(opts.reportHeading && leg ? { headingDeg: leg.bearingDeg } : {}),
  };
}

/** A ready-made straight eastbound drive (the canonical happy-path scenario). */
export function straightEastbound(start: GeoPoint, startTime = 0): LocationSample[] {
  return simulateDrive({
    start,
    startTime,
    intervalMs: 1000,
    accuracyM: 6,
    legs: [{ bearingDeg: 90, speedMps: 14, steps: 10 }], // ~50 km/h
  });
}
