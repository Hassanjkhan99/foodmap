import { z } from "zod";

/**
 * Typed FoodMap runtime configuration + kill switches. Defaults are zero-key:
 * external providers are OFF so local/CI run with no credentials. See
 * docs/operations/kill-switches.md.
 */

export const KillSwitchSchema = z.object({
  "foodmap.global": z.boolean(),
  "foodmap.radar": z.boolean(),
  "foodmap.route": z.boolean(),
  "foodmap.places.external": z.boolean(),
  "foodmap.places.details": z.boolean(),
  "foodmap.map": z.boolean(),
  "foodmap.analytics": z.boolean(),
  "foodmap.provider.google_places": z.boolean(),
  "foodmap.provider.google_routes": z.boolean(),
});
export type KillSwitches = z.infer<typeof KillSwitchSchema>;
export type KillSwitchKey = keyof KillSwitches;

export const DiscoveryConfigSchema = z.object({
  defaultResultCount: z.number().int().min(1).max(50),
  maxResultCount: z.number().int().min(1).max(50),
  refreshMinIntervalMs: z.number().int().min(0),
});
export type DiscoveryConfig = z.infer<typeof DiscoveryConfigSchema>;

export const RuntimeConfigSchema = z.object({
  /** bumped whenever config changes; surfaced to clients as configVersion */
  version: z.string(),
  killSwitches: KillSwitchSchema,
  discovery: DiscoveryConfigSchema,
});
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export const DEFAULT_CONFIG: RuntimeConfig = {
  version: "config-0",
  killSwitches: {
    "foodmap.global": true,
    "foodmap.radar": true,
    "foodmap.route": false, // route mode is Phase 4
    "foodmap.places.external": false, // zero-key default
    "foodmap.places.details": false,
    "foodmap.map": true, // mock renderer in Phase 1
    "foodmap.analytics": true,
    "foodmap.provider.google_places": false,
    "foodmap.provider.google_routes": false,
  },
  discovery: {
    defaultResultCount: 5,
    maxResultCount: 15,
    refreshMinIntervalMs: 4000,
  },
};

/** Parse + validate an arbitrary config object at a boundary. */
export function parseRuntimeConfig(input: unknown): RuntimeConfig {
  return RuntimeConfigSchema.parse(input);
}

export function isEnabled(config: RuntimeConfig, key: KillSwitchKey): boolean {
  if (!config.killSwitches["foodmap.global"]) return false;
  return config.killSwitches[key];
}

/** Clamp a requested result count to the server-configured bound. */
export function boundedResultCount(config: RuntimeConfig, requested?: number): number {
  const n = requested ?? config.discovery.defaultResultCount;
  return Math.max(1, Math.min(config.discovery.maxResultCount, Math.floor(n)));
}
