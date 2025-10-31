import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { purchasingDB } from "./db";

export interface SupplierInvoiceDetail {
  id: number;
  supplier_id: number;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    product_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments: Array<{
    id: number;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }>;
}

export const listSupplierInvoices = api(
  { method: "GET", path: "/purchasing/supplier-invoices", expose: true, auth: true },
  async (): Promise<{ invoices: SupplierInvoiceDetail[] }> => {
    getAuthData();

    const invoiceRows = [];
    for await (const row of purchasingDB.query`
      SELECT si.*, s.name as supplier_name,
              si.total_amount - si.paid_amount as balance_due
       FROM supplier_invoices si
       JOIN suppliers s ON si.supplier_id = s.id
       ORDER BY si.invoice_date DESC, si.id DESC
    `) {
      invoiceRows.push(row);
    }

    const invoices: SupplierInvoiceDetail[] = [];

    for (const row of invoiceRows) {
      const itemRows = [];
      for await (const item of purchasingDB.query`
        SELECT * FROM supplier_invoice_items WHERE invoice_id = ${row.id} ORDER BY id
      `) {
        itemRows.push(item);
      }

      const paymentRows = [];
      for await (const payment of purchasingDB.query`
        SELECT * FROM supplier_invoice_payments WHERE invoice_id = ${row.id} ORDER BY payment_date DESC
      `) {
        paymentRows.push(payment);
      }

      invoices.push({
        id: row.id,
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        invoice_number: row.invoice_number,
        invoice_date: row.invoice_date,
        due_date: row.due_date,
        subtotal: parseFloat(row.subtotal),
        tax_amount: parseFloat(row.tax_amount),
        total_amount: parseFloat(row.total_amount),
        paid_amount: parseFloat(row.paid_amount),
        balance_due: parseFloat(row.balance_due),
        status: row.status,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        items: itemRows.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.total_price),
        })),
        payments: paymentRows.map((payment: any) => ({
          id: payment.id,
          payment_date: payment.payment_date,
          amount: parseFloat(payment.amount),
          payment_method: payment.payment_method,
          reference_number: payment.reference_number,
          notes: payment.notes,
        })),
      });
    }

    return { invoices };
  }
);
