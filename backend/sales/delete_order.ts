import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteOrder = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/sales-orders/:id", auth: true },
  async (req) => {
    requireRole(["admin", "sales", "manager"]);
    await salesDB.exec`
      DELETE FROM sales_orders WHERE id = ${req.id}
    `;
  }
);