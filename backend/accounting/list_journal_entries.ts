import { api } from "encore.dev/api";
import { accountingDB } from "./db";

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

export interface ListJournalEntriesResponse {
  entries: JournalEntry[];
}

// Retrieves all journal entries ordered by entry date.
export const listJournalEntries = api<void, ListJournalEntriesResponse>(
  { expose: true, method: "GET", path: "/journal-entries" },
  async () => {
    const entries = await accountingDB.queryAll<JournalEntry>`
      SELECT id, entry_number as "entryNumber", entry_date as "entryDate", reference_type as "referenceType", reference_id as "referenceId", description, total_debit as "totalDebit", total_credit as "totalCredit", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM journal_entries
      ORDER BY entry_date DESC, created_at DESC
    `;
    return { entries };
  }
);
