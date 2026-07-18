"use client";

import type { ClientCandidate } from "../lib/graphql.js";
import { SourceBadge, StatusPill } from "./ui.js";
import { aheadLabel, heroGradient, isRich } from "../design/system.js";

interface Props {
  candidate: ClientCandidate;
  presentation: string;
  onClose: () => void;
}

/**
 * Venue decision sheet. Compact while moving (name, distance, open, ≤2 actions);
 * richer when stationary/passenger (hero image, source badge, tags). Actions are
 * capability-driven — unsupported ones are omitted, never shown disabled.
 */
export function CompactVenueCard({ candidate: c, presentation, onClose }: Props) {
  const rich = isRich(presentation);
  const hasMenu = c.actions.some((a) => a.kind === "view_menu") && c.deliveryMenuUrl;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        background: "var(--glass-scrim)",
      }}
    >
      <section
        data-testid="venue-card"
        aria-label={`${c.name} details`}
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: "100%",
          maxWidth: 480,
          boxSizing: "border-box",
          borderRadius: "26px 26px 0 0",
          padding: "12px 20px 24px",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border)", margin: "0 auto 12px" }} />

        {rich && (
          <div style={{ position: "relative", height: 150, borderRadius: 18, overflow: "hidden", marginBottom: 12, backgroundImage: heroGradient(0) }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(10,9,6,0.55) 100%)" }} />
          </div>
        )}

        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h2 style={{ margin: 0, font: "700 20px/25px Inter, sans-serif", letterSpacing: "-0.01em" }}>{c.name}</h2>
            <span className="tabular" style={{ font: "700 16px ui-monospace, monospace", color: "var(--brand)", whiteSpace: "nowrap" }}>
              {aheadLabel(c.distanceM, c.aheadClass)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", font: "500 13px Inter, sans-serif" }}>
            <StatusPill state={c.openState} opensAtLabel={c.opensAtLabel} />
            <span style={{ color: "var(--text-secondary)" }}>{c.cuisines.slice(0, 3).join(" · ")}</span>
          </div>
          {c.distinguishingFact && (
            <p style={{ margin: 0, font: "400 13px/18px Inter, sans-serif", color: "var(--text-secondary)" }}>{c.distinguishingFact}</p>
          )}
          <div style={{ marginTop: 2 }}>
            <SourceBadge source={c.source} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <a data-testid="action-navigate" href={c.navGoogleUrl} target="_blank" rel="noreferrer" style={navBtn}>
            Navigate
          </a>
          {hasMenu && (
            <a data-testid="action-view-menu" href={c.deliveryMenuUrl!} target="_blank" rel="noreferrer" style={menuBtn}>
              View menu
            </a>
          )}
        </div>
        <button type="button" data-testid="venue-card-dismiss" onClick={onClose} style={dismiss}>
          Dismiss
        </button>
      </section>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  flex: 1,
  minHeight: 52,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--brand)",
  color: "var(--on-brand)",
  font: "700 15px Inter, sans-serif",
  borderRadius: 14,
  textDecoration: "none",
};
const menuBtn: React.CSSProperties = {
  ...navBtn,
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
};
const dismiss: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  border: "none",
  background: "transparent",
  color: "var(--text-secondary)",
  font: "600 13px Inter, sans-serif",
  cursor: "pointer",
};
