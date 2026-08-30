import jwt from "jsonwebtoken";
import config from "../config";
import { UserRole } from "@agnidrishti/shared-types";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Sign a JWT token with user payload.
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}

