import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface UpdateUserRequest {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "manager" | "accountant" | "sales" | "purchasing" | "user";
  isActive?: boolean;
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

// Updates a user.
export const updateUser = api<UpdateUserRequest, User>(
  { expose: true, method: "PUT", path: "/users/:id" },
  async (req) => {
    const user = await authDB.queryRow<User>`
      UPDATE users 
      SET 
        email = COALESCE(${req.email}, email),
        first_name = COALESCE(${req.firstName}, first_name),
        last_name = COALESCE(${req.lastName}, last_name),
        role = COALESCE(${req.role}, role),
        is_active = COALESCE(${req.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, email, first_name as "firstName", last_name as "lastName", role, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!user) {
      throw APIError.notFound("User not found");
    }
    
    return user;
  }
);
