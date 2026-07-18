"use client";

import type { ClientCandidate } from "../lib/graphql.js";
import { StatusPill } from "./ui.js";
import { aheadLabel, heroGradient, heroPanel, isRich } from "../design/system.js";

interface Props {
  candidates: readonly ClientCandidate[];
  selectedKey: string | null;
  presentation: string;
  onSelect: (key: string) => void;
}

/**
 * Ahead view. Rich image-forward cards when stationary/passenger; compact rows
 * while moving/unknown. Rows update in place; selection shared with the map via
 * the stable `key`. Fully usable without a map.
 */
export function AheadList({ candidates, selectedKey, presentation, onSelect }: Props) {
  const rich = isRich(presentation);
  return (
    <ul
      data-testid="ahead-list"
      aria-label="Restaurants ahead"
      style={{ listStyle: "none", margin: 0, padding: rich ? "4px 0" : 0, display: "grid", gap: rich ? 14 : 0 }}
    >
      {candidates.map((c, i) =>
        rich ? (
          <li key={c.key} style={{ margin: "0 14px" }}>
            <RichCard candidate={c} index={i} selected={c.key === selectedKey} onSelect={onSelect} />
          </li>
        ) : (
          <li key={c.key}>
            <CompactRow candidate={c} selected={c.key === selectedKey} onSelect={onSelect} />
          </li>
        ),
      )}
    </ul>
  );
}

function CompactRow({
  candidate: c,
  selected,
  onSelect,
}: {
  candidate: ClientCandidate;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      data-testid="ahead-row"
      data-venue={c.name}
      aria-pressed={selected}
      onClick={() => onSelect(c.key)}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: 56,
        padding: "14px 16px",
        border: "none",
        borderBottom: "1px solid var(--border)",
        borderLeft: selected ? "3px solid var(--brand)" : "3px solid transparent",
        background: "var(--bg)",
        color: "var(--text-primary)",
        cursor: "pointer",
      }}
    >
      <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 2 }}>
        <span style={{ font: "700 20px/1.25 Inter, sans-serif" }}>{c.name}</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center", font: "500 13px Inter, sans-serif" }}>
          <StatusPill state={c.openState} opensAtLabel={c.opensAtLabel} />
          <span style={{ color: "var(--text-secondary)" }}>{c.cuisines.slice(0, 2).join(" · ")}</span>
        </span>
      </span>
      <span className="tabular" style={{ font: "700 18px ui-monospace, monospace", color: "var(--brand)", flexShrink: 0 }}>
        {aheadLabel(c.distanceM, c.aheadClass)}
      </span>
    </button>
  );
}

function RichCard({
  candidate: c,
  index,
  selected,
  onSelect,
}: {
  candidate: ClientCandidate;
  index: number;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const linked = c.actions.some((a) => a.kind === "view_menu") && c.deliveryMenuUrl;
  return (
    <button
      type="button"
      data-testid="ahead-row"
      data-venue={c.name}
      aria-pressed={selected}
      onClick={() => onSelect(c.key)}
      style={{
        position: "relative",
        width: "100%",
        height: 262,
        borderRadius: 20,
        overflow: "hidden",
        border: selected ? "2px solid var(--brand)" : "none",
        padding: 0,
        cursor: "pointer",
        boxShadow: "0 10px 26px rgba(20,19,15,0.18)",
      }}
    >
      <span style={{ position: "absolute", inset: 0, backgroundImage: heroGradient(index) }} />
      <span style={{ position: "absolute", top: 10, left: 10, zIndex: 3 }}>
        <span className="frost-chip" style={{ padding: "5px 10px", borderRadius: 999, font: "600 11.5px Inter, sans-serif", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: c.openState === "open" ? "#7CE0A6" : "#D8D4C9" }} />
          {c.openState === "open" ? "Open" : c.openState === "closed" ? (c.opensAtLabel ?? "Closed") : "Hours unknown"}
        </span>
      </span>
      <span
        style={{
          ...heroPanel,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 158,
          padding: "11px 14px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 5,
          color: "#fff",
          textAlign: "left",
          borderRadius: "0 0 20px 20px",
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0, font: "700 18px/22px Inter, sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {c.name}
          </span>
          <span className="tabular" style={{ background: "rgba(232,88,12,0.85)", border: "1px solid rgba(255,255,255,0.3)", padding: "3px 9px", borderRadius: 999, font: "700 11px ui-monospace, monospace", color: "#fff", flexShrink: 0 }}>
            {aheadLabel(c.distanceM, c.aheadClass)}
          </span>
        </span>
        <span style={{ font: "500 12px Inter, sans-serif", color: "rgba(255,255,255,0.88)" }}>
          {c.cuisines.slice(0, 3).join(" · ")}
        </span>
        <span style={{ display: "flex", gap: 8, marginTop: 5 }}>
          <a
            data-testid="quick-navigate"
            href={c.navGoogleUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--brand)", color: "#fff", font: "700 12.5px Inter, sans-serif", padding: "8px 14px", borderRadius: 10, textDecoration: "none" }}
          >
            Navigate
          </a>
          {linked && (
            <a
              data-testid="quick-menu"
              href={c.deliveryMenuUrl!}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="frost-chip"
              style={{ font: "700 12.5px Inter, sans-serif", padding: "8px 14px", borderRadius: 10, textDecoration: "none" }}
            >
              Menu
            </a>
          )}
        </span>
      </span>
    </button>
  );
}
