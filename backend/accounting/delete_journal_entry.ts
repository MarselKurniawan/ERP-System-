import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";

export const deleteJournalEntry = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/journal-entries/:id", auth: true },
  async (req) => {
    requireRole(["admin", "accountant"]);
    await accountingDB.exec`
      DELETE FROM journal_entries WHERE id = ${req.id}
    `;
  }
);