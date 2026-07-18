"use client";

import type { OpenState, SourceType } from "@foodmap/domain";

const SOURCE_LABEL: Record<SourceType, string> = {
  foodmap: "FoodMap",
  merchant: "Merchant",
  delivery_linked: "Order-linked",
  provider: "External",
  mixed: "Merchant + external",
  unknown: "Unknown source",
};

export function StatusPill({ state, opensAtLabel }: { state: OpenState; opensAtLabel?: string | null }) {
  const color =
    state === "open" ? "var(--status-open)" : state === "closed" ? "var(--status-closed)" : "var(--status-unknown)";
  // Never color-only: always an icon glyph + text label.
  const glyph = state === "open" ? "●" : state === "closed" ? "◌" : "?";
  const label = state === "open" ? "Open" : state === "closed" ? (opensAtLabel ?? "Closed") : "Hours unknown";
  return (
    <span data-testid="status-pill" style={{ color, fontWeight: 600, fontSize: 14 }}>
      <span aria-hidden>{glyph}</span> {label}
    </span>
  );
}

export function SourceBadge({ source }: { source: SourceType }) {
  return (
    <span
      data-testid="source-badge"
      style={{
        fontSize: 12,
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "2px 8px",
      }}
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function distanceLabel(distanceM: number): string {
  return distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km ahead` : `${Math.round(distanceM)} m ahead`;
}
