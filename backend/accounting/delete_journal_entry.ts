import { api } from "encore.dev/api";
import { accountingDB } from "./db";

export const deleteJournalEntry = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/journal-entries/:id" },
  async (req) => {
    await accountingDB.exec`
      DELETE FROM journal_entries WHERE id = ${req.id}
    `;
  }
);