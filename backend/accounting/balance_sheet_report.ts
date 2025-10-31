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
    totalCurrentAssets: number;
    fixedAssets: BalanceSheetItem[];
    depreciation: BalanceSheetItem[];
    totalFixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    shortTerm: BalanceSheetItem[];
    longTerm: BalanceSheetItem[];
    totalLiabilities: number;
  };
  equity: {
    capital: BalanceSheetItem[];
    openingBalance: BalanceSheetItem[];
    currentYearEarnings: number;
    priorYearEarnings: number;
    totalEquity: number;
  };
  totalPassiva: number;
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
    const depreciation: BalanceSheetItem[] = [];
    
    assetsResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      if (row.account_name.toLowerCase().includes('depresiasi') || row.account_name.toLowerCase().includes('akumulasi penyusutan')) {
        depreciation.push(item);
      } else if (row.account_code.startsWith('1') && parseInt(row.account_code) < 1500) {
        currentAssets.push(item);
      } else {
        fixedAssets.push(item);
      }
    });

    const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.amount, 0);
    const totalFixedAssetsGross = fixedAssets.reduce((sum, item) => sum + item.amount, 0);
    const totalDepreciation = depreciation.reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const totalFixedAssets = totalFixedAssetsGross - totalDepreciation;
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const liabilitiesResult = await accountingDB.rawQueryAll(liabilitiesQuery, asOfDate);
    const shortTerm: BalanceSheetItem[] = [];
    const longTerm: BalanceSheetItem[] = [];
    
    liabilitiesResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      if (row.account_name.toLowerCase().includes('jangka pendek') || row.account_name.toLowerCase().includes('lancar')) {
        shortTerm.push(item);
      } else {
        longTerm.push(item);
      }
    });

    const totalLiabilities = [...shortTerm, ...longTerm].reduce((sum, item) => sum + item.amount, 0);

    const equityResult = await accountingDB.rawQueryAll(equityQuery, asOfDate);
    const capital: BalanceSheetItem[] = [];
    const openingBalance: BalanceSheetItem[] = [];
    
    equityResult.forEach(row => {
      const item: BalanceSheetItem = {
        accountCode: row.account_code,
        accountName: row.account_name,
        amount: parseFloat(row.balance)
      };
      
      if (row.account_name.toLowerCase().includes('modal saham') || row.account_name.toLowerCase().includes('capital')) {
        capital.push(item);
      } else if (row.account_name.toLowerCase().includes('saldo awal') || row.account_name.toLowerCase().includes('opening')) {
        openingBalance.push(item);
      } else {
        capital.push(item);
      }
    });

    const startOfYear = new Date(asOfDate);
    startOfYear.setMonth(0, 1);
    const startOfYearStr = startOfYear.toISOString().split('T')[0];

    const currentYearEarningsQuery = `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN a.account_code LIKE '4%' OR a.account_code LIKE '7%' THEN jel.credit_amount - jel.debit_amount
              WHEN a.account_code LIKE '5%' OR a.account_code LIKE '6%' OR a.account_code LIKE '8%' THEN jel.debit_amount - jel.credit_amount
              ELSE 0
            END
          ), 0
        ) as earnings
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE (a.account_code LIKE '4%' OR a.account_code LIKE '5%' OR a.account_code LIKE '6%' OR a.account_code LIKE '7%' OR a.account_code LIKE '8%')
        AND je.entry_date BETWEEN $1 AND $2
        AND je.status = 'posted'
        AND a.is_active = true
    `;

    const priorYearEarningsQuery = `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN a.account_code LIKE '4%' OR a.account_code LIKE '7%' THEN jel.credit_amount - jel.debit_amount
              WHEN a.account_code LIKE '5%' OR a.account_code LIKE '6%' OR a.account_code LIKE '8%' THEN jel.debit_amount - jel.credit_amount
              ELSE 0
            END
          ), 0
        ) as earnings
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE (a.account_code LIKE '4%' OR a.account_code LIKE '5%' OR a.account_code LIKE '6%' OR a.account_code LIKE '7%' OR a.account_code LIKE '8%')
        AND je.entry_date < $1
        AND je.status = 'posted'
        AND a.is_active = true
    `;

    const currentYearResult = await accountingDB.rawQueryRow(currentYearEarningsQuery, startOfYearStr, asOfDate);
    const currentYearEarnings = parseFloat(currentYearResult?.earnings || 0);

    const priorYearResult = await accountingDB.rawQueryRow(priorYearEarningsQuery, startOfYearStr);
    const priorYearEarnings = parseFloat(priorYearResult?.earnings || 0);

    const totalEquity = capital.reduce((sum, item) => sum + item.amount, 0) + 
                       openingBalance.reduce((sum, item) => sum + item.amount, 0) + 
                       currentYearEarnings + 
                       priorYearEarnings;

    const totalPassiva = totalLiabilities + totalEquity;

    return {
      assets: {
        currentAssets,
        totalCurrentAssets,
        fixedAssets,
        depreciation,
        totalFixedAssets,
        totalAssets
      },
      liabilities: {
        shortTerm,
        longTerm,
        totalLiabilities
      },
      equity: {
        capital,
        openingBalance,
        currentYearEarnings,
        priorYearEarnings,
        totalEquity
      },
      totalPassiva,
      asOfDate
    };
  }
);