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
    // Use the host's global Response (Next/Vercel serverless) so returned
    // responses are the class the route handler expects. Without this, Vercel's
    // Node runtime rejects Yoga's ponyfilled Response ("No response is returned").
    fetchAPI: { Response },
    plugins: [
      {
        onResponse({ response }) {
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    ],
  });
}
