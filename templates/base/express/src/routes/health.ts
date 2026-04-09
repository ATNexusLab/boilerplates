import { Router } from "express";

const healthRouter = Router();

const startTime = Date.now();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

export { healthRouter };
