import { api } from "encore.dev/api";
import { accountingDB } from "./db";

export interface GeneralLedgerRequest {
  startDate: string;
  endDate: string;
  accountCode?: string;
  companyId?: number;
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
  { method: "POST", path: "/accounting/reports/general-ledger", expose: true },
  async (req: GeneralLedgerRequest): Promise<GeneralLedgerReport> => {
    const { startDate, endDate, accountCode } = req;

    let accountFilter = '';
    let queryParams: any[] = [startDate, endDate];
    
    if (accountCode) {
      accountFilter = 'AND a.account_code = $3';
      queryParams.push(accountCode);
    }

    // Query untuk mendapatkan opening balance
    const openingBalanceQuery = `
      SELECT 
        a.id,
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(
          CASE 
            WHEN a.account_type IN ('asset', 'expense') THEN SUM(jel.debit_amount - jel.credit_amount)
            ELSE SUM(jel.credit_amount - jel.debit_amount)
          END, 0
        ) as opening_balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE je.entry_date < $1
        AND je.status = 'posted'
        AND a.is_active = true
        ${accountFilter}
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      ORDER BY a.account_code
    `;

    // Query untuk mendapatkan transaksi dalam periode
    const transactionsQuery = `
      SELECT 
        a.id as account_id,
        a.account_code,
        a.account_name,
        a.account_type,
        je.entry_date,
        je.entry_number,
        COALESCE(jel.description, je.description) as description,
        je.reference_type,
        je.reference_id,
        jel.debit_amount,
        jel.credit_amount
      FROM chart_of_accounts a
      INNER JOIN journal_entry_lines jel ON a.id = jel.account_id
      INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE je.entry_date BETWEEN $1 AND $2
        AND je.status = 'posted'
        AND a.is_active = true
        ${accountFilter}
      ORDER BY a.account_code, je.entry_date, je.entry_number, jel.id
    `;

    const openingBalances = await accountingDB.query(openingBalanceQuery, queryParams);
    const transactions = await accountingDB.query(transactionsQuery, [startDate, endDate, ...(accountCode ? [accountCode] : [])]);

    // Group transactions by account
    const accountsMap = new Map<string, GeneralLedgerAccount>();

    // Initialize accounts with opening balances
    openingBalances.forEach(row => {
      accountsMap.set(row.account_code, {
        accountCode: row.account_code,
        accountName: row.account_name,
        accountType: row.account_type,
        openingBalance: parseFloat(row.opening_balance || 0),
        totalDebits: 0,
        totalCredits: 0,
        closingBalance: 0,
        entries: []
      });
    });

    // Add transactions
    transactions.forEach(row => {
      const accountCode = row.account_code;
      
      if (!accountsMap.has(accountCode)) {
        accountsMap.set(accountCode, {
          accountCode: row.account_code,
          accountName: row.account_name,
          accountType: row.account_type,
          openingBalance: 0,
          totalDebits: 0,
          totalCredits: 0,
          closingBalance: 0,
          entries: []
        });
      }

      const account = accountsMap.get(accountCode)!;
      const debitAmount = parseFloat(row.debit_amount || 0);
      const creditAmount = parseFloat(row.credit_amount || 0);

      account.totalDebits += debitAmount;
      account.totalCredits += creditAmount;

      // Calculate running balance
      let balanceChange = 0;
      if (account.accountType === 'asset' || account.accountType === 'expense') {
        balanceChange = debitAmount - creditAmount;
      } else {
        balanceChange = creditAmount - debitAmount;
      }

      const runningBalance = account.openingBalance + account.entries.reduce((sum, entry) => {
        if (account.accountType === 'asset' || account.accountType === 'expense') {
          return sum + entry.debitAmount - entry.creditAmount;
        } else {
          return sum + entry.creditAmount - entry.debitAmount;
        }
      }, 0) + balanceChange;

      account.entries.push({
        entryDate: row.entry_date,
        entryNumber: row.entry_number,
        description: row.description,
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        debitAmount,
        creditAmount,
        runningBalance
      });
    });

    // Calculate closing balances
    accountsMap.forEach(account => {
      if (account.accountType === 'asset' || account.accountType === 'expense') {
        account.closingBalance = account.openingBalance + account.totalDebits - account.totalCredits;
      } else {
        account.closingBalance = account.openingBalance + account.totalCredits - account.totalDebits;
      }
    });

    // Filter accounts that have transactions or non-zero opening balance
    const accounts = Array.from(accountsMap.values()).filter(account => 
      account.entries.length > 0 || account.openingBalance !== 0
    );

    return {
      accounts,
      periode: {
        startDate,
        endDate
      }
    };
  }
);