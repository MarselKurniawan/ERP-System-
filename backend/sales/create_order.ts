import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface CreateSalesOrderRequest {
  customerId: number;
  orderDate: Date;
  dueDate?: Date;
  items: OrderItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
}

export interface OrderItem {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
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

// Creates a new sales order.
export const createOrder = api<CreateSalesOrderRequest, SalesOrder>(
  { expose: true, method: "POST", path: "/sales-orders", auth: true },
  async (req) => {
    requireRole(["admin", "sales", "manager"]);
    return await salesDB.begin().then(async (tx) => {
      try {
        const orderNumber = `SO-${Date.now()}`;
        
        let subtotal = 0;
        for (const item of req.items) {
          const lineTotal = (item.quantity * item.unitPrice) - (item.discountAmount || 0);
          subtotal += lineTotal;
        }

        const taxAmount = subtotal * (req.taxRate || 0) / 100;
        const totalAmount = subtotal + taxAmount - (req.discountAmount || 0);

        const order = await tx.queryRow<SalesOrder>`
          INSERT INTO sales_orders (order_number, customer_id, order_date, due_date, subtotal, tax_amount, discount_amount, total_amount, notes)
          VALUES (${orderNumber}, ${req.customerId}, ${req.orderDate}, ${req.dueDate || null}, ${subtotal}, ${taxAmount}, ${req.discountAmount || 0}, ${totalAmount}, ${req.notes || null})
          RETURNING id, order_number as "orderNumber", customer_id as "customerId", order_date as "orderDate", due_date as "dueDate", status, subtotal, tax_amount as "taxAmount", discount_amount as "discountAmount", total_amount as "totalAmount", notes, created_at as "createdAt", updated_at as "updatedAt"
        `;

        for (const item of req.items) {
          const lineTotal = (item.quantity * item.unitPrice) - (item.discountAmount || 0);
          await tx.exec`
            INSERT INTO sales_order_items (sales_order_id, product_id, product_sku, product_name, quantity, unit_price, discount_amount, line_total)
            VALUES (${order!.id}, ${item.productId}, ${item.productSku}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${item.discountAmount || 0}, ${lineTotal})
          `;
        }

        await tx.commit();
        return order!;
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    });
  }
);
