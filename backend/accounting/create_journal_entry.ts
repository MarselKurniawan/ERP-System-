import { api, APIError } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";
import { invalidateAccountingReports } from "./invalidate_cache";

export interface CreateJournalEntryRequest {
  entryDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: number;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  accountId: number;
  description?: string;
  debitAmount?: number;
  creditAmount?: number;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: Date;
  referenceType?: string;
  referenceId?: number;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new journal entry with validation for balanced debits and credits.
export const createJournalEntry = api<CreateJournalEntryRequest, JournalEntry>(
  { expose: true, method: "POST", path: "/journal-entries", auth: true },
  async (req) => {
    requireRole(["admin", "accountant"]);
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of req.lines) {
      totalDebit += line.debitAmount || 0;
      totalCredit += line.creditAmount || 0;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw APIError.invalidArgument("Journal entry must be balanced - total debits must equal total credits");
    }

    return await accountingDB.begin().then(async (tx) => {
      try {
        const entryNumber = `JE-${Date.now()}`;

        const entry = await tx.queryRow<JournalEntry>`
          INSERT INTO journal_entries (entry_number, entry_date, reference_type, reference_id, description, total_debit, total_credit)
          VALUES (${entryNumber}, ${req.entryDate}, ${req.referenceType || null}, ${req.referenceId || null}, ${req.description}, ${totalDebit}, ${totalCredit})
          RETURNING id, entry_number as "entryNumber", entry_date as "entryDate", reference_type as "referenceType", reference_id as "referenceId", description, total_debit as "totalDebit", total_credit as "totalCredit", status, created_at as "createdAt", updated_at as "updatedAt"
        `;

        for (const line of req.lines) {
          await tx.exec`
            INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit_amount, credit_amount)
            VALUES (${entry!.id}, ${line.accountId}, ${line.description || null}, ${line.debitAmount || 0}, ${line.creditAmount || 0})
          `;
        }

        await tx.commit();
        invalidateAccountingReports();
        return entry!;
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    });
  }
);
