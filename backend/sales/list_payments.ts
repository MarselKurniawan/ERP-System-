import { api } from "encore.dev/api";
import { salesDB } from "./db";

export interface SalesPayment {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  cashBankAccountId: number | null;
  tags: string[];
  createdAt: Date;
}

export interface ListSalesPaymentsRequest {
  companyId: number;
  customerId?: number;
  search?: string;
}

export const listPayments = api(
  { method: "GET", path: "/sales/payments", expose: true, auth: true },
  async (req: ListSalesPaymentsRequest): Promise<{ payments: SalesPayment[] }> => {
    const payments: SalesPayment[] = [];

    if (req.customerId && req.search) {
      const searchPattern = `%${req.search}%`;
      for await (const row of salesDB.query<any>`
        SELECT p.id, p.company_id, p.customer_id, c.name as customer_name,
               p.payment_date, p.amount, p.payment_method, p.reference_number,
               p.notes, p.cash_bank_account_id, p.tags, p.created_at
        FROM sales_payments p
        JOIN customers c ON c.id = p.customer_id
        WHERE p.company_id = ${req.companyId}
          AND p.customer_id = ${req.customerId}
          AND (c.name ILIKE ${searchPattern} OR p.reference_number ILIKE ${searchPattern})
        ORDER BY p.payment_date DESC, p.id DESC
      `) {
        payments.push(mapPayment(row));
      }
    } else if (req.customerId) {
      for await (const row of salesDB.query<any>`
        SELECT p.id, p.company_id, p.customer_id, c.name as customer_name,
               p.payment_date, p.amount, p.payment_method, p.reference_number,
               p.notes, p.cash_bank_account_id, p.tags, p.created_at
        FROM sales_payments p
        JOIN customers c ON c.id = p.customer_id
        WHERE p.company_id = ${req.companyId}
          AND p.customer_id = ${req.customerId}
        ORDER BY p.payment_date DESC, p.id DESC
      `) {
        payments.push(mapPayment(row));
      }
    } else if (req.search) {
      const searchPattern = `%${req.search}%`;
      for await (const row of salesDB.query<any>`
        SELECT p.id, p.company_id, p.customer_id, c.name as customer_name,
               p.payment_date, p.amount, p.payment_method, p.reference_number,
               p.notes, p.cash_bank_account_id, p.tags, p.created_at
        FROM sales_payments p
        JOIN customers c ON c.id = p.customer_id
        WHERE p.company_id = ${req.companyId}
          AND (c.name ILIKE ${searchPattern} OR p.reference_number ILIKE ${searchPattern})
        ORDER BY p.payment_date DESC, p.id DESC
      `) {
        payments.push(mapPayment(row));
      }
    } else {
      for await (const row of salesDB.query<any>`
        SELECT p.id, p.company_id, p.customer_id, c.name as customer_name,
               p.payment_date, p.amount, p.payment_method, p.reference_number,
               p.notes, p.cash_bank_account_id, p.tags, p.created_at
        FROM sales_payments p
        JOIN customers c ON c.id = p.customer_id
        WHERE p.company_id = ${req.companyId}
        ORDER BY p.payment_date DESC, p.id DESC
      `) {
        payments.push(mapPayment(row));
      }
    }

    return { payments };
  }
);

function mapPayment(row: any): SalesPayment {
  return {
    id: row.id,
    companyId: row.company_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    paymentDate: row.payment_date,
    amount: parseFloat(row.amount),
    paymentMethod: row.payment_method,
    referenceNumber: row.reference_number,
    notes: row.notes,
    cashBankAccountId: row.cash_bank_account_id,
    tags: row.tags,
    createdAt: row.created_at,
  };
}
