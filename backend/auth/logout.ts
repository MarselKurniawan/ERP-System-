import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface LogoutRequest {
  token: string;
}

// Logs out a user by invalidating their session token.
export const logout = api<LogoutRequest, void>(
  { expose: true, method: "POST", path: "/auth/logout" },
  async (req) => {
    await authDB.exec`
      DELETE FROM user_sessions WHERE session_token = ${req.token}
    `;
  }
);
