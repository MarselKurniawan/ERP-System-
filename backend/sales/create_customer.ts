import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit?: number;
}

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

// Creates a new customer.
export const createCustomer = api<CreateCustomerRequest, Customer>(
  { expose: true, method: "POST", path: "/customers" },
  async (req) => {
    const customer = await salesDB.queryRow<Customer>`
      INSERT INTO customers (name, email, phone, address, tax_id, credit_limit)
      VALUES (${req.name}, ${req.email || null}, ${req.phone || null}, ${req.address || null}, ${req.taxId || null}, ${req.creditLimit || 0})
      RETURNING id, name, email, phone, address, tax_id as "taxId", credit_limit as "creditLimit", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    return customer!;
  }
);
