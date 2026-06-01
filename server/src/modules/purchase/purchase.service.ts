import { db } from "../../db/index";
import {
  purchaseOrders,
  purchaseOrderItems,
  products,
  suppliers,
} from "../../db/schema";
import { InventoryService } from "../inventory/inventory.service";
import { eq, desc } from "drizzle-orm";

export class PurchaseService {
  // 1. 创建采购单
  static async createPO(data: any) {
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

    return await db.transaction(async (tx) => {
      const [newPO] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber,
          supplierId: data.supplierId, // 👈 核心改变：存储标准供应商实体 ID
          status: "DRAFT",
        })
        .returning();

      if (data.items && data.items.length > 0) {
        await tx.insert(purchaseOrderItems).values(
          data.items.map((item: any) => ({
            poId: newPO.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(),
          })),
        );
      }
      return newPO;
    });
  }

  // 2. 获取采购单列表
  static async getPOList() {
    return await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        createdAt: purchaseOrders.createdAt,
        supplierName: suppliers.name,
        supplierCode: suppliers.code,
      })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.createdAt));
  }

  // 3. 核心流转：采购单收货入库
  static async receivePO(poId: string) {
    return await db.transaction(async (tx) => {
      const [po] = await tx
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, poId));
      if (!po || po.status === "COMPLETED")
        throw new Error("单据不存在或已收货");

      const items = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, poId));

      // 动态获取大仓 ID
      const mainWh = await InventoryService.getWarehouseByCode("W-MAIN");

      for (const item of items) {
        await InventoryService.recordStockMovement(
          item.productId,
          mainWh.id,
          "IN",
          item.quantity,
          po.poNumber,
        );
      }

      const [updatedPO] = await tx
        .update(purchaseOrders)
        .set({ status: "COMPLETED", updatedAt: new Date() })
        .where(eq(purchaseOrders.id, poId))
        .returning();

      return updatedPO;
    });
  }
}
