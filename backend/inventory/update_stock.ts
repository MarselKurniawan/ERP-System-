import { api } from "encore.dev/api";
import { inventoryDB } from "./db";

export interface UpdateStockRequest {
  productId: number;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdAt: Date;
}

// Updates product stock and records the movement.
export const updateStock = api<UpdateStockRequest, StockMovement>(
  { expose: true, method: "POST", path: "/products/:productId/stock" },
  async (req) => {
    await inventoryDB.begin().then(async (tx) => {
      try {
        const quantityChange = req.movementType === 'out' ? -req.quantity : req.quantity;
        
        if (req.movementType === 'adjustment') {
          await tx.exec`
            UPDATE products 
            SET stock_quantity = ${req.quantity}, updated_at = NOW()
            WHERE id = ${req.productId}
          `;
        } else {
          await tx.exec`
            UPDATE products 
            SET stock_quantity = stock_quantity + ${quantityChange}, updated_at = NOW()
            WHERE id = ${req.productId}
          `;
        }

        const movement = await tx.queryRow<StockMovement>`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes)
          VALUES (${req.productId}, ${req.movementType}, ${req.quantity}, ${req.referenceType || null}, ${req.referenceId || null}, ${req.notes || null})
          RETURNING id, product_id as "productId", movement_type as "movementType", quantity, reference_type as "referenceType", reference_id as "referenceId", notes, created_at as "createdAt"
        `;

        await tx.commit();
        return movement!;
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    });

    return {} as StockMovement;
  }
);
