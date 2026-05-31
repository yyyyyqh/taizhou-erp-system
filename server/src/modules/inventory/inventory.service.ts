import { db } from "../../db/index";
import { inventory, inventoryLedger } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class InventoryService {
  static async recordStockMovement(
    productId: string,
    type: "IN" | "OUT",
    quantity: number,
    referenceId: string,
  ) {
    return await db.transaction(async (tx) => {
      const [currentStock] = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.productId, productId));

      if (!currentStock) {
        throw new Error("未找到对应商品的库存记录");
      }

      let newBalance = currentStock.stock;
      if (type === "IN") {
        newBalance += quantity;
      } else if (type === "OUT") {
        if (currentStock.stock < quantity) {
          throw new Error("库存不足，无法出库");
        }
        newBalance -= quantity;
      }

      const [updatedInventory] = await tx
        .update(inventory)
        .set({ stock: newBalance })
        .where(eq(inventory.productId, productId))
        .returning();

      const [ledger] = await tx
        .insert(inventoryLedger)
        .values({
          productId,
          type,
          quantity,
          balance: newBalance,
          referenceId,
        })
        .returning();

      return { inventory: updatedInventory, ledger };
    });
  }

  static async getLedger(productId: string) {
    return await db
      .select()
      .from(inventoryLedger)
      .where(eq(inventoryLedger.productId, productId))
      .orderBy(desc(inventoryLedger.createdAt));
  }
}
