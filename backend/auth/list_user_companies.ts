import { api } from "encore.dev/api";
import { authDB } from "./db";
import { getAuthData } from "~encore/auth";
import { company } from "~encore/clients";
import log from "encore.dev/log";

export interface UserCompany {
  id: number;
  name: string;
  industry: string | null;
  assignedAt: Date;
}

export const listUserCompanies = api(
  { method: "GET", path: "/auth/my-companies", expose: true, auth: true },
  async (): Promise<{ companies: UserCompany[] }> => {
    try {
      const auth = getAuthData();
      log.info("Auth data:", { auth });
      const userIdString = auth?.userID;

      if (!userIdString) {
        log.error("No user ID found");
        throw new Error("User not authenticated");
      }

      const userId = parseInt(userIdString, 10);
      log.info("Querying user_companies for user:", { userId });
      const userCompanies = [];
      for await (const row of authDB.query<{ company_id: number; created_at: Date }>`
        SELECT company_id, created_at
        FROM user_companies
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `) {
        userCompanies.push(row);
      }

      log.info("Found user companies:", { count: userCompanies.length });

      if (userCompanies.length === 0) {
        return { companies: [] };
      }

      const companyIds = userCompanies.map(uc => uc.company_id);
      log.info("Fetching companies with IDs:", { companyIds });
      
      const companies = userCompanies.map(uc => {
        return {
          id: uc.company_id,
          name: `Company ${uc.company_id}`,
          industry: null,
          assignedAt: uc.created_at,
        };
      });

      log.info("Returning companies:", { count: companies.length });
      return { companies };
    } catch (error) {
      log.error("Error in listUserCompanies:", error);
      throw error;
    }
  }
);
