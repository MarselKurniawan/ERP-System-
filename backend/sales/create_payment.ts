import { api } from "encore.dev/api";
import { salesDB } from "./db";
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
    const userId = auth?.userID;

    return await salesDB.begin().then(async (tx) => {
      try {
        const payment = await tx.queryRow<any>`
          INSERT INTO sales_payments 
          (company_id, customer_id, payment_date, amount, payment_method, reference_number, notes, cash_bank_account_id, tags, created_by) 
          VALUES (${req.companyId}, ${req.customerId}, ${req.paymentDate}, ${req.amount}, ${req.paymentMethod}, ${req.referenceNumber || null}, ${req.notes || null}, ${req.cashBankAccountId || null}, ${req.tags || []}, ${userId}) 
          RETURNING id, company_id, customer_id, payment_date, amount, payment_method, reference_number, notes, cash_bank_account_id, tags, created_at, created_by
        `;

        for (const allocation of req.allocations) {
          await tx.exec`
            INSERT INTO sales_payment_allocations (payment_id, invoice_id, allocated_amount) 
            VALUES (${payment!.id}, ${allocation.invoiceId}, ${allocation.allocatedAmount})
          `;

          await tx.exec`
            UPDATE invoices 
            SET amount_paid = amount_paid + ${allocation.allocatedAmount}
            WHERE id = ${allocation.invoiceId}
          `;
        }

        if (req.cashBankAccountId) {
          await tx.exec`
            INSERT INTO journal_entries 
            (company_id, entry_date, description, reference_type, reference_id, created_by) 
            VALUES (${req.companyId}, ${req.paymentDate}, 'Payment from customer', 'sales_payment', ${payment!.id}, ${userId})
          `;

          const je = await tx.queryRow<{ id: number }>`
            SELECT id FROM journal_entries WHERE reference_type = 'sales_payment' AND reference_id = ${payment!.id}
          `;

          await tx.exec`
            INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) 
            VALUES (${je!.id}, ${req.cashBankAccountId}, ${req.amount}, 0)
          `;

          const arAccount = await tx.queryRow<{ id: number }>`
            SELECT id FROM chart_of_accounts WHERE company_id = ${req.companyId} AND account_type = 'Asset' AND name ILIKE '%receivable%' LIMIT 1
          `;
          
          if (arAccount) {
            await tx.exec`
              INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) 
              VALUES (${je!.id}, ${arAccount.id}, 0, ${req.amount})
            `;
          }
        }

        await tx.commit();

        return {
          id: payment!.id,
          companyId: payment!.company_id,
          customerId: payment!.customer_id,
          paymentDate: payment!.payment_date,
          amount: parseFloat(payment!.amount),
          paymentMethod: payment!.payment_method,
          referenceNumber: payment!.reference_number,
          notes: payment!.notes,
          cashBankAccountId: payment!.cash_bank_account_id,
          tags: payment!.tags,
          createdAt: payment!.created_at,
          createdBy: payment!.created_by,
          allocations: req.allocations,
        };
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    });
  }
);
