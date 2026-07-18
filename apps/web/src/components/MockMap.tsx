"use client";

import type { GeoPoint } from "@foodmap/domain";
import type { ClientCandidate } from "../lib/graphql.js";

interface Props {
  center: GeoPoint | null;
  candidates: readonly ClientCandidate[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * Mock map renderer (no Google) styled to the prototype: ambient grid + glows,
 * a current-location dot with heading cone, and candidate markers placed on a
 * distance ring (exact coords aren't sent to the client). Every action here also
 * exists in Ahead; if the map fails, Ahead remains fully functional.
 */
export function MockMap({ candidates, selectedKey, onSelect }: Props) {
  return (
    <div
      data-testid="mock-map"
      role="img"
      aria-label="Map of restaurants ahead"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1.15",
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "color-mix(in srgb, var(--current-location) 6%, var(--surface-sunken))",
        backgroundImage:
          "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--current-location) 14%, transparent), transparent 55%)," +
          "radial-gradient(circle at 75% 65%, color-mix(in srgb, var(--brand) 12%, transparent), transparent 50%)," +
          "repeating-linear-gradient(0deg, transparent 0 38px, rgba(0,0,0,0.06) 38px 39px)," +
          "repeating-linear-gradient(90deg, transparent 0 38px, rgba(0,0,0,0.06) 38px 39px)",
        border: "1px solid var(--border)",
      }}
    >
      <span style={{ position: "absolute", left: 12, bottom: 12, font: "600 10px ui-monospace, monospace", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.6 }}>
        map (mock)
      </span>

      {/* current location + heading cone */}
      <span style={{ position: "absolute", left: "50%", top: "76%", transform: "translate(-50%,-50%)" }}>
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: "26px solid var(--current-location)", opacity: 0.25, transform: "translate(-50%,-100%) rotate(-20deg)" }} />
        <span style={{ display: "block", width: 16, height: 16, borderRadius: 999, background: "var(--current-location)", border: "3px solid #fff", boxShadow: "0 0 0 2px rgba(0,0,0,0.08)" }} />
      </span>

      {candidates.map((c, i) => {
        const angle = (i / Math.max(1, candidates.length)) * Math.PI * 2 - Math.PI / 2;
        const r = 22 + Math.min(30, c.distanceM / 60);
        const x = 50 + Math.cos(angle) * r;
        const y = 55 + Math.sin(angle) * r;
        const selected = c.key === selectedKey;
        const behind = c.aheadClass === "likely_passed";
        return (
          <button
            key={c.key}
            type="button"
            data-testid="map-marker"
            aria-label={c.name}
            aria-pressed={selected}
            onClick={() => onSelect(c.key)}
            style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
          >
            {selected && <span style={{ position: "absolute", left: "50%", top: "50%", width: 14, height: 14, borderRadius: 999, background: "var(--marker-selected)", animation: "fm-pulse 1.8s ease-out infinite" }} />}
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                width: selected ? 20 : behind ? 11 : 15,
                height: selected ? 20 : behind ? 11 : 15,
                borderRadius: 999,
                background: behind ? "var(--marker-behind)" : selected ? "var(--marker-selected)" : "var(--marker-unselected)",
                border: "2px solid #fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        );
      })}

      <span className="glass" style={{ position: "absolute", right: 14, bottom: 14, width: 44, height: 44, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", font: "600 20px sans-serif", color: "var(--text-primary)" }}>
        ⌖
      </span>
    </div>
  );
}
