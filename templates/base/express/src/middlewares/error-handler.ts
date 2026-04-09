import type { Request, Response, NextFunction } from "express";
import { isDevelopment } from "../config/env.js";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && !isDevelopment
        ? "Internal server error"
        : err.message,
      status: statusCode,
      ...(err.code && { code: err.code }),
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}
