import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { requireAuth } from "../auth/permissions";

export interface Invoice {
  id: number;
  invoiceNumber: string;
  salesOrderId: number | null;
  customerId: number;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
}

export const listInvoices = api<void, InvoiceListResponse>(
  { expose: true, method: "GET", path: "/invoices", auth: true },
  async () => {
    requireAuth();
    const query = `
      SELECT 
        i.*,
        c.name as customer_name
      FROM invoices i
      INNER JOIN customers c ON i.customer_id = c.id
      ORDER BY i.invoice_date DESC, i.invoice_number DESC
    `;

    const rows = [];
    for await (const row of salesDB.query<any>`SELECT 
        i.*,
        c.name as customer_name
      FROM invoices i
      INNER JOIN customers c ON i.customer_id = c.id
      ORDER BY i.invoice_date DESC, i.invoice_number DESC`) {
      rows.push({
        id: row.id,
        invoiceNumber: row.invoice_number,
        salesOrderId: row.sales_order_id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        invoiceDate: row.invoice_date,
        dueDate: row.due_date,
        status: row.status,
        subtotal: parseFloat(row.subtotal),
        taxAmount: parseFloat(row.tax_amount),
        discountAmount: parseFloat(row.discount_amount),
        totalAmount: parseFloat(row.total_amount),
        paidAmount: parseFloat(row.paid_amount),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    }

    return { invoices: rows };
  }
);