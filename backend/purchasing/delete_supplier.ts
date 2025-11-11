import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteSupplier = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/suppliers/:id", auth: true },
  async (req) => {
    requireRole(["admin", "manager"]);
    await purchasingDB.exec`
      DELETE FROM suppliers WHERE id = ${req.id}
    `;
  }
);