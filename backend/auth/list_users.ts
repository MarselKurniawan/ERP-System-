import { api } from "encore.dev/api";
import { authDB } from "./db";

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

export interface ListUsersResponse {
  users: User[];
}

// Retrieves all users.
export const listUsers = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users" },
  async () => {
    const users = await authDB.queryAll<User>`
      SELECT id, email, first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      ORDER BY created_at DESC
    `;
    return { users };
  }
);
