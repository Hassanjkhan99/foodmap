import type { DeliveryBranchRef } from "@foodmap/domain";
import type {
  DeliveryBranch,
  DeliveryPlatformClient,
  DeliveryQuote,
} from "../ports.js";

export interface MockDeliveryOptions {
  /** base URL of the Herald PWA (deep-link target) */
  readonly heraldBaseUrl: string;
  /** seed branches keyed by `${slug}:${branchId ?? ""}` */
  readonly branches?: ReadonlyMap<string, DeliveryBranch>;
}

/**
 * Deterministic mock of the Herald DeliveryPlatformClient. Requires no Herald
 * instance or keys. Builds real deep-link URLs (/r/<slug>?branch=&item=) using
 * URL/URLSearchParams — the same builder the real adapter will use. See ADR-0003.
 */
export class MockDeliveryPlatformClient implements DeliveryPlatformClient {
  private readonly base: string;
  private readonly branches: ReadonlyMap<string, DeliveryBranch>;

  constructor(opts: MockDeliveryOptions) {
    this.base = opts.heraldBaseUrl.replace(/\/+$/, "");
    this.branches = opts.branches ?? new Map();
  }

  async getBranch(ref: DeliveryBranchRef): Promise<DeliveryBranch | null> {
    const key = `${ref.restaurantSlug}:${ref.branchId ?? ""}`;
    return (
      this.branches.get(key) ?? {
        ref,
        name: ref.restaurantSlug,
        isOpenNow: true,
      }
    );
  }

  async quote(ref: DeliveryBranchRef): Promise<DeliveryQuote | null> {
    if (!ref.restaurantSlug) return null;
    return { minSubtotalMinor: 30000, deliveryFeeMinor: 12000, currency: "PKR" };
  }

  buildBranchUrl(ref: DeliveryBranchRef, opts?: { itemId?: string }): string {
    const url = new URL(`${this.base}/r/${encodeURIComponent(ref.restaurantSlug)}`);
    if (ref.branchId) url.searchParams.set("branch", ref.branchId);
    if (opts?.itemId) url.searchParams.set("item", opts.itemId);
    return url.toString();
  }

  buildMenuUrl(ref: DeliveryBranchRef): string {
    return this.buildBranchUrl(ref);
  }
}
