import { describe, it, expect } from "vitest";
import {
  HeadingEstimator,
  MotionEstimator,
  angularSeparationDeg,
  buildRoute,
  discover,
  projectOntoRoute,
  type Heading,
  type MotionContext,
} from "@foodmap/domain";
import {
  DISCOVERY_SCENARIOS,
  MOTION_SCENARIOS,
  SCENARIO_LIBRARY_VERSION,
} from "../src/scenarios.js";

function runMotion(samples: MotionScenarioSamples): { heading: Heading | null; motion: MotionContext } {
  const he = new HeadingEstimator();
  const me = new MotionEstimator();
  let heading: Heading | null = null;
  let motion: MotionContext = "unknown";
  for (const s of samples) {
    heading = he.update(s);
    motion = me.update(s);
  }
  return { heading, motion };
}
type MotionScenarioSamples = (typeof MOTION_SCENARIOS)[number]["samples"];

describe(`simulator scenario library v${SCENARIO_LIBRARY_VERSION}`, () => {
  it("exposes a stable set of scenarios", () => {
    expect(MOTION_SCENARIOS.length).toBeGreaterThanOrEqual(9);
    expect(DISCOVERY_SCENARIOS.length).toBeGreaterThanOrEqual(6);
    const ids = [...MOTION_SCENARIOS, ...DISCOVERY_SCENARIOS].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length); // unique ids
  });

  describe("motion scenarios", () => {
    for (const scenario of MOTION_SCENARIOS) {
      it(scenario.id, () => {
        const { heading, motion } = runMotion(scenario.samples);
        for (const exp of scenario.expect) {
          if (exp.kind === "heading") {
            expect(heading, "heading should be known").not.toBeNull();
            expect(heading!.confidence).toBeGreaterThanOrEqual(exp.minConfidence);
            expect(angularSeparationDeg(heading!.deg, exp.aboutDeg)).toBeLessThan(15);
          } else if (exp.kind === "heading_unknown") {
            expect(heading).toBeNull();
          } else {
            expect(motion).toBe(exp.value);
          }
        }
        // Route sanity: projection stays within the route.
        if (scenario.route) {
          const route = buildRoute(scenario.route);
          const proj = projectOntoRoute(route, scenario.samples.at(-1)!.point);
          expect(proj.alongM).toBeGreaterThanOrEqual(0);
          expect(proj.alongM).toBeLessThanOrEqual(route.lengthM + 1);
        }
      });
    }
  });

  describe("discovery scenarios", () => {
    for (const scenario of DISCOVERY_SCENARIOS) {
      it(scenario.id, () => {
        for (const [i, step] of scenario.steps.entries()) {
          const result = discover(scenario.venues, {
            location: step.location,
            heading: step.heading,
            resultLimit: scenario.resultLimit ?? 5,
          });
          const ids = result.candidates.map((c) => c.venue.id);
          for (const id of step.expectPresent ?? []) {
            expect(ids, `${scenario.id} step ${i}: expected ${id} present`).toContain(id);
          }
          for (const id of step.expectAbsent ?? []) {
            expect(ids, `${scenario.id} step ${i}: expected ${id} absent`).not.toContain(id);
          }
          if (step.expectStatus) {
            expect(result.status, `${scenario.id} step ${i} status`).toBe(step.expectStatus);
          }
        }
      });
    }
  });
});
