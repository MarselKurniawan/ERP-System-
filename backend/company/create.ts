import { api } from "encore.dev/api";
import { companyDB } from "./db";

export interface CreateCompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency?: string;
  fiscalYearStart?: number;
}

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

// Creates a new company.
export const create = api<CreateCompanyRequest, Company>(
  { expose: true, method: "POST", path: "/companies" },
  async (req) => {
    const company = await companyDB.queryRow<Company>`
      INSERT INTO companies (name, address, phone, email, tax_id)
      VALUES (${req.name}, ${req.address || null}, ${req.phone || null}, ${req.email || null}, ${req.taxId || null})
      RETURNING id, name, address, phone, email, tax_id as "taxId", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (company) {
      await companyDB.exec`
        INSERT INTO company_settings (company_id, currency, fiscal_year_start)
        VALUES (${company.id}, ${req.currency || 'USD'}, ${req.fiscalYearStart || 1})
      `;
    }

    return company!;
  }
);
