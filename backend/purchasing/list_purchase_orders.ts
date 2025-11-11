import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireAuth } from "../auth/permissions";

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: Date;
  expectedDate?: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPurchaseOrdersResponse {
  orders: PurchaseOrder[];
}

// Retrieves all purchase orders with supplier information.
export const listPurchaseOrders = api<void, ListPurchaseOrdersResponse>(
  { expose: true, method: "GET", path: "/purchase-orders", auth: true },
  async () => {
    requireAuth();
    const orders = await purchasingDB.queryAll<PurchaseOrder>`
      SELECT 
        po.id, po.order_number as "orderNumber", po.supplier_id as "supplierId", s.name as "supplierName",
        po.order_date as "orderDate", po.expected_date as "expectedDate", po.status,
        po.subtotal, po.tax_amount as "taxAmount", po.discount_amount as "discountAmount", po.total_amount as "totalAmount",
        po.notes, po.created_at as "createdAt", po.updated_at as "updatedAt"
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
    `;
    return { orders };
  }
);
