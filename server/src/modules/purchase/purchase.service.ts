import { db } from "../../db/index";
import {
  purchaseOrders,
  purchaseOrderItems,
  products,
  suppliers,
  warehouses,
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

  // 3. 核心流转：采购单收货入库（彻底干掉 W-MAIN 硬编码）
  static async receivePO(poId: string) {
    return await db.transaction(async (tx) => {
      // 1. 获取当前采购单主表信息
      const [po] = await tx
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, poId));

      if (!po || po.status === "COMPLETED")
        throw new Error("单据不存在或已收货");

      // 2. 获取单据明细行
      const items = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, poId));

      // 3. 💡 动态获取系统中配置的业务属性为原材料大仓（MAIN）的物理仓记录
      const [mainWh] = await tx
        .select()
        .from(warehouses)
        .where(eq(warehouses.type, "MAIN"))
        .limit(1);

      if (!mainWh) {
        throw new Error(
          "收货失败：未检测到系统中配置了业务类型为 [原材料大仓(MAIN)] 的物理仓库主数据，请先去仓库配置页面建立该仓库！",
        );
      }

      // 4. 遍历明细，逐行记入动态获取的大仓库存
      for (const item of items) {
        await InventoryService.recordStockMovement(
          item.productId,
          mainWh.id, // 👈 动态绑定的物理仓 ID，不管它的 Code 怎么变都能稳稳命中
          "IN",
          item.quantity,
          po.poNumber,
        );
      }

      // 5. 更新采购单状态为已完成
      const [updatedPO] = await tx
        .update(purchaseOrders)
        .set({ status: "COMPLETED", updatedAt: new Date() })
        .where(eq(purchaseOrders.id, poId))
        .returning();

      return updatedPO;
    });
  }
}
