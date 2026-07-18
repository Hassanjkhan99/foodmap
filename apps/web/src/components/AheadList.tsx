"use client";

import type { ClientCandidate } from "../lib/graphql.js";
import { StatusPill, distanceLabel } from "./ui.js";

interface Props {
  candidates: readonly ClientCandidate[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * Ahead view — chronological list of upcoming venues. Fully usable without a
 * map. Rows update in place; selection is shared with the map via `key`.
 */
export function AheadList({ candidates, selectedKey, onSelect }: Props) {
  return (
    <ul
      data-testid="ahead-list"
      aria-label="Restaurants ahead"
      style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}
    >
      {candidates.map((c) => {
        const selected = c.key === selectedKey;
        return (
          <li key={c.key}>
            <button
              type="button"
              data-testid="ahead-row"
              data-venue={c.name}
              aria-pressed={selected}
              onClick={() => onSelect(c.key)}
              className="glass"
              style={{
                width: "100%",
                textAlign: "left",
                minHeight: 56,
                padding: "12px 16px",
                border: selected ? "2px solid var(--brand)" : "1px solid var(--border)",
                borderRadius: 16,
                background: "var(--surface)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "grid",
                gap: 4,
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 18 }}>{c.name}</strong>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                  {distanceLabel(c.distanceM)}
                </span>
              </span>
              <span style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}>
                <StatusPill state={c.openState} opensAtLabel={c.opensAtLabel} />
                <span style={{ color: "var(--text-secondary)" }}>{c.cuisines.slice(0, 2).join(" · ")}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
