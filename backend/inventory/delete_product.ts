import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";

// Deletes a product.
export const deleteProduct = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/products/:id" },
  async (req) => {
    const result = await inventoryDB.exec`
      DELETE FROM products WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Product not found");
    }
  }
);
