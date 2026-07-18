import SchemaBuilder from "@pothos/core";
import type { AheadClass, Heading, OpenState, SourceType, VenueActionKind } from "@foodmap/domain";
import { isEnabled } from "@foodmap/config";
import { appleMapsUrl, googleMapsUrl } from "@foodmap/integrations";
import type { FoodMapContext } from "./context.js";
import { signVenueRef, stableVenueKey } from "./refs.js";

interface ApiAction {
  readonly kind: VenueActionKind;
}
interface ApiCandidate {
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
  readonly actions: readonly ApiAction[];
  readonly deliveryMenuUrl: string | null;
  readonly navGoogleUrl: string;
  readonly navAppleUrl: string;
}
interface ApiPayload {
  readonly status: string;
  readonly warnings: readonly string[];
  readonly candidates: readonly ApiCandidate[];
  readonly refreshAfterMs: number;
  readonly configVersion: string;
  readonly selectionVersion: number;
}
interface ApiCapabilities {
  readonly radarEnabled: boolean;
  readonly routeEnabled: boolean;
  readonly mapEnabled: boolean;
  readonly placesEnabled: boolean;
  readonly configVersion: string;
}

const REF_TTL_MS = 15 * 60 * 1000;

export function buildSchema() {
  const builder = new SchemaBuilder<{ Context: FoodMapContext }>({});

  const OpenStateEnum = builder.enumType("OpenState", {
    values: ["open", "closed", "unknown"] as const,
  });
  const AheadClassEnum = builder.enumType("AheadClass", {
    values: ["ahead", "near_current", "likely_passed", "off_route", "unknown"] as const,
  });
  const SourceEnum = builder.enumType("SourceType", {
    values: ["foodmap", "merchant", "delivery_linked", "provider", "mixed", "unknown"] as const,
  });
  const ActionKindEnum = builder.enumType("VenueActionKind", {
    values: [
      "navigate",
      "view_menu",
      "start_delivery",
      "start_pickup",
      "call",
      "report_incorrect",
      "save",
    ] as const,
  });

  const ActionRef = builder.objectRef<ApiAction>("VenueAction").implement({
    fields: (t) => ({ kind: t.field({ type: ActionKindEnum, resolve: (a) => a.kind }) }),
  });

  const CandidateRef = builder.objectRef<ApiCandidate>("Candidate").implement({
    fields: (t) => ({
      ref: t.exposeString("ref"),
      key: t.exposeString("key"),
      name: t.exposeString("name"),
      cuisines: t.exposeStringList("cuisines"),
      openState: t.field({ type: OpenStateEnum, resolve: (c) => c.openState }),
      opensAtLabel: t.string({ nullable: true, resolve: (c) => c.opensAtLabel }),
      distanceM: t.exposeFloat("distanceM"),
      aheadClass: t.field({ type: AheadClassEnum, resolve: (c) => c.aheadClass }),
      distinguishingFact: t.string({ nullable: true, resolve: (c) => c.distinguishingFact }),
      source: t.field({ type: SourceEnum, resolve: (c) => c.source }),
      actions: t.field({ type: [ActionRef], resolve: (c) => c.actions }),
      deliveryMenuUrl: t.string({ nullable: true, resolve: (c) => c.deliveryMenuUrl }),
      navGoogleUrl: t.exposeString("navGoogleUrl"),
      navAppleUrl: t.exposeString("navAppleUrl"),
    }),
  });

  const PayloadRef = builder.objectRef<ApiPayload>("DiscoverPayload").implement({
    fields: (t) => ({
      status: t.exposeString("status"),
      warnings: t.exposeStringList("warnings"),
      candidates: t.field({ type: [CandidateRef], resolve: (p) => p.candidates }),
      refreshAfterMs: t.exposeInt("refreshAfterMs"),
      configVersion: t.exposeString("configVersion"),
      selectionVersion: t.exposeInt("selectionVersion"),
    }),
  });

  const CapabilitiesRef = builder.objectRef<ApiCapabilities>("FoodMapCapabilities").implement({
    fields: (t) => ({
      radarEnabled: t.exposeBoolean("radarEnabled"),
      routeEnabled: t.exposeBoolean("routeEnabled"),
      mapEnabled: t.exposeBoolean("mapEnabled"),
      placesEnabled: t.exposeBoolean("placesEnabled"),
      configVersion: t.exposeString("configVersion"),
    }),
  });

  const DiscoverInput = builder.inputType("DiscoverInput", {
    fields: (t) => ({
      lat: t.float({ required: true }),
      lng: t.float({ required: true }),
      headingDeg: t.float({ required: false }),
      headingConfidence: t.float({ required: false }),
      cuisines: t.stringList({ required: false }),
      openNow: t.boolean({ required: false }),
      maxMetresAhead: t.int({ required: false }),
      resultLimit: t.int({ required: false }),
      sessionId: t.string({ required: true }),
      selectionVersion: t.int({ required: false }),
    }),
  });

  builder.queryType({
    fields: (t) => ({
      foodMapCapabilities: t.field({
        type: CapabilitiesRef,
        resolve: (_p, _a, ctx): ApiCapabilities => ({
          radarEnabled: isEnabled(ctx.config, "foodmap.radar"),
          routeEnabled: isEnabled(ctx.config, "foodmap.route"),
          mapEnabled: isEnabled(ctx.config, "foodmap.map"),
          placesEnabled: isEnabled(ctx.config, "foodmap.places.external"),
          configVersion: ctx.config.version,
        }),
      }),

      foodMapDiscover: t.field({
        type: PayloadRef,
        args: { input: t.arg({ type: DiscoverInput, required: true }) },
        resolve: async (_p, { input }, ctx): Promise<ApiPayload> => {
          const heading: Heading | null =
            input.headingDeg != null && input.headingConfidence != null
              ? { deg: input.headingDeg, confidence: input.headingConfidence }
              : null;

          const filters =
            input.cuisines || input.openNow != null || input.maxMetresAhead != null
              ? {
                  ...(input.cuisines ? { cuisines: input.cuisines } : {}),
                  ...(input.openNow != null ? { openNow: input.openNow } : {}),
                  ...(input.maxMetresAhead != null ? { maxMetresAhead: input.maxMetresAhead } : {}),
                }
              : undefined;

          const result = await ctx.discovery.radar({
            location: { lat: input.lat, lng: input.lng },
            heading,
            ...(filters ? { filters } : {}),
            ...(input.resultLimit != null ? { requestedResultCount: input.resultLimit } : {}),
            ...(input.selectionVersion != null ? { selectionVersion: input.selectionVersion } : {}),
          });

          const exp = ctx.now() + REF_TTL_MS;
          const candidates: ApiCandidate[] = result.candidates.map((c) => ({
            ref: signVenueRef({ venueId: c.venue.id, exp }, ctx.refSecret),
            key: stableVenueKey(c.venue.id, ctx.refSecret),
            name: c.venue.name,
            cuisines: c.venue.cuisines,
            openState: c.venue.openState,
            opensAtLabel: c.venue.opensAtLabel ?? null,
            distanceM: Math.round(c.distanceM),
            aheadClass: c.aheadClass,
            distinguishingFact: c.venue.distinguishingFact ?? null,
            source: c.venue.source,
            actions: c.actions.map((a) => ({ kind: a.kind })),
            deliveryMenuUrl: c.venue.deliveryBranchRef
              ? ctx.delivery.buildMenuUrl(c.venue.deliveryBranchRef)
              : null,
            navGoogleUrl: googleMapsUrl({ point: c.venue.point, label: c.venue.name }),
            navAppleUrl: appleMapsUrl({ point: c.venue.point, label: c.venue.name }),
          }));

          return {
            status: result.status,
            warnings: result.warnings,
            candidates,
            refreshAfterMs: result.refreshAfterMs,
            configVersion: result.configVersion,
            selectionVersion: result.selectionVersion,
          };
        },
      }),
    }),
  });

  return builder.toSchema();
}
