import { api } from "encore.dev/api";
import { companyDB } from "./db";

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
    const tag = await companyDB.queryRow<Tag>`
      INSERT INTO tags (company_id, name, color) 
      VALUES (${companyId}, ${name}, ${color || '#3b82f6'}) 
      RETURNING id, company_id as "companyId", name, color, created_at as "createdAt"
    `;
    return tag!;
  }
);
