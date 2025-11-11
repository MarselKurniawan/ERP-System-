import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface CreateSupplierRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new supplier.
export const createSupplier = api<CreateSupplierRequest, Supplier>(
  { expose: true, method: "POST", path: "/suppliers", auth: true },
  async (req) => {
    requireRole(["admin", "purchasing", "manager"]);
    const supplier = await purchasingDB.queryRow<Supplier>`
      INSERT INTO suppliers (name, email, phone, address, tax_id, payment_terms)
      VALUES (${req.name}, ${req.email || null}, ${req.phone || null}, ${req.address || null}, ${req.taxId || null}, ${req.paymentTerms || null})
      RETURNING id, name, email, phone, address, tax_id as "taxId", payment_terms as "paymentTerms", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    return supplier!;
  }
);
