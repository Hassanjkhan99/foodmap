"use client";

import { useSession } from "../store/session.js";

/**
 * Entry + mode selection + permission education. No location prompt fires on
 * load — only when the user explicitly starts a mode (the button is the
 * explicit action that may trigger the OS permission prompt).
 */
export function EntryScreen() {
  const startRadar = useSession((s) => s.startRadar);
  return (
    <main data-testid="entry-screen" style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px", display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, margin: 0 }}>See what&rsquo;s ahead</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, lineHeight: 1.5 }}>
          FoodMap uses your location <strong>only while a session is open</strong>, to show
          restaurants you&rsquo;re about to pass. It never runs in the background.
        </p>
      </div>

      <button type="button" data-testid="start-radar" onClick={() => startRadar("real")} style={primary}>
        Start Food Radar
      </button>
      <button type="button" data-testid="start-radar-sim" onClick={() => startRadar("sim")} style={secondary}>
        Try demo (simulated drive)
      </button>

      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Location permission is requested only after you choose a mode.
      </p>
    </main>
  );
}

const primary: React.CSSProperties = {
  minHeight: 56,
  borderRadius: 999,
  border: "none",
  background: "var(--brand)",
  color: "var(--on-brand)",
  fontWeight: 700,
  fontSize: 17,
  cursor: "pointer",
};
const secondary: React.CSSProperties = {
  minHeight: 56,
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
};
