import { api } from "encore.dev/api";
import { salesDB } from "./db";
import { reportCache } from "../accounting/cache";

export interface AgingReceivablesRequest {
  asOfDate?: string;
  companyId?: number;
}

export interface AgingReceivableItem {
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  daysPastDue: number;
  paymentTerms: number;
  agingCategory: string;
}

export interface AgingReceivablesReport {
  items: AgingReceivableItem[];
  summary: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    totalReceivables: number;
  };
  asOfDate: string;
}

export const agingReceivablesReport = api(
  { method: "POST", path: "/sales/reports/aging-receivables", expose: true, auth: true },
  async (req: AgingReceivablesRequest): Promise<AgingReceivablesReport> => {
    const asOfDate = req.asOfDate || new Date().toISOString().split('T')[0];

    const cacheKey = `ar:${asOfDate}:${req.companyId || 'all'}`;
    const cached = reportCache.get<AgingReceivablesReport>(cacheKey);
    if (cached) {
      return cached;
    }

    let query = `
      SELECT 
        i.invoice_number,
        c.name as customer_name,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        COALESCE(i.amount_paid, 0) as paid_amount,
        (i.total_amount - COALESCE(i.amount_paid, 0)) as remaining_amount,
        GREATEST(0, CAST($1 AS DATE) - CAST(i.due_date AS DATE)) as days_past_due,
        30 as payment_terms
      FROM invoices i
      INNER JOIN customers c ON i.customer_id = c.id
      WHERE i.status != 'cancelled'
        AND i.invoice_date <= $1
        AND (i.total_amount - COALESCE(i.amount_paid, 0)) > 0
    `;

    const params: any[] = [asOfDate];

    if (req.companyId) {
      query += ` AND i.company_id = $${params.length + 1}`;
      params.push(req.companyId);
    }

    query += ` ORDER BY days_past_due DESC, i.invoice_date`;

    const results = await salesDB.rawQueryAll(query, ...params);

    const items: AgingReceivableItem[] = results.map(row => {
      const daysPastDue = parseInt(row.days_past_due);
      let agingCategory = 'Current';
      
      if (daysPastDue > 90) {
        agingCategory = 'Over 90 days';
      } else if (daysPastDue > 60) {
        agingCategory = '61-90 days';
      } else if (daysPastDue > 30) {
        agingCategory = '31-60 days';
      } else if (daysPastDue > 0) {
        agingCategory = '1-30 days';
      }

      return {
        invoiceNumber: row.invoice_number,
        customerName: row.customer_name,
        invoiceDate: row.invoice_date,
        dueDate: row.due_date,
        totalAmount: parseFloat(row.total_amount),
        paidAmount: parseFloat(row.paid_amount),
        remainingAmount: parseFloat(row.remaining_amount),
        daysPastDue,
        paymentTerms: parseInt(row.payment_terms),
        agingCategory
      };
    });

    const summary = {
      current: items.filter(i => i.daysPastDue === 0).reduce((sum, i) => sum + i.remainingAmount, 0),
      days30: items.filter(i => i.daysPastDue > 0 && i.daysPastDue <= 30).reduce((sum, i) => sum + i.remainingAmount, 0),
      days60: items.filter(i => i.daysPastDue > 30 && i.daysPastDue <= 60).reduce((sum, i) => sum + i.remainingAmount, 0),
      days90: items.filter(i => i.daysPastDue > 60 && i.daysPastDue <= 90).reduce((sum, i) => sum + i.remainingAmount, 0),
      over90: items.filter(i => i.daysPastDue > 90).reduce((sum, i) => sum + i.remainingAmount, 0),
      totalReceivables: items.reduce((sum, i) => sum + i.remainingAmount, 0)
    };

    const report = {
      items,
      summary,
      asOfDate
    };

    reportCache.set(cacheKey, report, 3 * 60 * 1000);

    return report;
  }
);
