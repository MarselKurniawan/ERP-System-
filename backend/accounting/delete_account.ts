import { api, APIError } from "encore.dev/api";
import { accountingDB } from "./db";

// Deletes an account.
export const deleteAccount = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/accounts/:id" },
  async (req) => {
    const result = await accountingDB.exec`
      DELETE FROM chart_of_accounts WHERE id = ${req.id}
    `;
    
    if (result === 0) {
      throw APIError.notFound("Account not found");
    }
  }
);
