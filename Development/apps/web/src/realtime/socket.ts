import { io, Socket } from "socket.io-client";

/**
 * Determine the WebSocket / Socket.io server endpoint.
 */
export function getSocketEndpoint(): string {
  if (typeof window === "undefined") return "http://localhost:3001";

  // Explicit override via environment variable
  const envUrl = import.meta.env?.VITE_WS_URL || import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;

  // In local Vite dev environment on port 5173, backend is on port 3001
  if (window.location.port === "5173") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  // Production or reverse-proxied deployments share same origin
  return window.location.origin;
}

/**
 * Create a new Socket.io client instance configured for cookie-based session authentication.
 */
export function createSocketClient(token?: string): Socket {
  const endpoint = getSocketEndpoint();

  return io(endpoint, {
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

