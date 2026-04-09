import { logger } from "./lib/logger";
import { env } from "./config/env";

async function startServer() {
  const { app } = await import("./app");

  app.listen(env.PORT, () => {
    logger.info({ host: env.HOST, port: env.PORT }, `Server running at http://${env.HOST}:${env.PORT}`);
    logger.info(`Health check: http://${env.HOST}:${env.PORT}/health`);
  });

  const shutdown = () => {
    logger.info("Shutting down gracefully...");
    app.stop();
    logger.info("Server closed.");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
