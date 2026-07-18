import { createServer } from "node:http";
import { createFoodMapYoga } from "./yoga.js";

const yoga = createFoodMapYoga();
const server = createServer(yoga);
const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`FoodMap API (zero-key) on http://localhost:${port}/api/graphql`);
});
