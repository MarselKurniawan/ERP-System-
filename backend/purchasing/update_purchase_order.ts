import { api, APIError } from "encore.dev/api";
import { purchasingDB } from "./db";

export interface UpdatePurchaseOrderRequest {
  id: number;
  status?: "draft" | "sent" | "confirmed" | "received" | "cancelled";
  notes?: string;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
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

// Updates a purchase order.
export const updatePurchaseOrder = api<UpdatePurchaseOrderRequest, PurchaseOrder>(
  { expose: true, method: "PUT", path: "/purchase-orders/:id" },
  async (req) => {
    const order = await purchasingDB.queryRow<PurchaseOrder>`
      UPDATE purchase_orders 
      SET 
        status = COALESCE(${req.status}, status),
        notes = COALESCE(${req.notes}, notes),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, order_number as "orderNumber", supplier_id as "supplierId", order_date as "orderDate", expected_date as "expectedDate", status, subtotal, tax_amount as "taxAmount", discount_amount as "discountAmount", total_amount as "totalAmount", notes, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!order) {
      throw APIError.notFound("Purchase order not found");
    }
    
    return order;
  }
);
