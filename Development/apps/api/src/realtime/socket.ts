import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import config from "../config";
import { JWTPayload } from "../utils/jwt";
import { firebaseAuth } from "../config/firebase";
import { query } from "../db";
import { User } from "@agnidrishti/shared-types";
import logger from "../utils/logger";
import { REALTIME_EVENTS, AlertCreatedPayload, ClassifiedEventCreatedPayload, FacilitiesSyncedPayload, SystemSettingsUpdatedPayload } from "./events";
import { publishRealtimeEvent, startRealtimeSubscriber } from "./bus";

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
  io.use(async (socket: Socket, next) => {
    try {
      const token = extractTokenFromHandshake(socket);

      // In production/dev where auth might fail temporarily, we can make it optional 
      // or strictly enforced. We will strictly enforce since it was originally doing that.
      if (!token) {
        logger.warn(`[Socket.io] Connection rejected for socket ${socket.id}: No authentication token provided.`);
        return next(new Error("Authentication required: Token missing or invalid."));
      }

      const decoded = await firebaseAuth.verifyIdToken(token);
      
      const email = decoded.email;
      if (!email) throw new Error("Token misses email");
      
      let res = await query<User>("SELECT id, name, email, role, created_at FROM users WHERE LOWER(email) = LOWER($1);", [email]);
      let dbUser = res.rows[0];
      
      if (!dbUser) {
          const name = decoded.name || email.split("@")[0] || "Firebase User";
          const insertRes = await query<User>(
            `INSERT INTO users (name, email, auth_provider)
             VALUES ($1, $2, 'firebase')
             RETURNING id, name, email, role, created_at;`,
            [name, email]
          );
          dbUser = insertRes.rows[0];
      }

      const payload: JWTPayload = {
          userId: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as any
      };

      (socket as AgniSocket).data.user = payload;

      logger.info(
        `[Socket.io] Authenticated client connected: user=${payload.email}, role=${payload.role}, socket=${socket.id}`
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

  // Relay committed events published by the standalone worker service to the
  // browser clients connected to this API process.
  startRealtimeSubscriber(({ type, payload }) => {
    if (!io) return;
    switch (type) {
      case REALTIME_EVENTS.ALERT_CREATED:
        emitAlertCreated(payload as AlertCreatedPayload);
        break;
      case REALTIME_EVENTS.CLASSIFIED_EVENT_CREATED:
        io.emit(REALTIME_EVENTS.CLASSIFIED_EVENT_CREATED, payload as ClassifiedEventCreatedPayload);
        break;
      case REALTIME_EVENTS.FACILITIES_SYNCED:
        io.emit(REALTIME_EVENTS.FACILITIES_SYNCED, payload as FacilitiesSyncedPayload);
        break;
    }
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
 * Emit a real-time alert to all connected authenticated clients.
 *
 * Rules:
 * 1. Idempotent: duplicate calls for the same alert ID will NOT re-emit.
 * 2. Logs broadcast with recipient count.
 *
 * @returns true if the alert was emitted, false if skipped as a duplicate.
 */
export function emitAlertCreated(alert: AlertCreatedPayload): boolean {
  if (!io) {
    publishRealtimeEvent(REALTIME_EVENTS.ALERT_CREATED, alert);
    return true;
  }

  // 1. Idempotency check: avoid duplicate broadcasts on retries
  if (emittedAlertIds.has(alert.id)) {
    logger.debug(`[Socket.io] Alert ${alert.id} skipped: already broadcast.`);
    return false;
  }

  // 2. Record into bounded set
  if (emittedAlertIds.size >= MAX_EMITTED_IDS) {
    const firstKey = emittedAlertIds.values().next().value;
    if (firstKey) emittedAlertIds.delete(firstKey);
  }
  emittedAlertIds.add(alert.id);

  // 3. Broadcast to all authenticated connected clients. The web client shows
  // notifications only for high severity, while every severity refreshes map data.
  const recipientCount = io.sockets.sockets.size;
  io.emit(REALTIME_EVENTS.ALERT_CREATED, alert);

  logger.info(
    `[Socket.io] Alert broadcast: event=${REALTIME_EVENTS.ALERT_CREATED}, severity=${alert.severity}, alertId=${alert.id}, recipients=${recipientCount}`
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


/**
 * Emit a real-time event when facilities are synchronized from OSM.
 */
export function emitFacilitiesSynced(payload: FacilitiesSyncedPayload): boolean {
  if (!io) {
    publishRealtimeEvent(REALTIME_EVENTS.FACILITIES_SYNCED, payload);
    return true;
  }

  io.emit(REALTIME_EVENTS.FACILITIES_SYNCED, payload);

  logger.info(
    `[Socket.io] 🌍 Facilities sync broadcast: UPSERTED=${payload.facilities_upserted}, recipients=${io.sockets.sockets.size}`
  );
  return true;
}

/** Broadcast a committed policy change so active dashboards refetch together. */
export function emitSystemSettingsUpdated(payload: SystemSettingsUpdatedPayload): boolean {
  if (!io) {
    logger.warn("[Socket.io] Settings update could not be broadcast because Socket.io is not initialized.");
    return false;
  }

  io.emit(REALTIME_EVENTS.SYSTEM_SETTINGS_UPDATED, payload);
  logger.info(`[Socket.io] System settings broadcast to ${io.sockets.sockets.size} recipient(s).`);
  return true;
}

/** Notify dashboards when any new event is classified, including normal events. */
export function emitClassifiedEventCreated(payload: ClassifiedEventCreatedPayload): boolean {
  if (!io) {
    publishRealtimeEvent(REALTIME_EVENTS.CLASSIFIED_EVENT_CREATED, payload);
    return true;
  }

  io.emit(REALTIME_EVENTS.CLASSIFIED_EVENT_CREATED, payload);
  logger.info(`[Socket.io] Classified-event broadcast: eventId=${payload.classified_event_id}, recipients=${io.sockets.sockets.size}`);
  return true;
}
