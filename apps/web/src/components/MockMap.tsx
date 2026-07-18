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
 * Mock map renderer (no Google). Projects candidates to a simple local plane so
 * the Map ↔ Ahead selection model can be exercised. Every action here also
 * exists in Ahead; if this fails to render, Ahead remains fully functional.
 */
export function MockMap({ center, candidates, selectedKey, onSelect }: Props) {
  const size = 320;
  return (
    <div
      data-testid="mock-map"
      role="img"
      aria-label="Map of restaurants ahead"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: size,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        borderRadius: 16,
        background: "var(--surface-sunken)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* current location */}
      <Dot x={size / 2} y={size / 2} color="var(--current-location)" label="You" size={14} />
      {/* Candidates are placed on a distance ring by index — exact coords aren't sent to the client. */}
      {candidates.map((c, i) => {
        const angle = (i / Math.max(1, candidates.length)) * Math.PI * 2;
        const r = 40 + Math.min(120, c.distanceM / 20);
        const x = size / 2 + Math.cos(angle) * r;
        const y = size / 2 + Math.sin(angle) * r;
        const selected = c.key === selectedKey;
        return (
          <button
            key={c.key}
            type="button"
            data-testid="map-marker"
            aria-label={c.name}
            aria-pressed={selected}
            onClick={() => onSelect(c.key)}
            style={{
              position: "absolute",
              left: x - 9,
              top: y - 9,
              width: selected ? 22 : 18,
              height: selected ? 22 : 18,
              borderRadius: 999,
              border: "2px solid var(--surface)",
              background: selected ? "var(--marker-selected)" : "var(--marker-unselected)",
              cursor: "pointer",
              padding: 0,
            }}
          />
        );
      })}
    </div>
  );
}

function Dot({ x, y, color, label, size }: { x: number; y: number; color: string; label: string; size: number }) {
  return (
    <span
      aria-label={label}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        border: "2px solid var(--surface)",
      }}
    />
  );
}
