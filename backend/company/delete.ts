import { api } from "encore.dev/api";
import { companyDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteCompany = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/companies/:id", auth: true },
  async (req) => {
    requireRole(["admin"]);
    await companyDB.exec`
      DELETE FROM companies WHERE id = ${req.id}
    `;
  }
);