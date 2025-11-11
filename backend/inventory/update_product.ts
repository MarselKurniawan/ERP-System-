import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";

export interface UpdateProductRequest {
  id: number;
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: number;
  unitPrice?: number;
  costPrice?: number;
  revenueAccountId?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unit?: string;
  isActive?: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  unitPrice: number;
  costPrice: number;
  revenueAccountId?: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Updates a product.
export const updateProduct = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/products/:id" },
  async (req) => {
    const product = await inventoryDB.queryRow<Product>`
      UPDATE products 
      SET 
        sku = COALESCE(${req.sku}, sku),
        name = COALESCE(${req.name}, name),
        description = COALESCE(${req.description}, description),
        category_id = COALESCE(${req.categoryId}, category_id),
        unit_price = COALESCE(${req.unitPrice}, unit_price),
        cost_price = COALESCE(${req.costPrice}, cost_price),
        revenue_account_id = COALESCE(${req.revenueAccountId}, revenue_account_id),
        min_stock_level = COALESCE(${req.minStockLevel}, min_stock_level),
        max_stock_level = COALESCE(${req.maxStockLevel}, max_stock_level),
        unit = COALESCE(${req.unit}, unit),
        is_active = COALESCE(${req.isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, sku, name, description, category_id as "categoryId", unit_price as "unitPrice", cost_price as "costPrice", revenue_account_id as "revenueAccountId", stock_quantity as "stockQuantity", min_stock_level as "minStockLevel", max_stock_level as "maxStockLevel", unit, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!product) {
      throw APIError.notFound("Product not found");
    }
    
    return product;
  }
);
