import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";
import { requireRole } from "../auth/permissions";

export interface UpdateCategoryRequest {
  id: number;
  name?: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

// Updates a category.
export const updateCategory = api<UpdateCategoryRequest, Category>(
  { expose: true, method: "PUT", path: "/categories/:id", auth: true },
  async (req) => {
    requireRole(["admin", "manager"]);
    const category = await inventoryDB.queryRow<Category>`
      UPDATE categories 
      SET 
        name = COALESCE(${req.name}, name),
        description = COALESCE(${req.description}, description)
      WHERE id = ${req.id}
      RETURNING id, name, description, created_at as "createdAt"
    `;
    
    if (!category) {
      throw APIError.notFound("Category not found");
    }
    
    return category;
  }
);
