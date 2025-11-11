import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

// Seeds the database with sample inventory data.
export const seedInventory = api<void, { message: string }>(
  { expose: true, method: "POST", path: "/inventory/seed" },
  async () => {
    // Create categories first
    const categories = [
      { name: "Electronics", description: "Electronic devices and components" },
      { name: "Office Supplies", description: "General office supplies and stationery" },
      { name: "Furniture", description: "Office and home furniture" },
      { name: "Software", description: "Software licenses and applications" },
      { name: "Hardware", description: "Computer hardware and accessories" }
    ];

    const categoryIds: Record<string, number> = {};

    for (const category of categories) {
      const existingCategory = await inventoryDB.queryRow<{ id: number }>`
        SELECT id FROM categories WHERE name = ${category.name}
      `;

      if (!existingCategory) {
        const newCategory = await inventoryDB.queryRow<{ id: number }>`
          INSERT INTO categories (name, description)
          VALUES (${category.name}, ${category.description})
          RETURNING id
        `;
        categoryIds[category.name] = newCategory!.id;
      } else {
        categoryIds[category.name] = existingCategory.id;
      }
    }

    // Create products
    const products = [
      {
        sku: "LAPTOP001",
        name: "Business Laptop",
        description: "High-performance laptop for business use",
        categoryName: "Electronics",
        unitPrice: 15000000,
        costPrice: 12000000,
        stockQuantity: 25,
        minStockLevel: 5,
        maxStockLevel: 50,
        unit: "pcs"
      },
      {
        sku: "MOUSE001",
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse",
        categoryName: "Hardware",
        unitPrice: 250000,
        costPrice: 180000,
        stockQuantity: 100,
        minStockLevel: 20,
        maxStockLevel: 200,
        unit: "pcs"
      },
      {
        sku: "CHAIR001",
        name: "Office Chair",
        description: "Ergonomic office chair with lumbar support",
        categoryName: "Furniture",
        unitPrice: 2500000,
        costPrice: 1800000,
        stockQuantity: 15,
        minStockLevel: 3,
        maxStockLevel: 30,
        unit: "pcs"
      },
      {
        sku: "PAPER001",
        name: "A4 Paper",
        description: "White A4 printing paper, 500 sheets",
        categoryName: "Office Supplies",
        unitPrice: 75000,
        costPrice: 55000,
        stockQuantity: 200,
        minStockLevel: 50,
        maxStockLevel: 500,
        unit: "ream"
      },
      {
        sku: "SOFT001",
        name: "Office Suite License",
        description: "Annual office software license",
        categoryName: "Software",
        unitPrice: 1500000,
        costPrice: 1200000,
        stockQuantity: 10,
        minStockLevel: 2,
        maxStockLevel: 25,
        unit: "license"
      },
      {
        sku: "MONITOR001",
        name: "24-inch Monitor",
        description: "Full HD 24-inch LED monitor",
        categoryName: "Electronics",
        unitPrice: 3500000,
        costPrice: 2800000,
        stockQuantity: 8,
        minStockLevel: 5,
        maxStockLevel: 20,
        unit: "pcs"
      },
      {
        sku: "DESK001",
        name: "Office Desk",
        description: "Wooden office desk with drawers",
        categoryName: "Furniture",
        unitPrice: 3000000,
        costPrice: 2200000,
        stockQuantity: 12,
        minStockLevel: 3,
        maxStockLevel: 25,
        unit: "pcs"
      },
      {
        sku: "PEN001",
        name: "Ballpoint Pen",
        description: "Blue ballpoint pen, pack of 12",
        categoryName: "Office Supplies",
        unitPrice: 25000,
        costPrice: 18000,
        stockQuantity: 150,
        minStockLevel: 30,
        maxStockLevel: 300,
        unit: "pack"
      }
    ];

    for (const product of products) {
      const existingProduct = await inventoryDB.queryRow`
        SELECT id FROM products WHERE sku = ${product.sku}
      `;

      if (!existingProduct) {
        const categoryId = categoryIds[product.categoryName];
        
        const newProduct = await inventoryDB.queryRow<{ id: number }>`
          INSERT INTO products (sku, name, description, category_id, unit_price, cost_price, revenue_account_id, stock_quantity, min_stock_level, max_stock_level, unit)
          VALUES (${product.sku}, ${product.name}, ${product.description}, ${categoryId}, ${product.unitPrice}, ${product.costPrice}, NULL, ${product.stockQuantity}, ${product.minStockLevel}, ${product.maxStockLevel}, ${product.unit})
          RETURNING id
        `;

        if (newProduct && product.stockQuantity > 0) {
          await inventoryDB.exec`
            INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes)
            VALUES (${newProduct.id}, 'in', ${product.stockQuantity}, 'initial_stock', 'Initial stock entry from seed data')
          `;
        }
      }
    }

    return { message: "Sample inventory data created successfully" };
  }
);
