import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { purchasingDB } from "./db";
import { accountingDB } from "../accounting/db";

export interface PaySupplierInvoiceRequest {
  id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  bank_account_id?: number;
  reference_number?: string;
  notes?: string;
}

export interface SupplierInvoicePayment {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  bank_account_id?: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export const paySupplierInvoice = api(
  { method: "POST", path: "/purchasing/supplier-invoices/:id/pay", expose: true, auth: true },
  async (req: PaySupplierInvoiceRequest): Promise<SupplierInvoicePayment> => {
    getAuthData();

    const tx = await purchasingDB.begin();
    try {
      const invoice = await tx.queryRow`
        SELECT * FROM supplier_invoices WHERE id = ${req.id}
      `;

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const balanceDue = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
      if (req.amount > balanceDue) {
        throw new Error(`Payment amount exceeds balance due (${balanceDue})`);
      }

      const payment = await tx.queryRow`
        INSERT INTO supplier_invoice_payments 
        (invoice_id, payment_date, amount, payment_method, bank_account_id, reference_number, notes)
        VALUES (${req.id}, ${req.payment_date}, ${req.amount}, ${req.payment_method}, ${req.bank_account_id || null}, ${req.reference_number || null}, ${req.notes || null})
        RETURNING *
      `;

      const newPaidAmount = parseFloat(invoice.paid_amount) + req.amount;
      const newStatus = newPaidAmount >= parseFloat(invoice.total_amount) ? 'paid' : 'partial';

      await tx.exec`
        UPDATE supplier_invoices 
        SET paid_amount = ${newPaidAmount}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${req.id}
      `;

      const apAccount = await accountingDB.queryRow`
        SELECT id FROM accounts WHERE code = '2100' AND type = 'liability'
      `;

      let cashAccountId;
      if (req.bank_account_id) {
        cashAccountId = req.bank_account_id;
      } else {
        const cashAccount = await accountingDB.queryRow`
          SELECT id FROM accounts WHERE code = '1100' AND type = 'asset'
        `;
        cashAccountId = cashAccount?.id;
      }

      if (apAccount && cashAccountId) {
        const jeResult = await accountingDB.queryRow`
          INSERT INTO journal_entries 
          (entry_date, description, type, reference_type, reference_id)
          VALUES (${req.payment_date}, ${'Payment for Invoice ' + invoice.invoice_number}, 'standard', 'supplier_payment', ${payment!.id})
          RETURNING id
        `;

        if (jeResult) {
          await accountingDB.exec`
            INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit)
            VALUES 
              (${jeResult.id}, ${apAccount.id}, ${req.amount}, 0),
              (${jeResult.id}, ${cashAccountId}, 0, ${req.amount})
          `;
        }
      }

      await tx.commit();

      return {
        id: payment!.id,
        invoice_id: payment!.invoice_id,
        payment_date: payment!.payment_date,
        amount: parseFloat(payment!.amount),
        payment_method: payment!.payment_method,
        bank_account_id: payment!.bank_account_id,
        reference_number: payment!.reference_number,
        notes: payment!.notes,
        created_at: payment!.created_at,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
