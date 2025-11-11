import { api, APIError } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface UpdateSupplierRequest {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  isActive?: boolean;
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

// Updates a supplier.
export const updateSupplier = api<UpdateSupplierRequest, Supplier>(
  { expose: true, method: "PUT", path: "/suppliers/:id", auth: true },
  async (req) => {
    requireRole(["admin", "purchasing", "manager"]);
    const supplier = await purchasingDB.queryRow<Supplier>`
      UPDATE suppliers 
      SET 
        name = COALESCE(${req.name}, name),
        email = COALESCE(${req.email}, email),
        phone = COALESCE(${req.phone}, phone),
        address = COALESCE(${req.address}, address),
        tax_id = COALESCE(${req.taxId}, tax_id),
        payment_terms = COALESCE(${req.paymentTerms}, payment_terms),
        is_active = COALESCE(${req.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, name, email, phone, address, tax_id as "taxId", payment_terms as "paymentTerms", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!supplier) {
      throw APIError.notFound("Supplier not found");
    }
    
    return supplier;
  }
);
