const env = {
  NODE_ENV: Bun.env.NODE_ENV ?? "development",
  PORT: Number(Bun.env.PORT) || 3000,
  HOST: Bun.env.HOST ?? "0.0.0.0",
  LOG_LEVEL: Bun.env.LOG_LEVEL ?? "info",
} as const;

const isProduction = env.NODE_ENV === "production";
const isDevelopment = env.NODE_ENV === "development";

export { env, isProduction, isDevelopment };
