import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteCustomer = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/customers/:id", auth: true },
  async (req) => {
    requireRole(["admin", "manager"]);
    await salesDB.exec`
      DELETE FROM customers WHERE id = ${req.id}
    `;
  }
);