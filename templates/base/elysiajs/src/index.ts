import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => ({ message: "Hello from {{PROJECT_NAME}}!" }))
  .listen(3000);

console.log(`🦊 Server running at http://${app.server?.hostname}:${app.server?.port}`);
