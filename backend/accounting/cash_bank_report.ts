import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface CashBankRequest {
  startDate: string;
  endDate: string;
  companyId?: number;
  accountIds?: number[];
}

export interface CashBankTransaction {
  date: string;
  description: string;
  referenceNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CashBankAccountReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  openingBalance: number;
  transactions: CashBankTransaction[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface CashBankReport {
  accounts: CashBankAccountReport[];
  periode: {
    startDate: string;
    endDate: string;
  };
}

export const cashBankReport = api(
  { method: "POST", path: "/accounting/reports/cash-bank", expose: true, auth: true },
  async (req: CashBankRequest): Promise<CashBankReport> => {
    requireRole(["admin", "accountant", "manager"]);
    const { startDate, endDate, companyId, accountIds } = req;

    let cashBankAccountsQuery = `
      SELECT id, account_code, name
      FROM chart_of_accounts
      WHERE account_type = 'Asset'
        AND (name ILIKE '%cash%' OR name ILIKE '%bank%' OR name ILIKE '%kas%')
        AND is_active = true
    `;

    const params: any[] = [];

    if (companyId) {
      cashBankAccountsQuery += ` AND company_id = $${params.length + 1}`;
      params.push(companyId);
    }

    if (accountIds && accountIds.length > 0) {
      cashBankAccountsQuery += ` AND id = ANY($${params.length + 1})`;
      params.push(accountIds);
    }

    cashBankAccountsQuery += ` ORDER BY account_code`;

    const cashBankAccounts = await accountingDB.rawQueryAll(cashBankAccountsQuery, ...params);

    const accounts: CashBankAccountReport[] = [];

    for (const account of cashBankAccounts) {
      const openingBalanceQuery = `
        SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as opening_balance
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = $1
          AND je.entry_date < $2
          AND je.status = 'posted'
      `;

      const openingBalanceResult = await accountingDB.rawQueryRow(openingBalanceQuery, account.id, startDate);
      const openingBalance = parseFloat(openingBalanceResult?.opening_balance || 0);

      const transactionsQuery = `
        SELECT 
          je.entry_date as date,
          je.description,
          je.entry_number as reference_number,
          jel.debit_amount as debit,
          jel.credit_amount as credit
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = $1
          AND je.entry_date BETWEEN $2 AND $3
          AND je.status = 'posted'
        ORDER BY je.entry_date, je.id
      `;

      const transactionsResult = await accountingDB.rawQueryAll(transactionsQuery, account.id, startDate, endDate);

      let runningBalance = openingBalance;
      const transactions: CashBankTransaction[] = transactionsResult.map((row) => {
        const debit = parseFloat(row.debit || 0);
        const credit = parseFloat(row.credit || 0);
        runningBalance += (debit - credit);

        return {
          date: row.date,
          description: row.description,
          referenceNumber: row.reference_number,
          debit,
          credit,
          balance: runningBalance,
        };
      });

      const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
      const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
      const closingBalance = openingBalance + totalDebit - totalCredit;

      accounts.push({
        accountId: account.id,
        accountCode: account.account_code,
        accountName: account.name,
        openingBalance,
        transactions,
        totalDebit,
        totalCredit,
        closingBalance,
      });
    }

    return {
      accounts,
      periode: {
        startDate,
        endDate,
      },
    };
  }
);
