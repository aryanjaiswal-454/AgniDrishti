import jwt from "jsonwebtoken";
import { vi } from "vitest";
import { AuthenticationError, ForbiddenError } from "../src/utils/errors";

/**
 * API route tests use locally signed fixture tokens.  Runtime verification stays
 * Firebase-only; this adapter simply represents Firebase Admin at the test
 * boundary so route tests do not depend on a real Firebase project or network.
 */
vi.mock("../src/config/firebase", () => ({
  firebaseAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded === "string" || !decoded.email) {
        throw new Error("Invalid Firebase test token");
      }

      return {
        uid: decoded.userId ?? decoded.sub ?? "test-user",
        email: decoded.email,
        name: decoded.name,
      };
    }),
  },
}));

// Route tests exercise authorization with local fixture claims.  The production
// middleware is separately covered by Firebase-backed runtime verification.
vi.mock("../src/middleware/auth", () => {
  const decodeFixture = (token: string) => {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === "string") throw new Error("Invalid Firebase test token");
    return decoded;
  };

  return {
    authenticate: (req: any, _res: unknown, next: (error?: Error) => void) => {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) return next(new AuthenticationError("Authentication token is missing or not provided"));
      try {
        const decoded = decodeFixture(header.substring(7));
        req.user = { userId: decoded.userId, email: decoded.email, name: decoded.name, role: decoded.role };
        next();
      } catch {
        next(new AuthenticationError("Invalid authentication token"));
      }
    },
    optionalAuthenticate: (req: any, _res: unknown, next: () => void) => next(),
    requireRole: (...allowedRoles: string[]) => (req: any, _res: unknown, next: (error?: Error) => void) => {
      if (!req.user) return next(new AuthenticationError("Authentication required"));
      if (!allowedRoles.includes(req.user.role)) return next(new ForbiddenError("Access denied"));
      next();
    },
  };
});
