import { api } from "encore.dev/api";
import { db } from "./db";

export interface AssignCompanyRequest {
  userId: number;
  companyId: number;
}

export const assignCompany = api(
  { method: "POST", path: "/auth/users/:userId/companies", expose: true, auth: true },
  async ({ userId, companyId }: AssignCompanyRequest): Promise<{ success: boolean }> => {
    await db.query(
      `INSERT INTO user_companies (user_id, company_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, company_id) DO NOTHING`,
      [userId, companyId]
    );
    return { success: true };
  }
);
