import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt";
import { AuthenticationError, ForbiddenError } from "../utils/errors";
import { UserRole } from "@agnidrishti/shared-types";
import config from "../config";

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware: extracts JWT from httpOnly cookie or Authorization header.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check httpOnly cookie
  if (req.cookies && req.cookies[config.jwt.cookieName]) {
    token = req.cookies[config.jwt.cookieName];
  }

  // 2. Check Authorization header as fallback (Bearer <token>)
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return next(new AuthenticationError("Authentication token is missing or not provided"));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new AuthenticationError("Authentication token has expired"));
    }
    return next(new AuthenticationError("Invalid authentication token"));
  }
}

/**
 * Optional authentication: attaches user if token is valid, but does not block if absent.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.cookies && req.cookies[config.jwt.cookieName]) {
    token = req.cookies[config.jwt.cookieName];
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7);
  }

  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Ignore invalid optional tokens
    }
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware: checks if authenticated user has required role(s).
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
}

