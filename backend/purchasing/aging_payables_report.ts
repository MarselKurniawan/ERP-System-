import { api } from "encore.dev/api";
import { purchasingDB } from "./db";
import { reportCache } from "../accounting/cache";

export interface AgingPayablesRequest {
  asOfDate?: string;
  companyId?: number;
}

export interface AgingPayablesEntry {
  supplier_id: number;
  supplier_name: string;
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  days_overdue: number;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
}

export interface AgingPayablesSummary {
  total_current: number;
  total_1_30: number;
  total_31_60: number;
  total_61_90: number;
  total_over_90: number;
  grand_total: number;
}

export interface AgingPayablesReport {
  entries: AgingPayablesEntry[];
  summary: AgingPayablesSummary;
  as_of_date: string;
}

export const agingPayablesReport = api(
  { method: "POST", path: "/purchasing/aging-payables-report", expose: true, auth: true },
  async (req: AgingPayablesRequest): Promise<AgingPayablesReport> => {
    const asOfDate = req.asOfDate || new Date().toISOString().split('T')[0];

    const cacheKey = `ap:${asOfDate}:${req.companyId || 'all'}`;
    const cached = reportCache.get<AgingPayablesReport>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = [];
    
    if (req.companyId) {
      for await (const row of purchasingDB.query`
        SELECT 
          si.id as invoice_id,
          si.supplier_id,
          s.name as supplier_name,
          si.invoice_number,
          si.invoice_date,
          si.due_date,
          si.total_amount,
          COALESCE(si.amount_paid, 0) as paid_amount,
          si.total_amount - COALESCE(si.amount_paid, 0) as balance_due,
          CAST(${asOfDate} AS DATE) - si.due_date::date as days_overdue
        FROM supplier_invoices si
        JOIN suppliers s ON si.supplier_id = s.id
        WHERE si.status != 'cancelled'
          AND si.company_id = ${req.companyId}
          AND (si.total_amount - COALESCE(si.amount_paid, 0)) > 0
        ORDER BY s.name, si.due_date
      `) {
        rows.push(row);
      }
    } else {
      for await (const row of purchasingDB.query`
        SELECT 
          si.id as invoice_id,
          si.supplier_id,
          s.name as supplier_name,
          si.invoice_number,
          si.invoice_date,
          si.due_date,
          si.total_amount,
          COALESCE(si.amount_paid, 0) as paid_amount,
          si.total_amount - COALESCE(si.amount_paid, 0) as balance_due,
          CAST(${asOfDate} AS DATE) - si.due_date::date as days_overdue
        FROM supplier_invoices si
        JOIN suppliers s ON si.supplier_id = s.id
        WHERE si.status != 'cancelled'
          AND (si.total_amount - COALESCE(si.amount_paid, 0)) > 0
        ORDER BY s.name, si.due_date
      `) {
        rows.push(row);
      }
    }

    const entries: AgingPayablesEntry[] = rows.map((row: any) => {
      const balanceDue = parseFloat(row.balance_due);
      const daysOverdue = parseInt(row.days_overdue) || 0;

      let current = 0, days_1_30 = 0, days_31_60 = 0, days_61_90 = 0, days_over_90 = 0;

      if (daysOverdue < 0) {
        current = balanceDue;
      } else if (daysOverdue <= 30) {
        days_1_30 = balanceDue;
      } else if (daysOverdue <= 60) {
        days_31_60 = balanceDue;
      } else if (daysOverdue <= 90) {
        days_61_90 = balanceDue;
      } else {
        days_over_90 = balanceDue;
      }

      return {
        supplier_id: row.supplier_id,
        supplier_name: row.supplier_name,
        invoice_id: row.invoice_id,
        invoice_number: row.invoice_number,
        invoice_date: row.invoice_date,
        due_date: row.due_date,
        total_amount: parseFloat(row.total_amount),
        paid_amount: parseFloat(row.paid_amount),
        balance_due: balanceDue,
        days_overdue: daysOverdue,
        current,
        days_1_30,
        days_31_60,
        days_61_90,
        days_over_90,
      };
    });

    const summary: AgingPayablesSummary = {
      total_current: entries.reduce((sum, e) => sum + e.current, 0),
      total_1_30: entries.reduce((sum, e) => sum + e.days_1_30, 0),
      total_31_60: entries.reduce((sum, e) => sum + e.days_31_60, 0),
      total_61_90: entries.reduce((sum, e) => sum + e.days_61_90, 0),
      total_over_90: entries.reduce((sum, e) => sum + e.days_over_90, 0),
      grand_total: entries.reduce((sum, e) => sum + e.balance_due, 0),
    };

    const report = {
      entries,
      summary,
      as_of_date: asOfDate,
    };

    reportCache.set(cacheKey, report, 3 * 60 * 1000);

    return report;
  }
);
