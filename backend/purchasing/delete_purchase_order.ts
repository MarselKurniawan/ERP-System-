import { api } from "encore.dev/api";
import { purchasingDB } from "./db";

export const deletePurchaseOrder = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/purchase-orders/:id" },
  async (req) => {
    await purchasingDB.exec`
      DELETE FROM purchase_orders WHERE id = ${req.id}
    `;
  }
);