import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";
import { reportCache } from "./cache";

export interface TrialBalanceEntry {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceResponse {
  entries: TrialBalanceEntry[];
  totalDebits: number;
  totalCredits: number;
  asOfDate: Date;
}

// Generates a trial balance report as of a specific date.
export const trialBalance = api<{ asOfDate: Date }, TrialBalanceResponse>(
  { expose: true, method: "GET", path: "/reports/trial-balance", auth: true },
  async (req) => {
    requireRole(["admin", "accountant", "manager"]);

    const cacheKey = `tb:${req.asOfDate.toISOString()}`;
    const cached = reportCache.get<TrialBalanceResponse>(cacheKey);
    if (cached) {
      return cached;
    }
    const entries = await accountingDB.queryAll<TrialBalanceEntry>`
      SELECT 
        a.id as "accountId",
        a.account_code as "accountCode",
        a.account_name as "accountName",
        a.account_type as "accountType",
        COALESCE(SUM(jel.debit_amount), 0) as "debitBalance",
        COALESCE(SUM(jel.credit_amount), 0) as "creditBalance"
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.is_active = TRUE 
        AND (je.entry_date IS NULL OR je.entry_date <= ${req.asOfDate})
        AND (je.status IS NULL OR je.status = 'posted')
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      HAVING COALESCE(SUM(jel.debit_amount), 0) != 0 OR COALESCE(SUM(jel.credit_amount), 0) != 0
      ORDER BY a.account_code
    `;

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      totalDebits += entry.debitBalance;
      totalCredits += entry.creditBalance;
    }

    const report = {
      entries,
      totalDebits,
      totalCredits,
      asOfDate: req.asOfDate
    };

    reportCache.set(cacheKey, report, 5 * 60 * 1000);

    return report;
  }
);
