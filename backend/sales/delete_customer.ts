import { api } from "encore.dev/api";
import { salesDB } from "./db";

export const deleteCustomer = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/customers/:id" },
  async (req) => {
    await salesDB.exec`
      DELETE FROM customers WHERE id = ${req.id}
    `;
  }
);