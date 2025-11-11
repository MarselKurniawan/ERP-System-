import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deletePurchaseOrder = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/purchase-orders/:id", auth: true },
  async (req) => {
    requireRole(["admin", "manager"]);
    await purchasingDB.exec`
      DELETE FROM purchase_orders WHERE id = ${req.id}
    `;
  }
);