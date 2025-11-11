import { api } from "encore.dev/api";
import { authDB } from "./db";
import { requireRole } from "./permissions";

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "accountant" | "sales" | "purchasing" | "user";
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

// Creates a new user.
export const createUser = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users", auth: true },
  async (req) => {
    requireRole(["admin"]);
    // In a real app, you'd hash the password properly
    const passwordHash = `hashed_${req.password}`;
    
    const user = await authDB.queryRow<User>`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES (${req.email}, ${passwordHash}, ${req.firstName}, ${req.lastName}, ${req.role})
      RETURNING id, email, first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    return user!;
  }
);
