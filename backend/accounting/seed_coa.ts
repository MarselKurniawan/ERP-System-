import { api } from "encore.dev/api";
import { accountingDB } from "./db";

export const seedChartOfAccounts = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/accounting/seed-coa" },
  async () => {
    const companyIds = [1, 2, 3];

    const defaultAccounts = [
      { code: '1000', name: 'Cash', type: 'Asset' },
      { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
      { code: '1200', name: 'Inventory', type: 'Asset' },
      { code: '1300', name: 'Prepaid Expenses', type: 'Asset' },
      { code: '1500', name: 'Equipment', type: 'Asset' },
      { code: '2000', name: 'Accounts Payable', type: 'Liability' },
      { code: '2100', name: 'Accrued Liabilities', type: 'Liability' },
      { code: '2200', name: 'Short-term Debt', type: 'Liability' },
      { code: '3000', name: 'Owner Equity', type: 'Equity' },
      { code: '3100', name: 'Retained Earnings', type: 'Equity' },
      { code: '4000', name: 'Sales Revenue', type: 'Revenue' },
      { code: '4100', name: 'Service Revenue', type: 'Revenue' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
      { code: '6000', name: 'Operating Expenses', type: 'Expense' },
      { code: '6100', name: 'Rent Expense', type: 'Expense' },
      { code: '6200', name: 'Utilities Expense', type: 'Expense' },
      { code: '6300', name: 'Office Supplies Expense', type: 'Expense' },
      { code: '7000', name: 'Other Revenue', type: 'Revenue' },
      { code: '7100', name: 'Interest Revenue', type: 'Revenue' },
      { code: '7200', name: 'Investment Revenue', type: 'Revenue' },
      { code: '8000', name: 'Other Expenses', type: 'Expense' },
      { code: '8100', name: 'Interest Expense', type: 'Expense' },
      { code: '8200', name: 'Loss on Assets', type: 'Expense' }
    ];

    for (const companyId of companyIds) {
      for (const account of defaultAccounts) {
        const existing = await accountingDB.queryRow`
          SELECT id FROM chart_of_accounts 
          WHERE account_code = ${account.code} AND company_id = ${companyId}
        `;

        if (!existing) {
          await accountingDB.exec`
            INSERT INTO chart_of_accounts (account_code, name, account_type, company_id)
            VALUES (${account.code}, ${account.name}, ${account.type}, ${companyId})
          `;
        }
      }
    }

    return { message: "Chart of accounts seeded successfully for all companies" };
  }
);
