import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Verifies a session token and returns user information.
export const verifyToken = api<VerifyTokenRequest, VerifyTokenResponse>(
  { expose: true, method: "POST", path: "/auth/verify" },
  async (req) => {
    const session = await authDB.queryRow<{
      userId: number;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      expiresAt: Date;
    }>`
      SELECT 
        us.user_id as "userId",
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.role,
        us.expires_at as "expiresAt"
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = ${req.token} AND us.expires_at > NOW() AND u.is_active = TRUE
    `;

    if (!session) {
      throw APIError.unauthenticated("Invalid or expired token");
    }

    return {
      user: {
        id: session.userId,
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        role: session.role,
      },
    };
  }
);
