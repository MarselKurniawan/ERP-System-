import { api } from "encore.dev/api";
import { accountingDB } from "./db";
import { requireAuth } from "../auth/permissions";

export interface ChartOfAccount {
  id: number;
  accountCode: string;
  name: string;
  accountType: string;
  description?: string;
  parentAccountId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAccountsResponse {
  accounts: ChartOfAccount[];
}

export interface ListAccountsRequest {
  companyId?: number;
}

export const listAccounts = api<ListAccountsRequest, ListAccountsResponse>(
  { expose: true, method: "GET", path: "/accounts", auth: true },
  async (req) => {
    requireAuth();
    
    if (req.companyId) {
      const accounts = await accountingDB.queryAll<ChartOfAccount>`
        SELECT id, account_code as "accountCode", name, account_type as "accountType", description, parent_account_id as "parentAccountId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
        FROM chart_of_accounts
        WHERE is_active = TRUE AND company_id = ${req.companyId}
        ORDER BY account_code
      `;
      return { accounts };
    }
    
    const accounts = await accountingDB.queryAll<ChartOfAccount>`
      SELECT id, account_code as "accountCode", name, account_type as "accountType", description, parent_account_id as "parentAccountId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM chart_of_accounts
      WHERE is_active = TRUE
      ORDER BY account_code
    `;
    return { accounts };
  }
);
