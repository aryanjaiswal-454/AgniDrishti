import { Request, Response, NextFunction } from "express";
import { AuthenticationError, ForbiddenError } from "../utils/errors";
import { UserRole, User } from "@agnidrishti/shared-types";
import { firebaseAuth } from "../config/firebase";
import { query } from "../db";
import { JWTPayload } from "../utils/jwt";

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware: extracts Firebase ID token from Authorization header,
 * verifies it, and syncs/fetches the user role from PostgreSQL.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return next(new AuthenticationError("Authentication token is missing or not provided"));
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);

    // We expect the email to act as the primary unique identifier for synchronization
    const email = decoded.email;
    if (!email) {
      return next(new AuthenticationError("Token does not contain an email address"));
    }

    // Try to find the user in PostgreSQL
    let res = await query<User>("SELECT id, name, email, role, created_at FROM users WHERE LOWER(email) = LOWER($1);", [email]);
    let dbUser = res.rows[0];

    if (!dbUser) {
      // Auto-create user for first-time Firebase logins
      // Uses database default role (currently 'admin' for development)
      const name = decoded.name || email.split("@")[0] || "Firebase User";
      const insertRes = await query<User>(
        `INSERT INTO users (name, email, auth_provider)
         VALUES ($1, $2, 'firebase')
         RETURNING id, name, email, role, created_at;`,
        [name, email]
      );
      dbUser = insertRes.rows[0];
      console.log('Auto-created new user:', dbUser.email, 'with role:', dbUser.role);
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole
    };
    next();
  } catch (err: any) {
    console.error("Firebase auth error:", err.message);
    if (err.code === "auth/id-token-expired") {
      return next(new AuthenticationError("Authentication token has expired"));
    }
    return next(new AuthenticationError("Invalid authentication token"));
  }
}

/**
 * Optional authentication: attaches user if token is valid, but does not block if absent.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7);
  }

  if (token) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      if (decoded.email) {
        const res = await query<User>("SELECT id, name, email, role, created_at FROM users WHERE LOWER(email) = LOWER($1);", [decoded.email]);
        const dbUser = res.rows[0];
        if (dbUser) {
          req.user = {
            userId: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as UserRole
          };
        }
      }
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
