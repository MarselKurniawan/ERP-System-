import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface AssignCompanyRequest {
  userId: number;
  companyId: number;
}

export const assignCompany = api(
  { method: "POST", path: "/auth/users/:userId/companies", expose: true, auth: true },
  async ({ userId, companyId }: AssignCompanyRequest): Promise<{ success: boolean }> => {
    await authDB.exec`
      INSERT INTO user_companies (user_id, company_id) 
      VALUES (${userId}, ${companyId}) 
      ON CONFLICT (user_id, company_id) DO NOTHING
    `;
    return { success: true };
  }
);
