import { api } from "encore.dev/api";
import { db } from "./db";

export interface UnassignCompanyRequest {
  userId: number;
  companyId: number;
}

export const unassignCompany = api(
  { method: "DELETE", path: "/auth/users/:userId/companies/:companyId", expose: true, auth: true },
  async ({ userId, companyId }: UnassignCompanyRequest): Promise<{ success: boolean }> => {
    await db.query(
      `DELETE FROM user_companies WHERE user_id = $1 AND company_id = $2`,
      [userId, companyId]
    );
    return { success: true };
  }
);
