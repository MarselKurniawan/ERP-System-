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

    const accountBalanceQuery = `
      SELECT 
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(
          CASE 
            WHEN a.account_type IN ('asset', 'expense') THEN SUM(jel.debit_amount - jel.credit_amount)
            ELSE SUM(jel.credit_amount - jel.debit_amount)
          END, 0
        ) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_type = $1
        AND je.entry_date <= $2
        AND je.status = 'posted'
        AND a.is_active = true
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      HAVING COALESCE(
        CASE 
          WHEN a.account_type IN ('asset', 'expense') THEN SUM(jel.debit_amount - jel.credit_amount)
          ELSE SUM(jel.credit_amount - jel.debit_amount)
        END, 0
      ) != 0
      ORDER BY a.account_code
    `;

    const assetsResult = await accountingDB.rawQueryAll(accountBalanceQuery, 'asset', asOfDate);
    
    const currentAssets: BalanceSheetItem[] = [];
    const fixedAssets: BalanceSheetItem[] = [];
    
    assetsResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      if (row.account_code.startsWith('1') && parseInt(row.account_code) < 1500) {
        currentAssets.push(item);
      } else {
        fixedAssets.push(item);
      }
    });

    const totalAssets = [...currentAssets, ...fixedAssets].reduce((sum, item) => sum + item.amount, 0);

    const liabilitiesResult = await accountingDB.rawQueryAll(accountBalanceQuery, 'liability', asOfDate);
    
    const currentLiabilities: BalanceSheetItem[] = [];
    const longTermLiabilities: BalanceSheetItem[] = [];
    
    liabilitiesResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      if (row.account_code.startsWith('2') && parseInt(row.account_code) < 2300) {
        currentLiabilities.push(item);
      } else {
        longTermLiabilities.push(item);
      }
    });

    const totalLiabilities = [...currentLiabilities, ...longTermLiabilities].reduce((sum, item) => sum + item.amount, 0);

    const equityResult = await accountingDB.rawQueryAll(accountBalanceQuery, 'equity', asOfDate);
    const equityItems: BalanceSheetItem[] = equityResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: parseFloat(row.balance)
    }));

    const retainedEarningsQuery = `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN a.account_type = 'revenue' THEN jel.credit_amount - jel.debit_amount
              WHEN a.account_type = 'expense' THEN jel.debit_amount - jel.credit_amount
              ELSE 0
            END
          ), 0
        ) as retained_earnings
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_type IN ('revenue', 'expense')
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