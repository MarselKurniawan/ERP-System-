import { api } from "encore.dev/api";
import { accountingDB } from "./db";

// Seeds the database with sample accounting data.
export const seedAccounting = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/accounting/seed" },
  async () => {
    const companyIds = [1, 2, 3];

    for (const companyId of companyIds) {
      const journalEntries = [
      {
        entryDate: new Date('2024-01-01'),
        description: 'Opening balance entry',
        referenceType: 'Opening',
        lines: [
          { accountCode: '1000', description: 'Opening cash balance', debitAmount: 100000000, creditAmount: 0 },
          { accountCode: '1200', description: 'Opening inventory balance', debitAmount: 50000000, creditAmount: 0 },
          { accountCode: '1500', description: 'Opening equipment balance', debitAmount: 200000000, creditAmount: 0 },
          { accountCode: '3000', description: 'Opening equity balance', debitAmount: 0, creditAmount: 350000000 }
        ]
      },
      {
        entryDate: new Date('2024-01-15'),
        description: 'Sales revenue recognition',
        referenceType: 'Sales',
        lines: [
          { accountCode: '1100', description: 'Accounts receivable from sales', debitAmount: 83250000, creditAmount: 0 },
          { accountCode: '4000', description: 'Sales revenue', debitAmount: 0, creditAmount: 75000000 },
          { accountCode: '2000', description: 'VAT payable', debitAmount: 0, creditAmount: 8250000 }
        ]
      },
      {
        entryDate: new Date('2024-01-20'),
        description: 'Purchase of inventory',
        referenceType: 'Purchase',
        lines: [
          { accountCode: '1200', description: 'Inventory purchase', debitAmount: 55500000, creditAmount: 0 },
          { accountCode: '2000', description: 'Accounts payable', debitAmount: 0, creditAmount: 50000000 },
          { accountCode: '2000', description: 'VAT payable', debitAmount: 0, creditAmount: 5500000 }
        ]
      },
      {
        entryDate: new Date('2024-01-25'),
        description: 'Office rent payment',
        referenceType: 'Expense',
        lines: [
          { accountCode: '6100', description: 'Monthly office rent', debitAmount: 15000000, creditAmount: 0 },
          { accountCode: '1000', description: 'Cash payment for rent', debitAmount: 0, creditAmount: 15000000 }
        ]
      },
      {
        entryDate: new Date('2024-01-30'),
        description: 'Utilities expense',
        referenceType: 'Expense',
        lines: [
          { accountCode: '6200', description: 'Electricity and water bills', debitAmount: 3500000, creditAmount: 0 },
          { accountCode: '1000', description: 'Cash payment for utilities', debitAmount: 0, creditAmount: 3500000 }
        ]
      }
      ];

      const accounts = await accountingDB.queryAll<{ id: number; accountCode: string }>`
        SELECT id, account_code as "accountCode" FROM chart_of_accounts WHERE company_id = ${companyId}
      `;
      
      const accountMap = new Map(accounts.map(acc => [acc.accountCode, acc.id]));

      for (const entry of journalEntries) {
        const entryNumber = `JE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        let totalDebit = 0;
        let totalCredit = 0;
        
        for (const line of entry.lines) {
          totalDebit += line.debitAmount || 0;
          totalCredit += line.creditAmount || 0;
        }

        const newEntry = await accountingDB.queryRow<{ id: number }>`
          INSERT INTO journal_entries (entry_number, entry_date, reference_type, description, company_id, total_debit, total_credit, status)
          VALUES (${entryNumber}, ${entry.entryDate}, ${entry.referenceType}, ${entry.description}, ${companyId}, ${totalDebit}, ${totalCredit}, 'posted')
          RETURNING id
        `;

        if (newEntry) {
          for (const line of entry.lines) {
            const accountId = accountMap.get(line.accountCode);
            if (accountId) {
              await accountingDB.exec`
                INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit_amount, credit_amount)
                VALUES (${newEntry.id}, ${accountId}, ${line.description}, ${line.debitAmount || 0}, ${line.creditAmount || 0})
              `;
            }
          }
        }
      }
    }

    return { message: "Sample accounting data created successfully" };
  }
);
