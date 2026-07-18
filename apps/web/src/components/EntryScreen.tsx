"use client";

import { useSession } from "../store/session.js";
import { heroGradient, heroPanel } from "../design/system.js";

/**
 * Entry + value + mode selection + permission education. No location prompt on
 * load — only when the user explicitly starts a mode. Hero-forward per the
 * design prototype (S1/S2), with a glass content panel.
 */
export function EntryScreen() {
  const startRadar = useSession((s) => s.startRadar);
  return (
    <main
      data-testid="entry-screen"
      style={{
        position: "relative",
        minHeight: "100dvh",
        maxWidth: 480,
        margin: "0 auto",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: heroGradient(0) }} />
      <div
        style={{
          ...heroPanel,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "24px 26px 32px",
          borderRadius: "26px 26px 0 0",
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ font: "800 15px Inter, sans-serif", color: "var(--brand-bright)", letterSpacing: "-0.02em" }}>
          FoodMap
        </div>
        <h1 style={{ margin: 0, font: "700 30px/36px Inter, sans-serif", letterSpacing: "-0.015em", textShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
          Restaurants ahead, matched to how you&rsquo;re getting there.
        </h1>
        <p style={{ margin: 0, font: "400 16px/24px Inter, sans-serif", color: "rgba(255,255,255,0.82)" }}>
          Live results while you drive, walk, or ride — denser detail when you&rsquo;re not moving.
        </p>
        <p style={{ margin: 0, font: "400 12.5px/18px Inter, sans-serif", color: "rgba(255,255,255,0.55)" }}>
          Uses your location only while FoodMap is open, to find nearby open venues. Nothing is
          shared until you choose an action. Permission is requested only after you start.
        </p>

        <button type="button" data-testid="start-radar" onClick={() => startRadar("real")} style={primary}>
          Start Food Radar
        </button>
        <button type="button" data-testid="start-radar-sim" onClick={() => startRadar("sim")} style={secondary}>
          Try demo (simulated drive)
        </button>
      </div>
    </main>
  );
}

const primary: React.CSSProperties = {
  marginTop: 4,
  minHeight: 56,
  borderRadius: 999,
  border: "none",
  background: "var(--brand)",
  color: "#fff",
  backgroundImage: "linear-gradient(165deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)",
  font: "700 16px Inter, sans-serif",
  cursor: "pointer",
};
const secondary: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  font: "600 15px Inter, sans-serif",
  cursor: "pointer",
};
