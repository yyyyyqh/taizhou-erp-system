import { db } from "../../db/index";
import { purchaseOrders, purchaseOrderItems, products } from "../../db/schema";
import { InventoryService } from "../inventory/inventory.service";
import { eq, desc } from "drizzle-orm";

export class PurchaseService {
  // 1. 创建采购单
  static async createPO(data: any) {
    return await db.transaction(async (tx) => {
      // 生成类似 PO-20260601-XXXX 的单号
      const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

      const [newPO] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber,
          supplier: data.supplier || "默认供应商",
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        })
        .returning();

      // 批量插入采购明细行
      if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map((item: any) => ({
          poId: newPO.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice?.toString() || "0",
        }));
        await tx.insert(purchaseOrderItems).values(itemsToInsert);
      }

      return newPO;
    });
  }

  // 2. 获取采购单列表（带明细）
  static async getPOList() {
    const pos = await db
      .select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.createdAt));
    // 简单起见，循环附加明细（企业级应用通常用关联查询优化）
    const result = [];
    for (const po of pos) {
      const items = await db
        .select({
          id: purchaseOrderItems.id,
          quantity: purchaseOrderItems.quantity,
          unitPrice: purchaseOrderItems.unitPrice,
          sku: products.sku,
          name: products.name,
        })
        .from(purchaseOrderItems)
        .innerJoin(products, eq(purchaseOrderItems.productId, products.id))
        .where(eq(purchaseOrderItems.poId, po.id));

      result.push({ ...po, items });
    }
    return result;
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
