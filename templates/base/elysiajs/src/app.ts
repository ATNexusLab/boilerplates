import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";

const app = new Elysia()
  .use(cors())
  .use(
    rateLimit({
      max: 100,
      duration: 15 * 60 * 1000,
    }),
  )
  .use(errorHandler)
  .use(routes);

export { app };
