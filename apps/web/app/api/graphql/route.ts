import { createFoodMapYoga } from "@foodmap/api";

// Collapsed mode: the FoodMap GraphQL API is mounted inside Next (Herald-style),
// so the PWA runs from one command with no separate API server or keys.
const yoga = createFoodMapYoga();

// node:crypto (signed venue refs) requires the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handler(request: Request): Response | Promise<Response> {
  return yoga.fetch(request);
}

export { handler as GET, handler as POST, handler as OPTIONS };
