import { api } from "encore.dev/api";
import { authDB } from "./db";

export const deleteUser = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/users/:id" },
  async (req) => {
    await authDB.exec`
      DELETE FROM users WHERE id = ${req.id}
    `;
  }
);