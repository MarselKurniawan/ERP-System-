import { api, APIError } from "encore.dev/api";
import { salesDB } from "./db";

// Deletes a sales order.
export const deleteOrder = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/sales-orders/:id" },
  async (req) => {
    const result = await salesDB.exec`
      DELETE FROM sales_orders WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Sales order not found");
    }
  }
);
