import { api } from "encore.dev/api";
import { db } from "./db";

export interface DeleteTagRequest {
  companyId: number;
  tagId: number;
}

export const deleteTag = api(
  { method: "DELETE", path: "/companies/:companyId/tags/:tagId", expose: true, auth: true },
  async ({ companyId, tagId }: DeleteTagRequest): Promise<{ success: boolean }> => {
    await db.query(
      `DELETE FROM tags WHERE id = $1 AND company_id = $2`,
      [tagId, companyId]
    );
    return { success: true };
  }
);
