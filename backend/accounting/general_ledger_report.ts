import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";
import { reportCache } from "./cache";

export interface GeneralLedgerRequest {
  startDate: string;
  endDate: string;
  accountCode?: string;
  companyId?: number;
  onlyWithTransactions?: boolean;
}

export interface GeneralLedgerEntry {
  entryDate: string;
  entryNumber: string;
  description: string;
  referenceType: string | null;
  referenceId: number | null;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

export interface GeneralLedgerAccount {
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  entries: GeneralLedgerEntry[];
}

export interface GeneralLedgerReport {
  accounts: GeneralLedgerAccount[];
  periode: {
    startDate: string;
    endDate: string;
  };
}

export const generalLedgerReport = api(
  { method: "POST", path: "/accounting/reports/general-ledger", expose: true, auth: true },
  async (req: GeneralLedgerRequest): Promise<GeneralLedgerReport> => {
    requireRole(["admin", "accountant", "manager"]);
    const { startDate, endDate, accountCode, companyId, onlyWithTransactions } = req;

    const cacheKey = `gl:${startDate}:${endDate}:${accountCode || 'all'}:${companyId || 'all'}:${onlyWithTransactions || false}`;
    const cached = reportCache.get<GeneralLedgerReport>(cacheKey);
    if (cached) {
      return cached;
    }

    let accountQuery = `
      SELECT DISTINCT a.id, a.account_code, a.name as account_name, a.account_type
      FROM chart_of_accounts a
      WHERE a.is_active = true
    `;

    const params: any[] = [];

    if (accountCode) {
      accountQuery += ` AND a.account_code = $${params.length + 1}`;
      params.push(accountCode);
    }

    if (companyId) {
      accountQuery += ` AND a.company_id = $${params.length + 1}`;
      params.push(companyId);
    }

    if (onlyWithTransactions) {
      accountQuery += `
        AND EXISTS (
          SELECT 1 FROM journal_entry_lines jel
          JOIN journal_entries je ON jel.journal_entry_id = je.id
          WHERE jel.account_id = a.id
            AND je.entry_date BETWEEN $${params.length + 1} AND $${params.length + 2}
            AND je.status = 'posted'
        )
      `;
      params.push(startDate, endDate);
    }

    accountQuery += ` ORDER BY a.account_code`;

    const accountsResult = await accountingDB.rawQueryAll(accountQuery, ...params);

    const accounts: GeneralLedgerAccount[] = [];

    for (const accountRow of accountsResult) {
      const openingBalanceQuery = `
        SELECT 
          CASE 
            WHEN $2 IN ('Asset', 'Expense') THEN COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0)
            ELSE COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0)
          END as opening_balance
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = $1
          AND je.entry_date < $3
          AND je.status = 'posted'
      `;

      const openingBalanceResult = await accountingDB.rawQueryRow(
        openingBalanceQuery,
        accountRow.id,
        accountRow.account_type,
        startDate
      );
      const openingBalance = parseFloat(openingBalanceResult?.opening_balance || 0);

      const entriesQuery = `
        SELECT 
          je.entry_date,
          je.entry_number,
          je.description,
          je.reference_type,
          je.reference_id,
          jel.debit_amount,
          jel.credit_amount
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = $1
          AND je.entry_date BETWEEN $2 AND $3
          AND je.status = 'posted'
        ORDER BY je.entry_date, je.id
      `;

      const entriesResult = await accountingDB.rawQueryAll(entriesQuery, accountRow.id, startDate, endDate);

      let runningBalance = openingBalance;
      const entries: GeneralLedgerEntry[] = [];
      let totalDebits = 0;
      let totalCredits = 0;

      for (const entryRow of entriesResult) {
        const debitAmount = parseFloat(entryRow.debit_amount || 0);
        const creditAmount = parseFloat(entryRow.credit_amount || 0);

        if (['Asset', 'Expense'].includes(accountRow.account_type)) {
          runningBalance += (debitAmount - creditAmount);
        } else {
          runningBalance += (creditAmount - debitAmount);
        }

        totalDebits += debitAmount;
        totalCredits += creditAmount;

        entries.push({
          entryDate: entryRow.entry_date,
          entryNumber: entryRow.entry_number,
          description: entryRow.description,
          referenceType: entryRow.reference_type,
          referenceId: entryRow.reference_id,
          debitAmount,
          creditAmount,
          runningBalance,
        });
      }

      const closingBalance = runningBalance;

      // Skip accounts with no transactions if onlyWithTransactions is true
      if (onlyWithTransactions && entries.length === 0) {
        continue;
      }

      accounts.push({
        accountCode: accountRow.account_code,
        accountName: accountRow.account_name,
        accountType: accountRow.account_type,
        openingBalance,
        totalDebits,
        totalCredits,
        closingBalance,
        entries,
      });
    }

    const report = {
      accounts,
      periode: {
        startDate,
        endDate,
      },
    };

    reportCache.set(cacheKey, report, 5 * 60 * 1000);

    return report;
  }
);
