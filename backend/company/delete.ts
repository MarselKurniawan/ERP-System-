import { api } from "encore.dev/api";
import { companyDB } from "./db";

export const deleteCompany = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/companies/:id" },
  async (req) => {
    await companyDB.exec`
      DELETE FROM companies WHERE id = ${req.id}
    `;
  }
);