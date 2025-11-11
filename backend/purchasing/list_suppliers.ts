import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireAuth } from "../auth/permissions";

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

export interface ListSuppliersResponse {
  suppliers: Supplier[];
}

// Retrieves all active suppliers.
export const listSuppliers = api<void, ListSuppliersResponse>(
  { expose: true, method: "GET", path: "/suppliers", auth: true },
  async () => {
    requireAuth();
    const suppliers = await purchasingDB.queryAll<Supplier>`
      SELECT id, name, email, phone, address, tax_id as "taxId", payment_terms as "paymentTerms", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM suppliers
      WHERE is_active = TRUE
      ORDER BY name
    `;
    return { suppliers };
  }
);
