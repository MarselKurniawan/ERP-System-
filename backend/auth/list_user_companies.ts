import { api } from "encore.dev/api";
import { authDB } from "./db";
import { getAuthData } from "~encore/auth";

export interface UserCompany {
  id: number;
  name: string;
  industry: string | null;
  assignedAt: Date;
}

export const listUserCompanies = api(
  { method: "GET", path: "/auth/my-companies", expose: true, auth: true },
  async (): Promise<{ companies: UserCompany[] }> => {
    const auth = getAuthData();
    const userId = auth?.userID;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const companies = [];
    for await (const row of authDB.query`
      SELECT c.id, c.name, c.industry, uc.created_at as assigned_at
      FROM user_companies uc
      JOIN companies c ON c.id = uc.company_id
      WHERE uc.user_id = ${userId}
      ORDER BY uc.created_at DESC
    `) {
      companies.push({
        id: row.id,
        name: row.name,
        industry: row.industry,
        assignedAt: row.assigned_at,
      });
    }

    return { companies };
  }
);
