import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export const deleteProduct = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/products/:id" },
  async (req) => {
    await inventoryDB.exec`
      DELETE FROM products WHERE id = ${req.id}
    `;
  }
);