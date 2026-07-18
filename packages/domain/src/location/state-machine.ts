/**
 * Foreground location state machine (pure reducer). Side effects (the actual
 * geolocation watcher, timers) live in the app layer; this module owns the
 * transition logic so it is deterministically testable. See ADR-0006.
 */

export type LocationState =
  | "idle"
  | "checkingPermission"
  | "permissionRequired"
  | "acquiring"
  | "tracking"
  | "degraded"
  | "denied"
  | "unsupported"
  | "paused"
  | "stopped";

export type PermissionResult = "granted" | "denied" | "prompt";

export type LocationEvent =
  /** user explicitly asked to begin (the only thing that may trigger a prompt) */
  | { readonly type: "START" }
  | { readonly type: "GEOLOCATION_UNSUPPORTED" }
  | { readonly type: "PERMISSION_RESULT"; readonly result: PermissionResult }
  /** a validated sample of acceptable accuracy arrived */
  | { readonly type: "GOOD_SAMPLE" }
  /** samples are arriving but accuracy is too poor to trust */
  | { readonly type: "POOR_ACCURACY" }
  | { readonly type: "PAUSE" }
  | { readonly type: "RESUME" }
  | { readonly type: "STOP" };

/** Side-effect intents the app layer must perform after a transition. */
export type LocationEffect =
  | "request_permission"
  | "start_watcher"
  | "stop_watcher"
  | "none";

export interface Transition {
  readonly state: LocationState;
  readonly effect: LocationEffect;
}

/**
 * Pure transition. STOP always wins and always tears the watcher down —
 * the app layer must clear the watcher, timers, and in-flight requests on
 * seeing `stop_watcher`.
 */
export function locationReducer(state: LocationState, event: LocationEvent): Transition {
  if (event.type === "STOP") {
    return { state: "stopped", effect: "stop_watcher" };
  }
  if (event.type === "GEOLOCATION_UNSUPPORTED") {
    return { state: "unsupported", effect: "none" };
  }

  switch (state) {
    case "idle":
    case "stopped":
      if (event.type === "START") return { state: "checkingPermission", effect: "none" };
      return keep(state);

    case "checkingPermission":
      if (event.type === "PERMISSION_RESULT") {
        switch (event.result) {
          case "granted":
            return { state: "acquiring", effect: "start_watcher" };
          case "prompt":
            return { state: "permissionRequired", effect: "request_permission" };
          case "denied":
            return { state: "denied", effect: "none" };
        }
      }
      return keep(state);

    case "permissionRequired":
      if (event.type === "PERMISSION_RESULT") {
        if (event.result === "granted") return { state: "acquiring", effect: "start_watcher" };
        if (event.result === "denied") return { state: "denied", effect: "none" };
      }
      return keep(state);

    case "acquiring":
      if (event.type === "GOOD_SAMPLE") return { state: "tracking", effect: "none" };
      if (event.type === "POOR_ACCURACY") return { state: "degraded", effect: "none" };
      if (event.type === "PAUSE") return { state: "paused", effect: "stop_watcher" };
      return keep(state);

    case "tracking":
      if (event.type === "POOR_ACCURACY") return { state: "degraded", effect: "none" };
      if (event.type === "PAUSE") return { state: "paused", effect: "stop_watcher" };
      return keep(state);

    case "degraded":
      if (event.type === "GOOD_SAMPLE") return { state: "tracking", effect: "none" };
      if (event.type === "PAUSE") return { state: "paused", effect: "stop_watcher" };
      return keep(state);

    case "paused":
      if (event.type === "RESUME") return { state: "acquiring", effect: "start_watcher" };
      return keep(state);

    case "denied":
      // Never auto re-prompt. Only an explicit START may retry.
      if (event.type === "START") return { state: "checkingPermission", effect: "none" };
      return keep(state);

    case "unsupported":
      return keep(state);

    default:
      return keep(state);
  }
}

function keep(state: LocationState): Transition {
  return { state, effect: "none" };
}

/** Whether a watcher should currently be running in this state. */
export function watcherActive(state: LocationState): boolean {
  return state === "acquiring" || state === "tracking" || state === "degraded";
}
