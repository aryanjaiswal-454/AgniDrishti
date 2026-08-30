import http from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import config from "./config";
import apiRouter from "./routes";
import swaggerRouter from "./docs/swagger";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import logger from "./utils/logger";
import { testDbConnection } from "./db";
import { initSocketServer } from "./realtime";

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// 0. Initialize Socket.io Server attached to HTTP server
// ---------------------------------------------------------------------------
const io = initSocketServer(server);

// ---------------------------------------------------------------------------
// 1. Security & Core Middleware
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false, // relax in dev for Swagger UI
  })
);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 2. Request Logging Middleware
// ---------------------------------------------------------------------------
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== "/health") {
      logger.info(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ---------------------------------------------------------------------------
// 3. Rate Limiting for API routes
// ---------------------------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxApi,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP. Please try again later.",
    },
  },
});

app.use("/api", generalLimiter);

// ---------------------------------------------------------------------------
// 4. Health Check — GET /health
// ---------------------------------------------------------------------------
app.get("/health", async (_req: Request, res: Response) => {
  const dbHealth = await testDbConnection();
  const isHealthy = true; // Service is up; db status is reported

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    service: "AgniDrishti API",
    version: "1.0.0",
    database: {
      connected: dbHealth.ok,
      postgis: dbHealth.postgisVersion || "unavailable",
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
    },
    realtime: {
      socketIo: Boolean(io),
    },
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// 5. Swagger/OpenAPI Documentation
// ---------------------------------------------------------------------------
app.use("/api/v1/docs", swaggerRouter);
app.use("/api/docs", swaggerRouter); // convenience alias

// ---------------------------------------------------------------------------
// 6. Mount API v1 Routes
// ---------------------------------------------------------------------------
app.use("/api/v1", apiRouter);

// ---------------------------------------------------------------------------
// 7. 404 & Centralized Error Handlers
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// 8. Start Server (if executed directly)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
  server.listen(config.port, () => {
    logger.info(`🔥 AgniDrishti API running on http://localhost:${config.port}`);
    logger.info(`   Health check: http://localhost:${config.port}/health`);
    logger.info(`   API Docs:     http://localhost:${config.port}/api/v1/docs`);
    logger.info(`   Socket.io:    ws://localhost:${config.port}`);
  });
}

export { server, io };
export default app;

