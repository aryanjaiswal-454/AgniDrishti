import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import config from "../config";
import { verifyToken, JWTPayload } from "../utils/jwt";
import logger from "../utils/logger";
import { REALTIME_EVENTS, AlertCreatedPayload } from "./events";

export interface AuthenticatedSocketData {
  user: JWTPayload;
}

export type AgniSocket = Socket<any, any, any, AuthenticatedSocketData>;

let io: SocketIOServer | null = null;

// In-memory bounded cache for idempotent event emission (last 1000 alert IDs)
const emittedAlertIds = new Set<string>();
const MAX_EMITTED_IDS = 1000;

/**
 * Extract token from Socket.io handshake (cookie, auth object, or Authorization header).
 */
function extractTokenFromHandshake(socket: Socket): string | null {
  // 1. Check handshake auth object: { auth: { token: "..." } }
  if (socket.handshake.auth?.token && typeof socket.handshake.auth.token === "string") {
    const raw = socket.handshake.auth.token;
    return raw.startsWith("Bearer ") ? raw.substring(7) : raw;
  }

  // 2. Check Authorization header: "Bearer <token>"
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 3. Check Cookie header for httpOnly session cookie
  const cookieHeader = socket.handshake.headers?.cookie;
  if (cookieHeader && typeof cookieHeader === "string") {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith(`${config.jwt.cookieName}=`));
    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.substring(config.jwt.cookieName.length + 1));
    }
  }

  return null;
}

/**
 * Initialize Socket.io server attached to existing Node HTTP server.
 */
export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    serveClient: false,
    transports: ["websocket", "polling"],
  });

  logger.info("[Socket.io] Real-time alert server initialized.");

  // Authentication Middleware for incoming socket connections
  io.use((socket: Socket, next) => {
    try {
      const token = extractTokenFromHandshake(socket);

      if (!token) {
        logger.warn(`[Socket.io] Connection rejected for socket ${socket.id}: No authentication token provided.`);
        return next(new Error("Authentication required: Token missing or invalid."));
      }

      const decoded = verifyToken(token);
      (socket as AgniSocket).data.user = decoded;

      logger.info(
        `[Socket.io] Authenticated client connected: user=${decoded.email}, role=${decoded.role}, socket=${socket.id}`
      );
      next();
    } catch (err: any) {
      logger.warn(`[Socket.io] Connection rejected for socket ${socket.id}: ${err.message}`);
      return next(new Error("Authentication failed: Invalid or expired token."));
    }
  });

  // Connection Lifecycle Handlers
  io.on("connection", (socket: Socket) => {
    const user = (socket as AgniSocket).data.user;

    socket.on("disconnect", (reason) => {
      logger.info(
        `[Socket.io] Client disconnected: user=${user?.email || "anonymous"}, socket=${socket.id}, reason=${reason}`
      );
    });

    socket.on("error", (err) => {
      logger.error(`[Socket.io] Socket error on socket ${socket.id}: ${err.message}`);
    });
  });

  return io;
}

/**
 * Retrieve the active Socket.io server instance.
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Reset emitted alert cache (useful for test isolation).
 */
export function clearEmittedAlertCache(): void {
  emittedAlertIds.clear();
}

/**
 * Emit a real-time high-severity alert to all connected authenticated clients.
 *
 * Rules:
 * 1. Only emits if severity === 'high'.
 * 2. Idempotent: duplicate calls for the same alert ID will NOT re-emit.
 * 3. Logs broadcast with recipient count.
 *
 * @returns true if the alert was emitted, false if skipped (not high-severity or already emitted).
 */
export function emitAlertCreated(alert: AlertCreatedPayload): boolean {
  if (!io) {
    logger.warn("[Socket.io] emitAlertCreated called but Socket.io server is not initialized.");
    return false;
  }

  // 1. High-severity only rule
  if (alert.severity !== "high") {
    logger.debug(`[Socket.io] Alert ${alert.id} skipped: severity is '${alert.severity}' (only 'high' is broadcast).`);
    return false;
  }

  // 2. Idempotency check: avoid duplicate broadcasts on retries
  if (emittedAlertIds.has(alert.id)) {
    logger.debug(`[Socket.io] Alert ${alert.id} skipped: already broadcast.`);
    return false;
  }

  // Record into bounded set
  if (emittedAlertIds.size >= MAX_EMITTED_IDS) {
    const firstKey = emittedAlertIds.values().next().value;
    if (firstKey) emittedAlertIds.delete(firstKey);
  }
  emittedAlertIds.add(alert.id);

  // 3. Broadcast to all authenticated connected clients
  const recipientCount = io.sockets.sockets.size;
  io.emit(REALTIME_EVENTS.ALERT_CREATED, alert);

  logger.info(
    `[Socket.io] 🚨 High-severity alert broadcast: event=${REALTIME_EVENTS.ALERT_CREATED}, alertId=${alert.id}, recipients=${recipientCount}`
  );

  return true;
}

/**
 * Close and clean up Socket.io server (for tests and graceful teardown).
 */
export async function closeSocketServer(): Promise<void> {
  if (io) {
    await new Promise<void>((resolve) => {
      io!.close(() => {
        io = null;
        resolve();
      });
    });
    logger.info("[Socket.io] Real-time alert server closed.");
  }
}

