import { api, APIError } from "encore.dev/api";
import { purchasingDB } from "./db";

// Deletes a purchase order.
export const deletePurchaseOrder = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/purchase-orders/:id" },
  async (req) => {
    const result = await purchasingDB.exec`
      DELETE FROM purchase_orders WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Purchase order not found");
    }
  }
);
