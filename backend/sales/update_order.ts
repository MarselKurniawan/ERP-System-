import { api, APIError } from "encore.dev/api";
import { salesDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface UpdateSalesOrderRequest {
  id: number;
  status?: "draft" | "confirmed" | "shipped" | "delivered" | "cancelled";
  notes?: string;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  orderDate: Date;
  dueDate?: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Updates a sales order.
export const updateOrder = api<UpdateSalesOrderRequest, SalesOrder>(
  { expose: true, method: "PUT", path: "/sales-orders/:id", auth: true },
  async (req) => {
    requireRole(["admin", "sales", "manager"]);
    const order = await salesDB.queryRow<SalesOrder>`
      UPDATE sales_orders 
      SET 
        status = COALESCE(${req.status}, status),
        notes = COALESCE(${req.notes}, notes),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, order_number as "orderNumber", customer_id as "customerId", order_date as "orderDate", due_date as "dueDate", status, subtotal, tax_amount as "taxAmount", discount_amount as "discountAmount", total_amount as "totalAmount", notes, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!order) {
      throw APIError.notFound("Sales order not found");
    }
    
    return order;
  }
);
