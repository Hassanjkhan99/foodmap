"use client";

import { useState } from "react";
import { useSession } from "../store/session.js";
import { AheadList } from "./AheadList.js";
import { MockMap } from "./MockMap.js";
import { CompactVenueCard } from "./CompactVenueCard.js";
import { DegradedBanner } from "./DegradedBanner.js";

type View = "ahead" | "map";

/** Active session shell: Map/Ahead toggle, banners, selection, Stop. */
export function SessionShell() {
  const [view, setView] = useState<View>("ahead");
  const candidates = useSession((s) => s.candidates);
  const selectedKey = useSession((s) => s.selectedKey);
  const status = useSession((s) => s.status);
  const motion = useSession((s) => s.motion);
  const acquiring = useSession((s) => s.acquiring);
  const hasHeading = useSession((s) => s.hasHeading);
  const headingConfidence = useSession((s) => s.headingConfidence);
  const select = useSession((s) => s.select);
  const stop = useSession((s) => s.stop);

  const selected = candidates.find((c) => c.key === selectedKey) ?? null;
  const bannerStatus = acquiring ? "ACQUIRING" : status;

  return (
    <div data-motion={motion} data-testid="session-shell" style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <header
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          position: "sticky",
          top: 8,
          zIndex: 10,
        }}
      >
        <div role="radiogroup" aria-label="View" style={{ display: "flex", gap: 4 }}>
          <ToggleBtn active={view === "ahead"} onClick={() => setView("ahead")} testid="view-ahead">
            Ahead
          </ToggleBtn>
          <ToggleBtn active={view === "map"} onClick={() => setView("map")} testid="view-map">
            Map
          </ToggleBtn>
        </div>
        <span data-testid="heading-state" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {hasHeading ? `heading ${Math.round(headingConfidence * 100)}%` : "heading —"}
        </span>
        <button type="button" data-testid="stop-btn" onClick={stop} style={stopBtn}>
          Stop
        </button>
      </header>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <DegradedBanner status={bannerStatus} />

        {view === "ahead" ? (
          <AheadList candidates={candidates} selectedKey={selectedKey} onSelect={select} />
        ) : (
          <MockMap center={null} candidates={candidates} selectedKey={selectedKey} onSelect={select} />
        )}

        {selected && <CompactVenueCard candidate={selected} onClose={() => select(null)} />}
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
  testid,
}: {
  active: boolean;
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
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: active ? "var(--brand)" : "transparent",
        color: active ? "var(--on-brand)" : "var(--text-primary)",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const stopBtn: React.CSSProperties = {
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
  fontWeight: 600,
  cursor: "pointer",
};
