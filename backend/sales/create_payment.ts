import { api } from "encore.dev/api";
import { db } from "./db";
import { getAuthData } from "~encore/auth";

export interface PaymentAllocation {
  invoiceId: number;
  allocatedAmount: number;
}

export interface CreateSalesPaymentRequest {
  companyId: number;
  customerId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  cashBankAccountId?: number;
  tags?: string[];
  allocations: PaymentAllocation[];
}

export interface SalesPayment {
  id: number;
  companyId: number;
  customerId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  cashBankAccountId: number | null;
  tags: string[];
  createdAt: Date;
  createdBy: number | null;
  allocations: PaymentAllocation[];
}

export const createPayment = api(
  { method: "POST", path: "/sales/payments", expose: true, auth: true },
  async (req: CreateSalesPaymentRequest): Promise<SalesPayment> => {
    const auth = getAuthData();
    const userId = auth?.userId;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const paymentResult = await client.query(
        `INSERT INTO sales_payments 
         (company_id, customer_id, payment_date, amount, payment_method, reference_number, notes, cash_bank_account_id, tags, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING id, company_id, customer_id, payment_date, amount, payment_method, reference_number, notes, cash_bank_account_id, tags, created_at, created_by`,
        [
          req.companyId,
          req.customerId,
          req.paymentDate,
          req.amount,
          req.paymentMethod,
          req.referenceNumber || null,
          req.notes || null,
          req.cashBankAccountId || null,
          req.tags || [],
          userId,
        ]
      );

      const payment = paymentResult.rows[0];

      for (const allocation of req.allocations) {
        await client.query(
          `INSERT INTO sales_payment_allocations (payment_id, invoice_id, allocated_amount) 
           VALUES ($1, $2, $3)`,
          [payment.id, allocation.invoiceId, allocation.allocatedAmount]
        );

        await client.query(
          `UPDATE invoices 
           SET amount_paid = amount_paid + $1 
           WHERE id = $2`,
          [allocation.allocatedAmount, allocation.invoiceId]
        );
      }

      if (req.cashBankAccountId) {
        await client.query(
          `INSERT INTO journal_entries 
           (company_id, entry_date, description, reference_type, reference_id, created_by) 
           VALUES ($1, $2, $3, 'sales_payment', $4, $5)`,
          [req.companyId, req.paymentDate, `Payment from customer`, payment.id, userId]
        );

        const jeResult = await client.query(
          `SELECT id FROM journal_entries WHERE reference_type = 'sales_payment' AND reference_id = $1`,
          [payment.id]
        );
        const jeId = jeResult.rows[0].id;

        await client.query(
          `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) 
           VALUES ($1, $2, $3, 0)`,
          [jeId, req.cashBankAccountId, req.amount]
        );

        const arResult = await client.query(
          `SELECT id FROM chart_of_accounts WHERE company_id = $1 AND account_type = 'Asset' AND name ILIKE '%receivable%' LIMIT 1`,
          [req.companyId]
        );
        if (arResult.rows.length > 0) {
          await client.query(
            `INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) 
             VALUES ($1, $2, 0, $3)`,
            [jeId, arResult.rows[0].id, req.amount]
          );
        }
      }

      await client.query('COMMIT');

      return {
        id: payment.id,
        companyId: payment.company_id,
        customerId: payment.customer_id,
        paymentDate: payment.payment_date,
        amount: parseFloat(payment.amount),
        paymentMethod: payment.payment_method,
        referenceNumber: payment.reference_number,
        notes: payment.notes,
        cashBankAccountId: payment.cash_bank_account_id,
        tags: payment.tags,
        createdAt: payment.created_at,
        createdBy: payment.created_by,
        allocations: req.allocations,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
);
