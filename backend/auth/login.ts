import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
}

// Authenticates a user and returns a session token.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    // In a real app, you'd properly hash and verify the password
    const user = await authDB.queryRow<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      passwordHash: string;
      isActive: boolean;
    }>`
      SELECT id, email, first_name as "firstName", last_name as "lastName", role, password_hash as "passwordHash", is_active as "isActive"
      FROM users
      WHERE email = ${req.email} AND is_active = TRUE
    `;

    if (!user) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Simple password check (in production, use proper bcrypt comparison)
    const expectedHash = `hashed_${req.password}`;
    if (user.passwordHash !== expectedHash) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    // Generate session token
    const sessionToken = `session_${user.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await authDB.exec`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `;

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: sessionToken,
    };
  }
);
