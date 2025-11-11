import { api } from "encore.dev/api";
import { inventoryDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteCategory = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/categories/:id", auth: true },
  async (req) => {
    requireRole(["admin", "manager"]);
    await inventoryDB.exec`
      DELETE FROM categories WHERE id = ${req.id}
    `;
  }
);