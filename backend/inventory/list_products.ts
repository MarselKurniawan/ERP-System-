import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsResponse {
  products: Product[];
}

// Retrieves all products with category information.
export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async () => {
    const products = await inventoryDB.queryAll<Product>`
      SELECT 
        p.id, p.sku, p.name, p.description, 
        p.category_id as "categoryId", c.name as "categoryName",
        p.unit_price as "unitPrice", p.cost_price as "costPrice",
        p.stock_quantity as "stockQuantity", p.min_stock_level as "minStockLevel",
        p.max_stock_level as "maxStockLevel", p.unit, p.is_active as "isActive",
        p.created_at as "createdAt", p.updated_at as "updatedAt"
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ORDER BY p.name
    `;
    return { products };
  }
);
