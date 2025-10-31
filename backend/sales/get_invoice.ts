import { api, APIError } from "encore.dev/api";
import { salesDB } from "./db";

export interface InvoiceItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface InvoiceDetail {
  id: number;
  invoiceNumber: string;
  salesOrderId: number | null;
  salesOrderNumber: string | null;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  invoiceDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export const getInvoice = api<{ id: number }, InvoiceDetail>(
  { expose: true, method: "GET", path: "/invoices/:id" },
  async (req) => {
    const invoiceRow = await salesDB.queryRow<any>`
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        so.order_number as sales_order_number
      FROM invoices i
      INNER JOIN customers c ON i.customer_id = c.id
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      WHERE i.id = ${req.id}
    `;

    if (!invoiceRow) {
      throw APIError.notFound("Invoice not found");
    }

    const items: InvoiceItem[] = [];
    for await (const row of salesDB.query<any>`
      SELECT * FROM invoice_items WHERE invoice_id = ${req.id} ORDER BY id
    `) {
      items.push({
        id: row.id,
        productId: row.product_id,
        productSku: row.product_sku,
        productName: row.product_name,
        quantity: row.quantity,
        unitPrice: parseFloat(row.unit_price),
        discountAmount: parseFloat(row.discount_amount),
        lineTotal: parseFloat(row.line_total)
      });
    }

    return {
      id: invoiceRow.id,
      invoiceNumber: invoiceRow.invoice_number,
      salesOrderId: invoiceRow.sales_order_id,
      salesOrderNumber: invoiceRow.sales_order_number,
      customerId: invoiceRow.customer_id,
      customerName: invoiceRow.customer_name,
      customerEmail: invoiceRow.customer_email,
      customerPhone: invoiceRow.customer_phone,
      customerAddress: invoiceRow.customer_address,
      invoiceDate: invoiceRow.invoice_date,
      dueDate: invoiceRow.due_date,
      status: invoiceRow.status,
      subtotal: parseFloat(invoiceRow.subtotal),
      taxAmount: parseFloat(invoiceRow.tax_amount),
      discountAmount: parseFloat(invoiceRow.discount_amount),
      totalAmount: parseFloat(invoiceRow.total_amount),
      paidAmount: parseFloat(invoiceRow.paid_amount),
      notes: invoiceRow.notes,
      items,
      createdAt: invoiceRow.created_at,
      updatedAt: invoiceRow.updated_at
    };
  }
);