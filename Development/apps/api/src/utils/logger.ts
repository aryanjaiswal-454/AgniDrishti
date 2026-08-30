import config from "../config";

type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "token",
  "jwt",
  "authorization",
  "cookie",
  "secret",
  "firms_map_key",
]);

function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatLog(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service: "agnidrishti-api",
    message,
    ...(meta ? { meta: sanitize(meta) } : {}),
  };

  if (config.isProduction) {
    return JSON.stringify(logEntry);
  }

  // Development formatting
  const metaStr = meta ? ` ${JSON.stringify(sanitize(meta))}` : "";
  const color =
    level === "error"
      ? "\x1b[31m"
      : level === "warn"
      ? "\x1b[33m"
      : level === "debug"
      ? "\x1b[34m"
      : "\x1b[32m";
  return `${color}[${timestamp}] [${level.toUpperCase()}]\x1b[0m ${message}${metaStr}`;
}

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(formatLog("info", message, meta));
  },
  warn: (message: string, meta?: any) => {
    console.warn(formatLog("warn", message, meta));
  },
  error: (message: string, meta?: any) => {
    console.error(formatLog("error", message, meta));
  },
  debug: (message: string, meta?: any) => {
    if (!config.isProduction) {
      console.debug(formatLog("debug", message, meta));
    }
  },
};

export default logger;

