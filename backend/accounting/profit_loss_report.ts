import { api } from "encore.dev/api";
import { accountingDB } from "./db";

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
  pendapatan: ProfitLossItem[];
  hpp: ProfitLossItem[];
  pendapatanBersih: number;
  biayaOperasional: ProfitLossItem[];
  pendapatanOperasional: number;
  pendapatanLain: ProfitLossItem[];
  bebanLain: ProfitLossItem[];
  pendapatanLainLain: number;
  labaBersih: number;
  periode: {
    startDate: string;
    endDate: string;
  };
}

export const profitLossReport = api(
  { method: "POST", path: "/accounting/reports/profit-loss", expose: true },
  async (req: ProfitLossRequest): Promise<ProfitLossReport> => {
    const { startDate, endDate } = req;

    // Query untuk mendapatkan saldo akun berdasarkan kategori
    const accountBalanceQuery = `
      SELECT 
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_code LIKE $1
        AND je.entry_date BETWEEN $2 AND $3
        AND je.status = 'posted'
        AND a.is_active = true
      GROUP BY a.id, a.account_code, a.account_name, a.account_type
      ORDER BY a.account_code
    `;

    // 4. Pendapatan (Credit) - account codes starting with 4
    const pendapatanResult = await accountingDB.query(accountBalanceQuery, ['4%', startDate, endDate]);
    const pendapatan: ProfitLossItem[] = pendapatanResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: parseFloat(row.balance)
    }));

    // 5. HPP (Debit) - account codes starting with 5
    const hppResult = await accountingDB.query(accountBalanceQuery, ['5%', startDate, endDate]);
    const hpp: ProfitLossItem[] = hppResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: Math.abs(parseFloat(row.balance)) // Make positive for display
    }));

    // 6. Biaya Operasional (Debit) - account codes starting with 6
    const biayaOperasionalResult = await accountingDB.query(accountBalanceQuery, ['6%', startDate, endDate]);
    const biayaOperasional: ProfitLossItem[] = biayaOperasionalResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: Math.abs(parseFloat(row.balance)) // Make positive for display
    }));

    // 7. Pendapatan Lain (Kredit) - account codes starting with 7
    const pendapatanLainResult = await accountingDB.query(accountBalanceQuery, ['7%', startDate, endDate]);
    const pendapatanLain: ProfitLossItem[] = pendapatanLainResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: parseFloat(row.balance)
    }));

    // 8. Beban Lain (Debit) - account codes starting with 8
    const bebanLainResult = await accountingDB.query(accountBalanceQuery, ['8%', startDate, endDate]);
    const bebanLain: ProfitLossItem[] = bebanLainResult.map(row => ({
      accountCode: row.account_code,
      accountName: row.account_name,
      amount: Math.abs(parseFloat(row.balance)) // Make positive for display
    }));

    // Calculations
    const totalPendapatan = pendapatan.reduce((sum, item) => sum + item.amount, 0);
    const totalHpp = hpp.reduce((sum, item) => sum + item.amount, 0);
    const pendapatanBersih = totalPendapatan - totalHpp;

    const totalBiayaOperasional = biayaOperasional.reduce((sum, item) => sum + item.amount, 0);
    const pendapatanOperasional = pendapatanBersih - totalBiayaOperasional;

    const totalPendapatanLain = pendapatanLain.reduce((sum, item) => sum + item.amount, 0);
    const totalBebanLain = bebanLain.reduce((sum, item) => sum + item.amount, 0);
    const pendapatanLainLain = totalPendapatanLain - totalBebanLain;

    const labaBersih = pendapatanOperasional + pendapatanLainLain;

    return {
      pendapatan,
      hpp,
      pendapatanBersih,
      biayaOperasional,
      pendapatanOperasional,
      pendapatanLain,
      bebanLain,
      pendapatanLainLain,
      labaBersih,
      periode: {
        startDate,
        endDate
      }
    };
  }
);