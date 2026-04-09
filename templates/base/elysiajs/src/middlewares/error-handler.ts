import { Elysia } from "elysia";
import { isDevelopment } from "../config/env";

const errorHandler = new Elysia()
  .onError({ as: "global" }, ({ code, error, set }) => {
    const statusCode = code === "NOT_FOUND" ? 404
      : code === "VALIDATION" ? 400
      : 500;

    set.status = statusCode;

    return {
      error: {
        message: statusCode === 500 && !isDevelopment
          ? "Internal server error"
          : error.message,
        status: statusCode,
        code,
        ...(isDevelopment && { stack: error.stack }),
      },
    };
  });

export { errorHandler };
