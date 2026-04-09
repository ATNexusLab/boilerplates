import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";
import { logger } from "./lib/logger";

const app = new Elysia()
  .use(cors())
  .use(
    rateLimit({
      max: 100,
      duration: 15 * 60 * 1000,
    }),
  )
  .onRequest(({ request }) => {
    logger.info({ method: request.method, url: request.url }, "→ request");
  })
  .onAfterHandle(({ request, set }) => {
    logger.info(
      { method: request.method, url: request.url, status: set.status ?? 200 },
      "← response",
    );
  })
  .use(errorHandler)
  .use(routes);

export { app };
