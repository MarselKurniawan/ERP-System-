import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface ListCategoriesResponse {
  categories: Category[];
}

// Retrieves all product categories.
export const listCategories = api<void, ListCategoriesResponse>(
  { expose: true, method: "GET", path: "/categories" },
  async () => {
    const categories = await inventoryDB.queryAll<Category>`
      SELECT id, name, description, created_at as "createdAt"
      FROM categories
      ORDER BY name
    `;
    return { categories };
  }
);
