import { api } from "encore.dev/api";
import { db } from "./db";

export interface CreateTagRequest {
  companyId: number;
  name: string;
  color?: string;
}

export interface Tag {
  id: number;
  companyId: number;
  name: string;
  color: string;
  createdAt: Date;
}

export const createTag = api(
  { method: "POST", path: "/companies/:companyId/tags", expose: true, auth: true },
  async ({ companyId, name, color }: CreateTagRequest): Promise<Tag> => {
    const result = await db.query(
      `INSERT INTO tags (company_id, name, color) 
       VALUES ($1, $2, $3) 
       RETURNING id, company_id, name, color, created_at`,
      [companyId, name, color || '#3b82f6']
    );

    const row = result.rows[0];
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
    };
  }
);
