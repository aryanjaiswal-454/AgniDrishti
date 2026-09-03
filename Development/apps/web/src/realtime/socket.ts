import { io, Socket } from "socket.io-client";

/**
 * Determine the WebSocket / Socket.io server endpoint.
 */
export function getSocketEndpoint(): string {
  if (typeof window === "undefined") return "http://localhost:8087";

  // Explicit override via environment variable.
  const envUrl = import.meta.env?.VITE_WS_URL || import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;

  // Vite proxies /socket.io to the local API, while deployed applications share an origin.
  return window.location.origin;
}

/**
 * Create a new Socket.io client instance configured for token-based authentication.
 */
export function createSocketClient(token?: string): Socket {
  return io(getSocketEndpoint(), {
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });
}
