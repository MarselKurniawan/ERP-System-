import { api } from "encore.dev/api";
import { db } from "./db";

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
    let query = `
      SELECT p.id, p.company_id, p.customer_id, c.name as customer_name,
             p.payment_date, p.amount, p.payment_method, p.reference_number,
             p.notes, p.cash_bank_account_id, p.tags, p.created_at
      FROM sales_payments p
      JOIN customers c ON c.id = p.customer_id
      WHERE p.company_id = $1
    `;
    const params: any[] = [req.companyId];

    if (req.customerId) {
      query += ` AND p.customer_id = $${params.length + 1}`;
      params.push(req.customerId);
    }

    if (req.search) {
      query += ` AND (c.name ILIKE $${params.length + 1} OR p.reference_number ILIKE $${params.length + 1})`;
      params.push(`%${req.search}%`);
    }

    query += ` ORDER BY p.payment_date DESC, p.id DESC`;

    const result = await db.query(query, params);

    return {
      payments: result.rows.map((row) => ({
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
      })),
    };
  }
);
