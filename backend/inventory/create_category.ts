import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

// Creates a new product category.
export const createCategory = api<CreateCategoryRequest, Category>(
  { expose: true, method: "POST", path: "/categories" },
  async (req) => {
    const category = await inventoryDB.queryRow<Category>`
      INSERT INTO categories (name, description)
      VALUES (${req.name}, ${req.description || null})
      RETURNING id, name, description, created_at as "createdAt"
    `;
    return category!;
  }
);
