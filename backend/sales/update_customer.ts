import { api, APIError } from "encore.dev/api";
import { salesDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface UpdateCustomerRequest {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit?: number;
  isActive?: boolean;
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

// Updates a customer.
export const updateCustomer = api<UpdateCustomerRequest, Customer>(
  { expose: true, method: "PUT", path: "/customers/:id", auth: true },
  async (req) => {
    requireRole(["admin", "sales", "manager"]);
    const customer = await salesDB.queryRow<Customer>`
      UPDATE customers 
      SET 
        name = COALESCE(${req.name}, name),
        email = COALESCE(${req.email}, email),
        phone = COALESCE(${req.phone}, phone),
        address = COALESCE(${req.address}, address),
        tax_id = COALESCE(${req.taxId}, tax_id),
        credit_limit = COALESCE(${req.creditLimit}, credit_limit),
        is_active = COALESCE(${req.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, name, email, phone, address, tax_id as "taxId", credit_limit as "creditLimit", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!customer) {
      throw APIError.notFound("Customer not found");
    }
    
    return customer;
  }
);
