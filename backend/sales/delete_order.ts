import { api } from "encore.dev/api";
import { salesDB } from "./db";

export const deleteOrder = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/sales-orders/:id" },
  async (req) => {
    await salesDB.exec`
      DELETE FROM sales_orders WHERE id = ${req.id}
    `;
  }
);