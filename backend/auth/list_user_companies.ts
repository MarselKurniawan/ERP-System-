import { api } from "encore.dev/api";
import { db } from "./db";
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
    const userId = auth?.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const result = await db.query(
      `SELECT c.id, c.name, c.industry, uc.created_at as assigned_at
       FROM user_companies uc
       JOIN companies c ON c.id = uc.company_id
       WHERE uc.user_id = $1
       ORDER BY uc.created_at DESC`,
      [userId]
    );

    return {
      companies: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        industry: row.industry,
        assignedAt: row.assigned_at,
      })),
    };
  }
);
