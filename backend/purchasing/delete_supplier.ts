import { api } from "encore.dev/api";
import { purchasingDB } from "./db";

export const deleteSupplier = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/suppliers/:id" },
  async (req) => {
    await purchasingDB.exec`
      DELETE FROM suppliers WHERE id = ${req.id}
    `;
  }
);