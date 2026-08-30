import { Request, Response, NextFunction } from "express";
import { AppError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";
import config from "../config";

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

/**
 * Centralized global error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Determine if it's an operational AppError
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : "INTERNAL_SERVER_ERROR";
  const message = isAppError
    ? err.message
    : config.isProduction
    ? "An unexpected internal server error occurred"
    : err.message || "Internal server error";

  // Log errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - 500 Internal Error: ${err.message}`, {
      stack: err.stack,
      body: req.body,
      query: req.query,
      user: req.user,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} ${code}: ${err.message}`, {
      details: isAppError ? err.details : undefined,
    });
  }

  // Safe JSON response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(isAppError && err.details ? { details: err.details } : {}),
      ...(!config.isProduction && statusCode >= 500 ? { stack: err.stack } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

