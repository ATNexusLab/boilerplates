import { env } from "./config/env.js";

const port = env.PORT;
const host = env.HOST;

async function startServer() {
  const { app } = await import("./app.js");

  const server = app.listen(port, host, () => {
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📋 Health check: http://${host}:${port}/health`);
  });

  const shutdown = () => {
    console.log("\n⏳ Shutting down gracefully...");
    server.close(() => {
      console.log("✅ Server closed.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("⚠ Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
