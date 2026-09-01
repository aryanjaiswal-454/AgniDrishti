import bcrypt from "bcryptjs";
import { query } from "../db";
import { ConflictError, NotFoundError } from "../utils/errors";
import { RegisterInput } from "../schemas/auth.schema";
import { User } from "@agnidrishti/shared-types";

export class AuthService {
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
      `INSERT INTO users (name, email, password_hash, role, auth_provider)
       VALUES ($1, $2, $3, $4, 'local')
       RETURNING id, name, email, role, created_at;`,
      [input.name, input.email, passwordHash, input.role]
    );

    return res.rows[0];
  }
}
