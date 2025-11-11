import { api } from "encore.dev/api";
import { inventoryDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteProduct = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/products/:id", auth: true },
  async (req) => {
    requireRole(["admin", "manager"]);
    await inventoryDB.exec`
      DELETE FROM products WHERE id = ${req.id}
    `;
  }
);