import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface ProfitLossRequest {
  startDate: string;
  endDate: string;
  companyId?: number;
}

export interface ProfitLossItem {
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface ProfitLossReport {
  pendapatanUsaha: ProfitLossItem[];
  totalPendapatanUsaha: number;
  bebanPokokPendapatan: ProfitLossItem[];
  totalBebanPokok: number;
  labaKotor: number;
  bebanOperasional: ProfitLossItem[];
  totalBebanOperasional: number;
  labaOperasional: number;
  pendapatanLain: ProfitLossItem[];
  totalPendapatanLain: number;
  bebanLain: ProfitLossItem[];
  totalBebanLain: number;
  totalPendapatanBebanLain: number;
  labaRugiBersih: number;
  periode: {
    startDate: string;
    endDate: string;
  };
}

export const profitLossReport = api(
  { method: "POST", path: "/accounting/reports/profit-loss", expose: true, auth: true },
  async (req: ProfitLossRequest): Promise<ProfitLossReport> => {
    requireRole(["admin", "accountant", "manager"]);
    const { startDate, endDate } = req;

    const accountBalanceQuery = `
      SELECT 
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.entry_date BETWEEN $2 AND $3 AND je.status = 'posted'
      WHERE a.account_code LIKE $1
        AND a.is_active = true
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      HAVING COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) != 0
      ORDER BY a.account_code
    `;

    // 4. Pendapatan Usaha (Revenue)
    const pendapatanUsahaResult = await accountingDB.rawQueryAll(accountBalanceQuery, '4%', startDate, endDate);
    const pendapatanUsaha: ProfitLossItem[] = pendapatanUsahaResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: parseFloat(row.balance)
    }));
    const totalPendapatanUsaha = pendapatanUsaha.reduce((sum, item) => sum + item.amount, 0);

    // 5. Beban Pokok Pendapatan (Cost of Revenue)
    const bebanPokokResult = await accountingDB.rawQueryAll(accountBalanceQuery, '5%', startDate, endDate);
    const bebanPokokPendapatan: ProfitLossItem[] = bebanPokokResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: Math.abs(parseFloat(row.balance))
    }));
    const totalBebanPokok = bebanPokokPendapatan.reduce((sum, item) => sum + item.amount, 0);

    // Laba Kotor = Total Pendapatan Usaha - Beban Pokok Pendapatan
    const labaKotor = totalPendapatanUsaha - totalBebanPokok;

    // 6. Beban Operasional
    const bebanOperasionalResult = await accountingDB.rawQueryAll(accountBalanceQuery, '6%', startDate, endDate);
    const bebanOperasional: ProfitLossItem[] = bebanOperasionalResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: Math.abs(parseFloat(row.balance))
    }));
    const totalBebanOperasional = bebanOperasional.reduce((sum, item) => sum + item.amount, 0);

    // Laba Operasional = Laba Kotor - Beban Operasional
    const labaOperasional = labaKotor - totalBebanOperasional;

    // 7. Pendapatan Lain
    const pendapatanLainResult = await accountingDB.rawQueryAll(accountBalanceQuery, '7%', startDate, endDate);
    const pendapatanLain: ProfitLossItem[] = pendapatanLainResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: parseFloat(row.balance)
    }));
    const totalPendapatanLain = pendapatanLain.reduce((sum, item) => sum + item.amount, 0);

    // 8. Beban Lain
    const bebanLainResult = await accountingDB.rawQueryAll(accountBalanceQuery, '8%', startDate, endDate);
    const bebanLain: ProfitLossItem[] = bebanLainResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: Math.abs(parseFloat(row.balance))
    }));
    const totalBebanLain = bebanLain.reduce((sum, item) => sum + item.amount, 0);

    // Total Pendapatan & Beban Lain = Pendapatan Lain - Beban Lain
    const totalPendapatanBebanLain = totalPendapatanLain - totalBebanLain;

    // Laba Rugi Bersih = Laba Operasional - Total Pendapatan & Beban Lain
    const labaRugiBersih = labaOperasional - totalPendapatanBebanLain;

    return {
      pendapatanUsaha,
      totalPendapatanUsaha,
      bebanPokokPendapatan,
      totalBebanPokok,
      labaKotor,
      bebanOperasional,
      totalBebanOperasional,
      labaOperasional,
      pendapatanLain,
      totalPendapatanLain,
      bebanLain,
      totalBebanLain,
      totalPendapatanBebanLain,
      labaRugiBersih,
      periode: {
        startDate,
        endDate
      }
    };
  }
);