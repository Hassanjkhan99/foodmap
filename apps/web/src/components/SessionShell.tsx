"use client";

import { useState } from "react";
import { useSession } from "../store/session.js";
import { AheadList } from "./AheadList.js";
import { MockMap } from "./MockMap.js";
import { CompactVenueCard } from "./CompactVenueCard.js";
import { DegradedBanner } from "./DegradedBanner.js";

type View = "ahead" | "map";

const FILTER_CHIPS = ["Open now", "Cuisine", "Under 15 min"];

/** Active session shell: radar chrome with Map/Ahead, banners, selection, Stop. */
export function SessionShell() {
  const [view, setView] = useState<View>("ahead");
  const candidates = useSession((s) => s.candidates);
  const selectedKey = useSession((s) => s.selectedKey);
  const status = useSession((s) => s.status);
  const motion = useSession((s) => s.motion);
  const presentation = useSession((s) => s.presentation);
  const acquiring = useSession((s) => s.acquiring);
  const hasHeading = useSession((s) => s.hasHeading);
  const headingConfidence = useSession((s) => s.headingConfidence);
  const select = useSession((s) => s.select);
  const stop = useSession((s) => s.stop);

  const selected = candidates.find((c) => c.key === selectedKey) ?? null;
  const bannerStatus = acquiring ? "ACQUIRING" : status;
  const moving = motion === "moving" || motion === "slow";

  return (
    <div
      data-motion={motion}
      data-testid="session-shell"
      className="ambient"
      style={{
        position: "relative",
        minHeight: "100dvh",
        maxWidth: 480,
        margin: "0 auto",
        overflow: "hidden",
      }}
    >
      {/* Filter chips (visual; full filter wiring is a later pass). */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          zIndex: 9,
          display: "flex",
          gap: 8,
          padding: "0 14px",
          overflowX: "auto",
        }}
      >
        {FILTER_CHIPS.map((label) => (
          <span
            key={label}
            className="glass"
            style={{
              padding: moving ? "11px 18px" : "8px 15px",
              borderRadius: 999,
              font: moving ? "700 14px Inter, sans-serif" : "600 12.5px Inter, sans-serif",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Content: Map or Ahead. */}
      <div style={{ position: "absolute", inset: 0, top: 60, bottom: 92, overflowY: "auto" }}>
        <div style={{ padding: "8px 0 4px" }}>
          <DegradedBanner status={bannerStatus} />
        </div>
        {view === "ahead" ? (
          <AheadList
            candidates={candidates}
            selectedKey={selectedKey}
            presentation={presentation}
            onSelect={select}
          />
        ) : (
          <div style={{ padding: "8px 14px" }}>
            <MockMap center={null} candidates={candidates} selectedKey={selectedKey} onSelect={select} />
          </div>
        )}
      </div>

      {/* Bottom glass control bar. */}
      <div style={{ position: "absolute", left: 10, right: 10, bottom: moving ? 24 : 16, zIndex: 10 }}>
        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 22,
          }}
        >
          <div role="radiogroup" aria-label="View" style={{ display: "flex", gap: 2, padding: 3, borderRadius: 999, background: "color-mix(in srgb, var(--text-primary) 6%, transparent)" }}>
            <ToggleBtn active={view === "ahead"} moving={moving} onClick={() => setView("ahead")} testid="view-ahead">
              Ahead
            </ToggleBtn>
            <ToggleBtn active={view === "map"} moving={moving} onClick={() => setView("map")} testid="view-map">
              Map
            </ToggleBtn>
          </div>
          <span data-testid="heading-state" style={{ font: "500 11px Inter, sans-serif", color: "var(--text-secondary)" }}>
            {hasHeading ? `heading ${Math.round(headingConfidence * 100)}%` : "heading —"}
          </span>
          <button type="button" data-testid="stop-btn" onClick={stop} style={stopBtn}>
            Stop
          </button>
        </div>
      </div>

      {selected && <CompactVenueCard candidate={selected} presentation={presentation} onClose={() => select(null)} />}
    </div>
  );
}

function ToggleBtn({
  active,
  moving,
  onClick,
  children,
  testid,
}: {
  active: boolean;
  moving: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-testid={testid}
      onClick={onClick}
      style={{
        minHeight: moving ? 44 : 36,
        padding: moving ? "0 18px" : "0 16px",
        borderRadius: 999,
        border: "none",
        background: active ? "var(--brand)" : "transparent",
        color: active ? "var(--on-brand)" : "var(--text-secondary)",
        font: moving ? "700 15px Inter, sans-serif" : "600 13px Inter, sans-serif",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const stopBtn: React.CSSProperties = {
  minHeight: 44,
  padding: "0 12px",
  border: "none",
  background: "transparent",
  color: "var(--status-error)",
  font: "700 13px Inter, sans-serif",
  cursor: "pointer",
};
