import { Elysia } from "elysia";
import { healthRoutes } from "./health";

const routes = new Elysia()
  .use(healthRoutes)
  .get("/", () => ({ message: "Hello from {{PROJECT_NAME}}!" }));

export { routes };
