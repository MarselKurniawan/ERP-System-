import { api } from "encore.dev/api";
import { companyDB } from "./db";

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
    const tags = await companyDB.queryAll<Tag>`
      SELECT id, company_id as "companyId", name, color, created_at as "createdAt"
      FROM tags 
      WHERE company_id = ${companyId}
      ORDER BY name
    `;

    return { tags };
  }
);
