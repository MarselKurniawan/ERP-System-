import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export const deleteCategory = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/categories/:id" },
  async (req) => {
    await inventoryDB.exec`
      DELETE FROM categories WHERE id = ${req.id}
    `;
  }
);