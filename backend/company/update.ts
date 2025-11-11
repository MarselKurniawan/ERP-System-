import { api, APIError } from "encore.dev/api";
import { companyDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface UpdateCompanyRequest {
  id: number;
  name?: string;
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

// Updates a company.
export const update = api<UpdateCompanyRequest, Company>(
  { expose: true, method: "PUT", path: "/companies/:id", auth: true },
  async (req) => {
    requireRole(["admin"]);
    const company = await companyDB.queryRow<Company>`
      UPDATE companies 
      SET 
        name = COALESCE(${req.name}, name),
        address = COALESCE(${req.address}, address),
        phone = COALESCE(${req.phone}, phone),
        email = COALESCE(${req.email}, email),
        tax_id = COALESCE(${req.taxId}, tax_id),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, name, address, phone, email, tax_id as "taxId", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!company) {
      throw APIError.notFound("Company not found");
    }

    if (req.currency || req.fiscalYearStart) {
      await companyDB.exec`
        UPDATE company_settings 
        SET 
          currency = COALESCE(${req.currency}, currency),
          fiscal_year_start = COALESCE(${req.fiscalYearStart}, fiscal_year_start),
          updated_at = NOW()
        WHERE company_id = ${req.id}
      `;
    }
    
    return company;
  }
);
