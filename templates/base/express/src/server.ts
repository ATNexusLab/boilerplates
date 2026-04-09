import { logger } from "./lib/logger.js";
import { env } from "./config/env.js";

const port = env.PORT;
const host = env.HOST;

async function startServer() {
  const { app } = await import("./app.js");

  const server = app.listen(port, host, () => {
    logger.info({ host, port }, `Server running at http://${host}:${port}`);
    logger.info(`Health check: http://${host}:${port}/health`);
  });

  const shutdown = () => {
    logger.info("Shutting down gracefully...");
    server.close(() => {
      logger.info("Server closed.");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer();
