import { api, APIError } from "encore.dev/api";
import { companyDB } from "./db";

// Deletes a company.
export const deleteCompany = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/companies/:id" },
  async (req) => {
    const result = await companyDB.exec`
      DELETE FROM companies WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Company not found");
    }
  }
);
