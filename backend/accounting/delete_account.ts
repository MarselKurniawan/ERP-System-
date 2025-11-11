import { api, APIError } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";

// Deletes an account.
export const deleteAccount = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/accounts/:id", auth: true },
  async (req) => {
    requireRole(["admin", "accountant"]);
    await accountingDB.exec`
      DELETE FROM chart_of_accounts WHERE id = ${req.id}
    `;
  }
);
