import { api } from "encore.dev/api";
import { accountingDB } from "./db";

export interface CreateAccountRequest {
  accountCode: string;
  accountName: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentAccountId?: number;
}

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

// Creates a new account in the chart of accounts.
export const createAccount = api<CreateAccountRequest, Account>(
  { expose: true, method: "POST", path: "/accounts" },
  async (req) => {
    const account = await accountingDB.queryRow<Account>`
      INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id)
      VALUES (${req.accountCode}, ${req.accountName}, ${req.accountType}, ${req.parentAccountId || null})
      RETURNING id, account_code as "accountCode", account_name as "accountName", account_type as "accountType", parent_account_id as "parentAccountId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    return account!;
  }
);
