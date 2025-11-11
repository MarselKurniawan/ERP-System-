import { api, APIError } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface UpdateAccountRequest {
  id: number;
  accountCode?: string;
  accountName?: string;
  accountType?: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentAccountId?: number;
  isActive?: boolean;
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

// Updates an account.
export const updateAccount = api<UpdateAccountRequest, Account>(
  { expose: true, method: "PUT", path: "/accounts/:id", auth: true },
  async (req) => {
    requireRole(["admin", "accountant"]);
    const account = await accountingDB.queryRow<Account>`
      UPDATE chart_of_accounts 
      SET 
        account_code = COALESCE(${req.accountCode}, account_code),
        account_name = COALESCE(${req.accountName}, account_name),
        account_type = COALESCE(${req.accountType}, account_type),
        parent_account_id = COALESCE(${req.parentAccountId}, parent_account_id),
        is_active = COALESCE(${req.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, account_code as "accountCode", account_name as "accountName", account_type as "accountType", parent_account_id as "parentAccountId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!account) {
      throw APIError.notFound("Account not found");
    }
    
    return account;
  }
);
