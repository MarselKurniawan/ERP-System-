import { api } from "encore.dev/api";
import { companyDB } from "./db";

export interface DeleteTagRequest {
  companyId: number;
  tagId: number;
}

export const deleteTag = api(
  { method: "DELETE", path: "/companies/:companyId/tags/:tagId", expose: true, auth: true },
  async ({ companyId, tagId }: DeleteTagRequest): Promise<{ success: boolean }> => {
    await companyDB.exec`
      DELETE FROM tags WHERE id = ${tagId} AND company_id = ${companyId}
    `;
    return { success: true };
  }
);
