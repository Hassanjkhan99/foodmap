import { DEFAULT_CONFIG, type RuntimeConfig } from "@foodmap/config";
import {
  DiscoveryService,
  FixtureCatalogProvider,
  MockDeliveryPlatformClient,
  MemoryAnalyticsSink,
  type CatalogProvider,
  type DeliveryPlatformClient,
} from "@foodmap/integrations";

export interface FoodMapContext {
  readonly config: RuntimeConfig;
  readonly discovery: DiscoveryService;
  readonly delivery: DeliveryPlatformClient;
  readonly analytics: MemoryAnalyticsSink;
  readonly refSecret: string;
  /** injected clock for deterministic ref expiry */
  readonly now: () => number;
}

export interface BuildContextOptions {
  readonly config?: RuntimeConfig;
  readonly catalog?: CatalogProvider;
  readonly heraldBaseUrl?: string;
  readonly refSecret?: string;
  readonly now?: () => number;
}

/**
 * Builds the request context with zero-key defaults (fixture catalog, mock
 * Herald client). No external credentials required.
 */
export function buildContext(options: BuildContextOptions = {}): FoodMapContext {
  const config = options.config ?? DEFAULT_CONFIG;
  const catalog = options.catalog ?? new FixtureCatalogProvider();
  return {
    config,
    discovery: new DiscoveryService(catalog, config),
    delivery: new MockDeliveryPlatformClient({
      heraldBaseUrl: options.heraldBaseUrl ?? "https://herald.local",
    }),
    analytics: new MemoryAnalyticsSink(),
    refSecret: options.refSecret ?? process.env.FOODMAP_REF_SECRET ?? "dev-secret-do-not-use-in-prod",
    now: options.now ?? (() => Date.now()),
  };
}
