import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireAuth } from "../auth/permissions";

export interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAccountId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAccountsResponse {
  accounts: Account[];
}

// Retrieves all active accounts from the chart of accounts.
export const listAccounts = api<void, ListAccountsResponse>(
  { expose: true, method: "GET", path: "/accounts", auth: true },
  async () => {
    requireAuth();
    const accounts = await accountingDB.queryAll<Account>`
      SELECT id, account_code as "accountCode", account_name as "accountName", account_type as "accountType", parent_account_id as "parentAccountId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM chart_of_accounts
      WHERE is_active = TRUE
      ORDER BY account_code
    `;
    return { accounts };
  }
);
