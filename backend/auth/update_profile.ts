import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { requireAuth } from "./permissions";

export interface UpdateProfileRequest {
  token: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Updates the current user's profile.
export const updateProfile = api<UpdateProfileRequest, User>(
  { expose: true, method: "PUT", path: "/auth/profile", auth: true },
  async (req) => {
    requireAuth();
    // First verify the token and get user ID
    const session = await authDB.queryRow<{ userId: number }>`
      SELECT user_id as "userId"
      FROM user_sessions
      WHERE session_token = ${req.token} AND expires_at > NOW()
    `;

    if (!session) {
      throw APIError.unauthenticated("Invalid or expired token");
    }

    const user = await authDB.queryRow<User>`
      UPDATE users 
      SET 
        first_name = COALESCE(${req.firstName}, first_name),
        last_name = COALESCE(${req.lastName}, last_name),
        email = COALESCE(${req.email}, email),
        updated_at = NOW()
      WHERE id = ${session.userId}
      RETURNING id, email, first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    return user;
  }
);
