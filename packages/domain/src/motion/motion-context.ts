import type { LocationSample, MotionContext } from "../types.js";
import { haversineM } from "../geo/distance.js";

export interface MotionThresholds {
  /** below this speed (m/s) → stationary */
  readonly stationaryMax: number;
  /** below this speed (m/s) → slow (walking/cycling); above → moving */
  readonly slowMax: number;
  /** hysteresis margin (m/s) applied to avoid flapping at boundaries */
  readonly margin: number;
}

const DEFAULTS: MotionThresholds = {
  stationaryMax: 0.7, // ~2.5 km/h
  slowMax: 2.5, // ~9 km/h
  margin: 0.4,
};

/**
 * Motion-state estimator with hysteresis. Prefers device-reported speed; if
 * absent, derives speed from displacement/time between samples. Never asserts
 * that the user is the driver — this is motion truth only.
 */
export class MotionEstimator {
  private readonly t: MotionThresholds;
  private last: LocationSample | null = null;
  private state: MotionContext = "unknown";

  constructor(thresholds?: Partial<MotionThresholds>) {
    this.t = { ...DEFAULTS, ...thresholds };
  }

  reset(): void {
    this.last = null;
    this.state = "unknown";
  }

  get value(): MotionContext {
    return this.state;
  }

  update(sample: LocationSample): MotionContext {
    const speed = this.speedFor(sample);
    this.last = sample;
    if (speed === null) return this.state; // keep last known; stay unknown until evidence
    this.state = this.applyHysteresis(speed);
    return this.state;
  }

  private speedFor(sample: LocationSample): number | null {
    if (typeof sample.speedMps === "number" && sample.speedMps >= 0) {
      return sample.speedMps;
    }
    const prev = this.last;
    if (!prev) return null;
    const dt = (sample.timestamp - prev.timestamp) / 1000;
    if (dt <= 0) return null;
    const dist = haversineM(prev.point, sample.point);
    // Ignore sub-accuracy jitter so drift doesn't read as motion.
    if (dist < Math.max(prev.accuracyM, sample.accuracyM)) return 0;
    return dist / dt;
  }

  private applyHysteresis(speed: number): MotionContext {
    const { stationaryMax, slowMax, margin } = this.t;
    switch (this.state) {
      case "stationary":
        if (speed > stationaryMax + margin) return speed > slowMax + margin ? "moving" : "slow";
        return "stationary";
      case "slow":
        if (speed > slowMax + margin) return "moving";
        if (speed < stationaryMax - margin) return "stationary";
        return "slow";
      case "moving":
        if (speed < slowMax - margin) return speed < stationaryMax - margin ? "stationary" : "slow";
        return "moving";
      case "unknown":
      default:
        if (speed > slowMax) return "moving";
        if (speed > stationaryMax) return "slow";
        return "stationary";
    }
  }
}

/** Map motion + explicit passenger opt-in to a presentation context. */
export function presentationContextFor(
  motion: MotionContext,
  explicitPassenger: boolean,
): "moving_compact" | "unknown_compact" | "stationary_rich" | "passenger_rich" {
  if (explicitPassenger) return "passenger_rich";
  switch (motion) {
    case "moving":
    case "slow":
      return "moving_compact";
    case "stationary":
      return "stationary_rich";
    case "unknown":
    default:
      return "unknown_compact";
  }
}
