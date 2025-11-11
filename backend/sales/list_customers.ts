import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { requireAuth } from "../auth/permissions";

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCustomersResponse {
  customers: Customer[];
}

// Retrieves all active customers.
export const listCustomers = api<void, ListCustomersResponse>(
  { expose: true, method: "GET", path: "/customers", auth: true },
  async () => {
    requireAuth();
    const customers = await salesDB.queryAll<Customer>`
      SELECT id, name, email, phone, address, tax_id as "taxId", credit_limit as "creditLimit", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM customers
      WHERE is_active = TRUE
      ORDER BY name
    `;
    return { customers };
  }
);
