import { api } from "encore.dev/api";
import { companyDB } from "./db";

export interface Company {
  id: number;
  name: string;
  industry: string | null;
}

export interface GetByIdsRequest {
  ids: number[];
}

export const getByIds = api(
  { method: "POST", path: "/companies/by-ids", expose: true },
  async (req: GetByIdsRequest): Promise<{ companies: Company[] }> => {
    if (!req.ids || req.ids.length === 0) {
      return { companies: [] };
    }

    const companies: Company[] = [];
    
    for await (const row of companyDB.query`
      SELECT id, name, industry
      FROM companies
      WHERE id = ANY(${req.ids})
    `) {
      companies.push({
        id: row.id,
        name: row.name,
        industry: row.industry,
      });
    }

    return { companies };
  }
);
