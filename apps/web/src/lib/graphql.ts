import type { AheadClass, OpenState, SourceType, VenueActionKind } from "@foodmap/domain";

export interface ClientAction {
  readonly kind: VenueActionKind;
}
export interface ClientCandidate {
  readonly ref: string;
  readonly key: string;
  readonly name: string;
  readonly cuisines: readonly string[];
  readonly openState: OpenState;
  readonly opensAtLabel: string | null;
  readonly distanceM: number;
  readonly aheadClass: AheadClass;
  readonly distinguishingFact: string | null;
  readonly source: SourceType;
  readonly actions: readonly ClientAction[];
  readonly deliveryMenuUrl: string | null;
  readonly navGoogleUrl: string;
  readonly navAppleUrl: string;
}
export interface ClientDiscoverPayload {
  readonly status: string;
  readonly warnings: readonly string[];
  readonly candidates: readonly ClientCandidate[];
  readonly refreshAfterMs: number;
  readonly configVersion: string;
  readonly selectionVersion: number;
}

export interface DiscoverArgs {
  readonly lat: number;
  readonly lng: number;
  readonly headingDeg?: number;
  readonly headingConfidence?: number;
  readonly cuisines?: readonly string[];
  readonly openNow?: boolean;
  readonly maxMetresAhead?: number;
  readonly resultLimit?: number;
  readonly sessionId: string;
  readonly selectionVersion?: number;
}

const DISCOVER_QUERY = /* GraphQL */ `
  query Discover($input: DiscoverInput!) {
    foodMapDiscover(input: $input) {
      status
      warnings
      refreshAfterMs
      configVersion
      selectionVersion
      candidates {
        ref key name cuisines openState opensAtLabel distanceM aheadClass
        distinguishingFact source deliveryMenuUrl navGoogleUrl navAppleUrl
        actions { kind }
      }
    }
  }
`;

export interface DiscoverOptions {
  readonly endpoint?: string;
  readonly signal?: AbortSignal;
}

/** Calls the collapsed-mode FoodMap GraphQL API mounted at /api/graphql. */
export async function discover(
  args: DiscoverArgs,
  options: DiscoverOptions = {},
): Promise<ClientDiscoverPayload> {
  const res = await fetch(options.endpoint ?? "/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: DISCOVER_QUERY, variables: { input: args } }),
    ...(options.signal ? { signal: options.signal } : {}),
  });
  const json = (await res.json()) as {
    data?: { foodMapDiscover: ClientDiscoverPayload };
    errors?: unknown;
  };
  if (!json.data) throw new Error("discover: no data");
  return json.data.foodMapDiscover;
}
