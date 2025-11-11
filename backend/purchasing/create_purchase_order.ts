import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  orderDate: Date;
  expectedDate?: Date;
  items: PurchaseOrderItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
}

export interface PurchaseOrderItem {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
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

// Creates a new purchase order.
export const createPurchaseOrder = api<CreatePurchaseOrderRequest, PurchaseOrder>(
  { expose: true, method: "POST", path: "/purchase-orders", auth: true },
  async (req) => {
    requireRole(["admin", "purchasing", "manager"]);
    return await purchasingDB.begin().then(async (tx) => {
      try {
        const orderNumber = `PO-${Date.now()}`;
        
        let subtotal = 0;
        for (const item of req.items) {
          const lineTotal = (item.quantity * item.unitPrice) - (item.discountAmount || 0);
          subtotal += lineTotal;
        }

        const taxAmount = subtotal * (req.taxRate || 0) / 100;
        const totalAmount = subtotal + taxAmount - (req.discountAmount || 0);

        const order = await tx.queryRow<PurchaseOrder>`
          INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_date, subtotal, tax_amount, discount_amount, total_amount, notes)
          VALUES (${orderNumber}, ${req.supplierId}, ${req.orderDate}, ${req.expectedDate || null}, ${subtotal}, ${taxAmount}, ${req.discountAmount || 0}, ${totalAmount}, ${req.notes || null})
          RETURNING id, order_number as "orderNumber", supplier_id as "supplierId", order_date as "orderDate", expected_date as "expectedDate", status, subtotal, tax_amount as "taxAmount", discount_amount as "discountAmount", total_amount as "totalAmount", notes, created_at as "createdAt", updated_at as "updatedAt"
        `;

        for (const item of req.items) {
          const lineTotal = (item.quantity * item.unitPrice) - (item.discountAmount || 0);
          await tx.exec`
            INSERT INTO purchase_order_items (purchase_order_id, product_id, product_sku, product_name, quantity, unit_price, discount_amount, line_total)
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
