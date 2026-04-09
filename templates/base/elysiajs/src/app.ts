import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";

const app = new Elysia()
  .use(cors())
  .use(errorHandler)
  .use(routes);

export { app };
