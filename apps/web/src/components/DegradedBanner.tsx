"use client";

const MESSAGES: Record<string, string> = {
  DEGRADED_HEADING_UNKNOWN: "Getting your direction — showing everything nearby for now.",
  DEGRADED_GPS_ACCURACY: "Weak GPS — showing your last good results.",
  GEOLOCATION_UNAVAILABLE: "Location isn't available — try the simulated demo.",
  NO_RESULTS: "Nothing worth stopping for just ahead. Keep going, or widen your search.",
  ALL_FILTERED: "Your filters hid everything ahead. Relax a filter to see more.",
  FEATURE_DISABLED: "This is temporarily unavailable.",
  ACQUIRING: "Finding you…",
};

/** One-line degraded/status banner. role=status so it announces without stealing focus. */
export function DegradedBanner({ status }: { status: string }) {
  const message = MESSAGES[status];
  if (!message) return null;
  return (
    <div
      data-testid="degraded-banner"
      role="status"
      className="glass"
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
