import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface UnassignCompanyRequest {
  userId: number;
  companyId: number;
}

export const unassignCompany = api(
  { method: "DELETE", path: "/auth/users/:userId/companies/:companyId", expose: true, auth: true },
  async ({ userId, companyId }: UnassignCompanyRequest): Promise<{ success: boolean }> => {
    await authDB.exec`
      DELETE FROM user_companies WHERE user_id = ${userId} AND company_id = ${companyId}
    `;
    return { success: true };
  }
);
