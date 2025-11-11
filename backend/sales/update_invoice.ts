import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { accountingDB } from "../accounting/db";

export interface UpdateInvoiceRequest {
  id: number;
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paidAmount?: number;
  bankAccountId?: number;
  notes?: string;
}

export interface UpdateInvoiceResponse {
  id: number;
  invoiceNumber: string;
  status: string;
  paidAmount: number;
}

export const updateInvoice = api(
  { method: "PUT", path: "/invoices/:id", expose: true },
  async (req: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse> => {
    const getInvoiceQuery = `
      SELECT i.*, c.receivable_account_id, c.name as customer_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1
    `;
    const invoiceData = await salesDB.rawQueryRow(getInvoiceQuery, req.id);
    const oldPaidAmount = parseFloat(invoiceData?.paid_amount || 0);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (req.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(req.status);
      paramIndex++;
    }

    if (req.paidAmount !== undefined) {
      updates.push(`paid_amount = $${paramIndex}`);
      params.push(req.paidAmount);
      paramIndex++;
    }

    if (req.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(req.notes);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.id);

    const updateQuery = `
      UPDATE invoices 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, invoice_number, status, paid_amount
    `;

    const result = await salesDB.rawQueryRow(updateQuery, ...params);

    if (req.paidAmount !== undefined && req.paidAmount > oldPaidAmount && req.bankAccountId && invoiceData?.receivable_account_id) {
      const paymentAmount = req.paidAmount - oldPaidAmount;

      const entryNumberQuery = `
        SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 3) AS INTEGER)), 0) + 1 as next_number
        FROM journal_entries 
        WHERE entry_number ~ '^JE[0-9]+$'
      `;
      const entryNumberResult = await accountingDB.rawQueryRow(entryNumberQuery);
      const nextNumber = entryNumberResult?.next_number || 1;
      const entryNumber = `JE${nextNumber.toString().padStart(6, '0')}`;

      const createJournalEntryQuery = `
        INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, status)
        VALUES ($1, NOW()::DATE, $2, $3, $4, 'posted')
        RETURNING id
      `;
      const journalEntryResult = await accountingDB.rawQueryRow(
        createJournalEntryQuery,
        entryNumber,
        `Payment for Invoice ${invoiceData.invoice_number} - ${invoiceData.customer_name}`,
        'invoice_payment',
        req.id
      );
      const journalEntryId = journalEntryResult!.id;

      const insertDebitLineQuery = `
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description)
        VALUES ($1, $2, $3, 0, $4)
      `;
      await accountingDB.rawExec(
        insertDebitLineQuery,
        journalEntryId,
        req.bankAccountId,
        paymentAmount,
        `Payment received - ${invoiceData.customer_name}`
      );

      const insertCreditLineQuery = `
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, description)
        VALUES ($1, $2, 0, $3, $4)
      `;
      await accountingDB.rawExec(
        insertCreditLineQuery,
        journalEntryId,
        invoiceData.receivable_account_id,
        paymentAmount,
        `Accounts Receivable - ${invoiceData.customer_name}`
      );
    }

    return {
      id: result!.id,
      invoiceNumber: result!.invoice_number,
      status: result!.status,
      paidAmount: parseFloat(result!.paid_amount)
    };
  }
);