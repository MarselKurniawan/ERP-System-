import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
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

export interface ListSalesOrdersResponse {
  orders: SalesOrder[];
}

// Retrieves all sales orders with customer information.
export const listOrders = api<void, ListSalesOrdersResponse>(
  { expose: true, method: "GET", path: "/sales-orders" },
  async () => {
    const orders = await salesDB.queryAll<SalesOrder>`
      SELECT 
        so.id, so.order_number as "orderNumber", so.customer_id as "customerId", c.name as "customerName",
        so.order_date as "orderDate", so.due_date as "dueDate", so.status,
        so.subtotal, so.tax_amount as "taxAmount", so.discount_amount as "discountAmount", so.total_amount as "totalAmount",
        so.notes, so.created_at as "createdAt", so.updated_at as "updatedAt"
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      ORDER BY so.created_at DESC
    `;
    return { orders };
  }
);
