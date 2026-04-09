import { env } from "./config/env";

async function startServer() {
  const { app } = await import("./app");

  app.listen(env.PORT, () => {
    console.log(`🦊 Server running at http://${env.HOST}:${env.PORT}`);
    console.log(`📋 Health check: http://${env.HOST}:${env.PORT}/health`);
  });

  const shutdown = () => {
    console.log("\n⏳ Shutting down gracefully...");
    app.stop();
    console.log("✅ Server closed.");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
