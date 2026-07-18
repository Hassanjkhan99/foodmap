"use client";

import type { ClientCandidate } from "../lib/graphql.js";
import { SourceBadge, StatusPill, distanceLabel } from "./ui.js";

interface Props {
  candidate: ClientCandidate;
  onClose: () => void;
}

/**
 * Compact venue card (moving context). Name, distance, cuisine, open state, and
 * only the actions the venue actually supports (capability-driven — unsupported
 * actions are omitted, never shown disabled). Solid surface, not glass.
 */
export function CompactVenueCard({ candidate: c, onClose }: Props) {
  const hasMenu = c.actions.some((a) => a.kind === "view_menu") && c.deliveryMenuUrl;
  return (
    <section
      data-testid="venue-card"
      aria-label={`${c.name} details`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 4px 12px rgba(20,19,15,0.12)",
        display: "grid",
        gap: 12,
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{c.name}</h2>
          <div style={{ marginTop: 4, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
              {distanceLabel(c.distanceM)}
            </span>
            <StatusPill state={c.openState} opensAtLabel={c.opensAtLabel} />
          </div>
        </div>
        <button type="button" aria-label="Close" onClick={onClose} style={iconBtn}>
          ✕
        </button>
      </header>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <SourceBadge source={c.source} />
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>{c.cuisines.slice(0, 3).join(" · ")}</span>
      </div>
      {c.distinguishingFact && (
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-primary)" }}>{c.distinguishingFact}</p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a data-testid="action-navigate" href={c.navGoogleUrl} target="_blank" rel="noreferrer" style={primaryBtn}>
          Navigate
        </a>
        {hasMenu && (
          <a data-testid="action-view-menu" href={c.deliveryMenuUrl!} target="_blank" rel="noreferrer" style={secondaryBtn}>
            View menu
          </a>
        )}
      </div>
    </section>
  );
}

const iconBtn: React.CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  border: "none",
  background: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
  fontSize: 18,
};
const primaryBtn: React.CSSProperties = {
  minHeight: 56,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 20px",
  borderRadius: 999,
  background: "var(--brand)",
  color: "var(--on-brand)",
  fontWeight: 600,
  textDecoration: "none",
};
const secondaryBtn: React.CSSProperties = {
  ...primaryBtn,
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
};
