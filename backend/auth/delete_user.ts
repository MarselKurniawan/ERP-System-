import { api } from "encore.dev/api";
import { authDB } from "./db";
import { requireRole } from "./permissions";

export const deleteUser = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/users/:id", auth: true },
  async (req) => {
    requireRole(["admin"]);
    await authDB.exec`
      DELETE FROM users WHERE id = ${req.id}
    `;
  }
);