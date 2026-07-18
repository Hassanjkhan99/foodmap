import type { LocationSample } from "@foodmap/domain";

export type SampleHandler = (sample: LocationSample) => void;
export type StopFn = () => void;

/** A source of location samples. Returns a stop() that must tear everything down. */
export interface LocationSource {
  start(onSample: SampleHandler, onError?: (reason: string) => void): StopFn;
}

/** Real browser geolocation watcher (foreground only, one watcher). */
export function browserGeolocationSource(): LocationSource {
  return {
    start(onSample, onError) {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        onError?.("unsupported");
        return () => {};
      }
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const s: LocationSample = {
            point: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            timestamp: pos.timestamp,
            accuracyM: pos.coords.accuracy,
            ...(pos.coords.speed != null ? { speedMps: pos.coords.speed } : {}),
            ...(pos.coords.heading != null && !Number.isNaN(pos.coords.heading)
              ? { headingDeg: pos.coords.heading }
              : {}),
          };
          onSample(s);
        },
        (err) => onError?.(err.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
      );
      return () => navigator.geolocation.clearWatch(id);
    },
  };
}

/**
 * Simulated source: replays a fixed list of samples on a timer. Used by the
 * in-app simulator and Playwright — no real geolocation needed. The first
 * sample fires immediately so the UI leaves "acquiring" deterministically.
 */
export function simulatedSource(samples: readonly LocationSample[], intervalMs = 300): LocationSource {
  return {
    start(onSample) {
      let i = 0;
      let timer: ReturnType<typeof setInterval> | undefined;
      const tick = () => {
        if (i >= samples.length) {
          if (timer) clearInterval(timer);
          return;
        }
        onSample(samples[i]!);
        i += 1;
      };
      tick(); // emit the first fix immediately
      timer = setInterval(tick, intervalMs);
      return () => {
        if (timer) clearInterval(timer);
      };
    },
  };
}
