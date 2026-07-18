import type { Heading, LocationSample } from "../types.js";
import { bearingDeg, haversineM } from "../geo/distance.js";
import { circularConcentration, circularMeanDeg } from "../geo/angles.js";

export interface HeadingEstimatorOptions {
  /** how many recent derived bearings to retain */
  readonly window: number;
  /**
   * A displacement is only trusted as a heading source when it exceeds
   * `accuracyFactor` × the worse of the two samples' accuracy.
   */
  readonly accuracyFactor: number;
  /** minimum absolute displacement (metres) to derive a bearing at all */
  readonly minDisplacementM: number;
}

const DEFAULTS: HeadingEstimatorOptions = {
  window: 6,
  accuracyFactor: 1.5,
  minDisplacementM: 8,
};

interface Derived {
  readonly deg: number;
  readonly weight: number;
}

/**
 * Accuracy-aware heading estimator with circular smoothing.
 *
 * Heading is derived from displacement between successive samples, but only
 * when that displacement is large relative to GPS accuracy — this prevents
 * stationary GPS drift from producing a phantom heading. Confidence combines
 * how tightly recent bearings agree (circular concentration) with how much
 * evidence has accumulated.
 */
export class HeadingEstimator {
  private readonly opts: HeadingEstimatorOptions;
  private last: LocationSample | null = null;
  private derived: Derived[] = [];

  constructor(options?: Partial<HeadingEstimatorOptions>) {
    this.opts = { ...DEFAULTS, ...options };
  }

  reset(): void {
    this.last = null;
    this.derived = [];
  }

  /** Feed a sample; returns the current best heading estimate, or null. */
  update(sample: LocationSample): Heading | null {
    const prev = this.last;
    this.last = sample;
    if (prev) {
      const displacement = haversineM(prev.point, sample.point);
      const accuracyGate = Math.max(prev.accuracyM, sample.accuracyM) * this.opts.accuracyFactor;
      if (displacement >= this.opts.minDisplacementM && displacement >= accuracyGate) {
        // Weight by how far above the accuracy gate we are (more trust).
        const weight = displacement / Math.max(1, accuracyGate);
        this.derived.push({ deg: bearingDeg(prev.point, sample.point), weight });
        if (this.derived.length > this.opts.window) this.derived.shift();
      }
    }
    return this.current();
  }

  current(): Heading | null {
    if (this.derived.length === 0) return null;
    const bearings = this.derived.map((d) => d.deg);
    const weights = this.derived.map((d) => d.weight);
    const mean = circularMeanDeg(bearings, weights);
    if (mean === null) return null;
    const concentration = circularConcentration(bearings, weights);
    // Ramp evidence in over the window so a single sample isn't over-trusted.
    const evidence = Math.min(1, this.derived.length / this.opts.window);
    return { deg: mean, confidence: clamp01(concentration * evidence) };
  }
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
