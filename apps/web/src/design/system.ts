/**
 * Shared visual helpers ported from the Claude Designer prototype
 * (designer/FoodMap Prototype.dc.html). Colours come from CSS variables so
 * light/dark switch automatically; the hero gradients are decorative
 * placeholders for venue imagery until real photos are wired.
 */
import type { CSSProperties } from "react";

const HERO_PAIRS: readonly (readonly [string, string])[] = [
  ["#E8580C", "#1F6FEB"],
  ["#1F6FEB", "#E8580C"],
  ["#C6480A", "#1E7A46"],
  ["#B26A00", "#E8580C"],
];

/** A vivid placeholder "hero image" gradient, stable per index. */
export function heroGradient(index: number): string {
  const pair = HERO_PAIRS[index % HERO_PAIRS.length]!;
  return (
    `radial-gradient(circle at 28% 22%, rgba(255,255,255,0.28), transparent 45%),` +
    `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 58%, #241f16 115%)`
  );
}

/** Overlay panel that sits over hero imagery to keep text legible. */
export const heroPanel: CSSProperties = {
  backgroundColor: "rgba(16,16,15,0.36)",
  backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.7) 100%)",
  backdropFilter: "blur(26px) saturate(190%)",
  WebkitBackdropFilter: "blur(26px) saturate(190%)",
  borderTop: "1px solid rgba(255,255,255,0.16)",
};

/** Whether the presentation context should render rich (image-forward) variants. */
export function isRich(presentation: string): boolean {
  return presentation === "stationary_rich" || presentation === "passenger_rich";
}

/** "6 min ahead" style label from metres, or "passed" when behind. */
export function aheadLabel(distanceM: number, aheadClass: string): string {
  if (aheadClass === "likely_passed") return "passed";
  return distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${Math.round(distanceM)} m`;
}
