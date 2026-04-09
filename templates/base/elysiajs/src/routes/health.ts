import { Elysia } from "elysia";

const startTime = Date.now();

const healthRoutes = new Elysia()
  .get("/health", () => ({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  }));

export { healthRoutes };
