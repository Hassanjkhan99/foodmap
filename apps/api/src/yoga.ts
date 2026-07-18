import { createYoga } from "graphql-yoga";
import { buildSchema } from "./schema.js";
import { buildContext, type BuildContextOptions } from "./context.js";

/**
 * Creates a Yoga instance. Exact-location discovery responses must not be
 * shared-cached — we set a private, no-store cache header on every response.
 */
export function createFoodMapYoga(options: BuildContextOptions = {}) {
  return createYoga({
    schema: buildSchema(),
    context: () => buildContext(options),
    graphqlEndpoint: "/api/graphql",
    plugins: [
      {
        onResponse({ response }) {
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    ],
  });
}
