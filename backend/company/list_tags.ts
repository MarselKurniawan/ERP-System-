import { api } from "encore.dev/api";
import { db } from "./db";

export interface Tag {
  id: number;
  companyId: number;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ListTagsRequest {
  companyId: number;
}

export const listTags = api(
  { method: "GET", path: "/companies/:companyId/tags", expose: true, auth: true },
  async ({ companyId }: ListTagsRequest): Promise<{ tags: Tag[] }> => {
    const result = await db.query(
      `SELECT id, company_id, name, color, created_at 
       FROM tags 
       WHERE company_id = $1 
       ORDER BY name`,
      [companyId]
    );

    return {
      tags: result.rows.map((row) => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        color: row.color,
        createdAt: row.created_at,
      })),
    };
  }
);
