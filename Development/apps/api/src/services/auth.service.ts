import bcrypt from "bcryptjs";
import { query } from "../db";
import { signToken, JWTPayload } from "../utils/jwt";
import { AuthenticationError, ConflictError, NotFoundError } from "../utils/errors";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { User } from "@agnidrishti/shared-types";

export class AuthService {
  /**
   * Authenticate user by email and password, returning user info and signed JWT.
   */
  static async login(input: LoginInput): Promise<{ user: Omit<User, "password_hash">; token: string }> {
    const res = await query<User>(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE LOWER(email) = LOWER($1);",
      [input.email]
    );

    const user = res.rows[0];
    if (!user || !user.password_hash) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError("Invalid email or password");
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signToken(payload);

    const { password_hash, ...userProfile } = user;
    return { user: userProfile, token };
  }

  /**
   * Get user profile by ID.
   */
  static async getCurrentUser(userId: string): Promise<Omit<User, "password_hash">> {
    const res = await query<User>(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1;",
      [userId]
    );

    const user = res.rows[0];
    if (!user) {
      throw new NotFoundError("User profile not found");
    }

    return user;
  }

  /**
   * Admin-only user registration.
   */
  static async register(input: RegisterInput): Promise<Omit<User, "password_hash">> {
    const existing = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1);",
      [input.email]
    );

    if (existing.rows.length > 0) {
      throw new ConflictError("A user with this email address already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const res = await query<User>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at;`,
      [input.name, input.email, passwordHash, input.role]
    );

    return res.rows[0];
  }
}

