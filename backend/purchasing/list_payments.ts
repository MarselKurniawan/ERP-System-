import { api } from "encore.dev/api";
import { db } from "./db";

export interface PurchasePayment {
  id: number;
  companyId: number;
  supplierId: number;
  supplierName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  cashBankAccountId: number | null;
  tags: string[];
  createdAt: Date;
}

export interface ListPurchasePaymentsRequest {
  companyId: number;
  supplierId?: number;
  search?: string;
}

export const listPayments = api(
  { method: "GET", path: "/purchasing/payments", expose: true, auth: true },
  async (req: ListPurchasePaymentsRequest): Promise<{ payments: PurchasePayment[] }> => {
    let query = `
      SELECT p.id, p.company_id, p.supplier_id, s.name as supplier_name,
             p.payment_date, p.amount, p.payment_method, p.reference_number,
             p.notes, p.cash_bank_account_id, p.tags, p.created_at
      FROM purchase_payments p
      JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.company_id = $1
    `;
    const params: any[] = [req.companyId];

    if (req.supplierId) {
      query += ` AND p.supplier_id = $${params.length + 1}`;
      params.push(req.supplierId);
    }

    if (req.search) {
      query += ` AND (s.name ILIKE $${params.length + 1} OR p.reference_number ILIKE $${params.length + 1})`;
      params.push(`%${req.search}%`);
    }

    query += ` ORDER BY p.payment_date DESC, p.id DESC`;

    const result = await db.query(query, params);

    return {
      payments: result.rows.map((row) => ({
        id: row.id,
        companyId: row.company_id,
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
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
