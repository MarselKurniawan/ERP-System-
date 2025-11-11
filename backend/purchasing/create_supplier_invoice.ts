import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { accountingDB } from "../accounting/db";

export interface SupplierInvoiceItem {
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateSupplierInvoiceRequest {
  supplier_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  items: SupplierInvoiceItem[];
  tax_amount?: number;
  notes?: string;
}

export interface SupplierInvoice {
  id: number;
  supplier_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const createSupplierInvoice = api(
  { method: "POST", path: "/purchasing/supplier-invoices", expose: true },
  async (req: CreateSupplierInvoiceRequest): Promise<SupplierInvoice> => {

    const subtotal = req.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = req.tax_amount || 0;
    const totalAmount = subtotal + taxAmount;

    const tx = await purchasingDB.begin();
    try {
      const invoice = await tx.queryRow`
        INSERT INTO supplier_invoices 
        (supplier_id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total_amount, notes)
        VALUES (${req.supplier_id}, ${req.invoice_number}, ${req.invoice_date}, ${req.due_date}, ${subtotal}, ${taxAmount}, ${totalAmount}, ${req.notes || null})
        RETURNING *
      `;

      for (const item of req.items) {
        const totalPrice = item.quantity * item.unit_price;
        await tx.exec`
          INSERT INTO supplier_invoice_items 
          (invoice_id, product_id, description, quantity, unit_price, total_price)
          VALUES (${invoice!.id}, ${item.product_id || null}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${totalPrice})
        `;
      }

      const apAccount = await accountingDB.queryRow`
        SELECT id FROM accounts WHERE code = '2100' AND type = 'liability'
      `;

      if (apAccount) {
        const jeResult = await accountingDB.queryRow`
          INSERT INTO journal_entries 
          (entry_date, description, type, reference_type, reference_id)
          VALUES (${req.invoice_date}, ${'Supplier Invoice ' + req.invoice_number}, 'standard', 'supplier_invoice', ${invoice!.id})
          RETURNING id
        `;

        if (jeResult) {
          await accountingDB.exec`
            INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit)
            VALUES 
              (${jeResult.id}, (SELECT id FROM accounts WHERE code = '5100' LIMIT 1), ${totalAmount}, 0),
              (${jeResult.id}, ${apAccount.id}, 0, ${totalAmount})
          `;
        }
      }

      await tx.commit();

      return {
        id: invoice!.id,
        supplier_id: invoice!.supplier_id,
        invoice_number: invoice!.invoice_number,
        invoice_date: invoice!.invoice_date,
        due_date: invoice!.due_date,
        subtotal: parseFloat(invoice!.subtotal),
        tax_amount: parseFloat(invoice!.tax_amount),
        total_amount: parseFloat(invoice!.total_amount),
        paid_amount: parseFloat(invoice!.paid_amount),
        status: invoice!.status,
        notes: invoice!.notes,
        created_at: invoice!.created_at,
        updated_at: invoice!.updated_at,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
