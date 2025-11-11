import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  role: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    const session = await authDB.queryRow<{
      userId: number;
      email: string;
      role: string;
      expiresAt: Date;
    }>`
      SELECT 
        us.user_id as "userId",
        u.email,
        u.role,
        us.expires_at as "expiresAt"
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = ${token} AND us.expires_at > NOW() AND u.is_active = TRUE
    `;

    if (!session) {
      throw APIError.unauthenticated("invalid or expired token");
    }

    return {
      userID: session.userId.toString(),
      email: session.email,
      role: session.role,
    };
  }
);

export const gw = new Gateway({ authHandler: auth });
