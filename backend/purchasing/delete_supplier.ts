import { api, APIError } from "encore.dev/api";
import { purchasingDB } from "./db";

// Deletes a supplier.
export const deleteSupplier = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/suppliers/:id" },
  async (req) => {
    const result = await purchasingDB.exec`
      DELETE FROM suppliers WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Supplier not found");
    }
  }
);
