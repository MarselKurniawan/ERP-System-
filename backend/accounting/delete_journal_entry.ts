import { api, APIError } from "encore.dev/api";
import { accountingDB } from "./db";

// Deletes a journal entry.
export const deleteJournalEntry = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/journal-entries/:id" },
  async (req) => {
    const result = await accountingDB.exec`
      DELETE FROM journal_entries WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Journal entry not found");
    }
  }
);
