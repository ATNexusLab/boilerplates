import { Router } from "express";
import { healthRouter } from "./health.js";

const router = Router();

router.use(healthRouter);

router.get("/", (_req, res) => {
  res.json({ message: "Hello from {{PROJECT_NAME}}!" });
});

export { router };
