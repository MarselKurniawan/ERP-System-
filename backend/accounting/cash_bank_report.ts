import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";
import { reportCache } from "./cache";

export interface CashBankRequest {
  asOfDate?: string;
}

export interface CashBankItem {
  accountCode: string;
  accountName: string;
  balance: number;
  category: string;
}

export interface CashBankReport {
  cash: CashBankItem[];
  bank: CashBankItem[];
  giro: CashBankItem[];
  other: CashBankItem[];
  summary: {
    totalCash: number;
    totalBank: number;
    totalGiro: number;
    totalOther: number;
    grandTotal: number;
  };
  asOfDate: string;
}

export const cashBankReport = api(
  { method: "POST", path: "/accounting/reports/cash-bank", expose: true, auth: true },
  async (req: CashBankRequest): Promise<CashBankReport> => {
    requireRole(["admin", "accountant", "manager"]);
    const asOfDate = req.asOfDate || new Date().toISOString().split('T')[0];

    const cacheKey = `cb:${asOfDate}`;
    const cached = reportCache.get<CashBankReport>(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      SELECT 
        a.account_code,
        a.account_name,
        COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.entry_date <= $1 AND je.status = 'posted'
      WHERE a.account_code LIKE '1%'
        AND a.is_active = true
        AND (
          LOWER(a.account_name) LIKE '%kas%' 
          OR LOWER(a.account_name) LIKE '%bank%'
          OR LOWER(a.account_name) LIKE '%giro%'
          OR LOWER(a.account_name) LIKE '%cash%'
        )
      GROUP BY a.id, a.account_code, a.account_name
      HAVING COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) != 0
      ORDER BY a.account_code
    `;

    const results = await accountingDB.rawQueryAll(query, asOfDate);

    const cash: CashBankItem[] = [];
    const bank: CashBankItem[] = [];
    const giro: CashBankItem[] = [];
    const other: CashBankItem[] = [];

    results.forEach(row => {
      const accountName = row.account_name.toLowerCase();
      const item: CashBankItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        balance: parseFloat(row.balance),
        category: ''
      };

      if (accountName.includes('kas') || accountName.includes('cash')) {
        item.category = 'Kas';
        cash.push(item);
      } else if (accountName.includes('giro')) {
        item.category = 'Giro';
        giro.push(item);
      } else if (accountName.includes('bank')) {
        item.category = 'Bank';
        bank.push(item);
      } else {
        item.category = 'Lainnya';
        other.push(item);
      }
    });

    const summary = {
      totalCash: cash.reduce((sum, item) => sum + item.balance, 0),
      totalBank: bank.reduce((sum, item) => sum + item.balance, 0),
      totalGiro: giro.reduce((sum, item) => sum + item.balance, 0),
      totalOther: other.reduce((sum, item) => sum + item.balance, 0),
      grandTotal: 0
    };

    summary.grandTotal = summary.totalCash + summary.totalBank + summary.totalGiro + summary.totalOther;

    const report = {
      cash,
      bank,
      giro,
      other,
      summary,
      asOfDate
    };

    reportCache.set(cacheKey, report, 5 * 60 * 1000);

    return report;
  }
);
