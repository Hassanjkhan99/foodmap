import { createFoodMapYoga } from "@foodmap/api";

// Collapsed mode: the FoodMap GraphQL API is mounted inside Next (Herald-style),
// so the PWA runs from one command with no separate API server or keys.
const yoga = createFoodMapYoga();

// node:crypto (signed venue refs) requires the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use Yoga's handleRequest so the Next App Router route handler receives a
// proper Response (with fetchAPI.Response set in createFoodMapYoga).
function handler(request: Request, ctx: unknown): Response | Promise<Response> {
  return yoga.handleRequest(request, ctx as never);
}

export { handler as GET, handler as POST, handler as OPTIONS };
