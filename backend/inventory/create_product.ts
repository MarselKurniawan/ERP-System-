import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  productType: "stockable" | "service";
  unitPrice: number;
  costPrice: number;
  revenueAccountId?: number;
  cogsAccountId?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unit?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  productType: "stockable" | "service";
  unitPrice: number;
  costPrice: number;
  revenueAccountId?: number;
  cogsAccountId?: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new product.
export const createProduct = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (req) => {
    const product = await inventoryDB.queryRow<Product>`
      INSERT INTO products (sku, name, description, category_id, product_type, unit_price, cost_price, revenue_account_id, cogs_account_id, stock_quantity, min_stock_level, max_stock_level, unit)
      VALUES (${req.sku}, ${req.name}, ${req.description || null}, ${req.categoryId || null}, ${req.productType}, ${req.unitPrice}, ${req.costPrice}, ${req.revenueAccountId || null}, ${req.cogsAccountId || null}, ${req.stockQuantity || 0}, ${req.minStockLevel || 0}, ${req.maxStockLevel || null}, ${req.unit || 'pcs'})
      RETURNING id, sku, name, description, category_id as "categoryId", product_type as "productType", unit_price as "unitPrice", cost_price as "costPrice", revenue_account_id as "revenueAccountId", cogs_account_id as "cogsAccountId", stock_quantity as "stockQuantity", min_stock_level as "minStockLevel", max_stock_level as "maxStockLevel", unit, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (req.stockQuantity && req.stockQuantity > 0) {
      await inventoryDB.exec`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes)
        VALUES (${product!.id}, 'in', ${req.stockQuantity}, 'initial_stock', 'Initial stock entry')
      `;
    }

    return product!;
  }
);
