import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

// Deletes a user.
export const deleteUser = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/users/:id" },
  async (req) => {
    const result = await authDB.exec`
      DELETE FROM users WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("User not found");
    }
  }
);
