import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";

// Deletes a category.
export const deleteCategory = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/categories/:id" },
  async (req) => {
    const result = await inventoryDB.exec`
      DELETE FROM categories WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Category not found");
    }
  }
);
