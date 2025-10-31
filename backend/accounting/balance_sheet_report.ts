import { api } from "encore.dev/api";
import { accountingDB } from "./db";

export interface BalanceSheetRequest {
  asOfDate: string;
  companyId?: number;
}

export interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface BalanceSheetReport {
  assets: {
    currentAssets: BalanceSheetItem[];
    fixedAssets: BalanceSheetItem[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetItem[];
    longTermLiabilities: BalanceSheetItem[];
    totalLiabilities: number;
  };
  equity: {
    equityItems: BalanceSheetItem[];
    retainedEarnings: number;
    totalEquity: number;
  };
  asOfDate: string;
}

export const balanceSheetReport = api(
  { method: "POST", path: "/accounting/reports/balance-sheet", expose: true },
  async (req: BalanceSheetRequest): Promise<BalanceSheetReport> => {
    const { asOfDate } = req;

    // Query untuk akun 1 (Assets)
    const assetsQuery = `
      SELECT 
        a.account_code,
        a.account_name,
        COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_code LIKE '1%'
        AND je.entry_date <= $1
        AND je.status = 'posted'
        AND a.is_active = true
      GROUP BY a.id, a.account_code, a.account_name
      HAVING COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) != 0
      ORDER BY a.account_code
    `;

    // Query untuk akun 2 (Liabilities)
    const liabilitiesQuery = `
      SELECT 
        a.account_code,
        a.account_name,
        COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_code LIKE '2%'
        AND je.entry_date <= $1
        AND je.status = 'posted'
        AND a.is_active = true
      GROUP BY a.id, a.account_code, a.account_name
      HAVING COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) != 0
      ORDER BY a.account_code
    `;

    // Query untuk akun 3 (Equity)
    const equityQuery = `
      SELECT 
        a.account_code,
        a.account_name,
        COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_code LIKE '3%'
        AND je.entry_date <= $1
        AND je.status = 'posted'
        AND a.is_active = true
      GROUP BY a.id, a.account_code, a.account_name
      HAVING COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) != 0
      ORDER BY a.account_code
    `;

    const assetsResult = await accountingDB.rawQueryAll(assetsQuery, asOfDate);
    const currentAssets: BalanceSheetItem[] = [];
    const fixedAssets: BalanceSheetItem[] = [];
    
    assetsResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      // Current assets: 10xx-14xx, Fixed assets: 15xx+
      if (row.account_code.startsWith('1') && parseInt(row.account_code) < 1500) {
        currentAssets.push(item);
      } else {
        fixedAssets.push(item);
      }
    });

    const totalAssets = [...currentAssets, ...fixedAssets].reduce((sum, item) => sum + item.amount, 0);

    const liabilitiesResult = await accountingDB.rawQueryAll(liabilitiesQuery, asOfDate);
    const currentLiabilities: BalanceSheetItem[] = [];
    const longTermLiabilities: BalanceSheetItem[] = [];
    
    liabilitiesResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      // Current liabilities: 20xx-22xx, Long-term: 23xx+
      if (row.account_code.startsWith('2') && parseInt(row.account_code) < 2300) {
        currentLiabilities.push(item);
      } else {
        longTermLiabilities.push(item);
      }
    });

    const totalLiabilities = [...currentLiabilities, ...longTermLiabilities].reduce((sum, item) => sum + item.amount, 0);

    const equityResult = await accountingDB.rawQueryAll(equityQuery, asOfDate);
    const equityItems: BalanceSheetItem[] = equityResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: parseFloat(row.balance)
    }));

    // Hitung Laba Bersih dari akun 4-8 (P&L accounts)
    const retainedEarningsQuery = `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN a.account_code LIKE '4%' OR a.account_code LIKE '7%' THEN jel.credit_amount - jel.debit_amount
              WHEN a.account_code LIKE '5%' OR a.account_code LIKE '6%' OR a.account_code LIKE '8%' THEN jel.debit_amount - jel.credit_amount
              ELSE 0
            END
          ), 0
        ) as retained_earnings
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE (a.account_code LIKE '4%' OR a.account_code LIKE '5%' OR a.account_code LIKE '6%' OR a.account_code LIKE '7%' OR a.account_code LIKE '8%')
        AND je.entry_date <= $1
        AND je.status = 'posted'
        AND a.is_active = true
    `;

    const retainedEarningsResult = await accountingDB.rawQueryRow(retainedEarningsQuery, asOfDate);
    const retainedEarnings = parseFloat(retainedEarningsResult?.retained_earnings || 0);

    const totalEquity = equityItems.reduce((sum, item) => sum + item.amount, 0) + retainedEarnings;

    return {
      assets: {
        currentAssets,
        fixedAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities,
        longTermLiabilities,
        totalLiabilities
      },
      equity: {
        equityItems,
        retainedEarnings,
        totalEquity
      },
      asOfDate
    };
  }
);