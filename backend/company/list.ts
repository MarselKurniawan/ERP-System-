import { api } from "encore.dev/api";
import { companyDB } from "./db";

export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCompaniesResponse {
  companies: Company[];
}

// Retrieves all companies.
export const list = api<void, ListCompaniesResponse>(
  { expose: true, method: "GET", path: "/companies" },
  async () => {
    const companies = await companyDB.queryAll<Company>`
      SELECT id, name, address, phone, email, tax_id as "taxId", created_at as "createdAt", updated_at as "updatedAt"
      FROM companies
      ORDER BY name
    `;
    return { companies };
  }
);
