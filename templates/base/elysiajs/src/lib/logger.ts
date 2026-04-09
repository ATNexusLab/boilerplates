import { env } from "../config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LEVELS[env.LOG_LEVEL as LogLevel] ?? LEVELS.info;

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (currentLevel <= LEVELS.debug) console.debug(`[${timestamp()}] [DEBUG]`, ...args);
  },
  info: (...args: unknown[]) => {
    if (currentLevel <= LEVELS.info) console.info(`[${timestamp()}] [INFO]`, ...args);
  },
  warn: (...args: unknown[]) => {
    if (currentLevel <= LEVELS.warn) console.warn(`[${timestamp()}] [WARN]`, ...args);
  },
  error: (...args: unknown[]) => {
    if (currentLevel <= LEVELS.error) console.error(`[${timestamp()}] [ERROR]`, ...args);
  },
};
