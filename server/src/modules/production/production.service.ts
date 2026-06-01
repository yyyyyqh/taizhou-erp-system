import { db } from "../../db/index";
import { productionOrders, products } from "../../db/schema";
import { InventoryService } from "../inventory/inventory.service";
import { BomService } from "../bom/bom.service";
import { eq, desc } from "drizzle-orm";

export class ProductionService {
  static async createOrder(data: any) {
    const orderNumber = `PRD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

    const [newOrder] = await db
      .insert(productionOrders)
      .values({
        orderNumber,
        productId: data.productId,
        quantity: data.quantity,
        startDate: data.startDate ? new Date(data.startDate) : null,
      })
      .returning();

    return newOrder;
  }

  static async getOrderList() {
    return await db
      .select({
        id: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        quantity: productionOrders.quantity,
        status: productionOrders.status,
        startDate: productionOrders.startDate,
        createdAt: productionOrders.createdAt,
        productId: products.id,
        sku: products.sku,
        name: products.name,
        type: products.type,
      })
      .from(productionOrders)
      .innerJoin(products, eq(productionOrders.productId, products.id))
      .orderBy(desc(productionOrders.createdAt));
  }

  // 核心业务：完工汇报 (Backflush 入库与扣减)
  static async completeOrder(orderId: string) {
    return await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(productionOrders)
        .where(eq(productionOrders.id, orderId));
      if (!order || order.status === "COMPLETED")
        throw new Error("工单不存在或已完工");

      // 1. 获取目标产成品的单层 BOM 结构
      const bomItems: any = await BomService.getSingleLevelBom(order.productId);

      // 2. 遍历 BOM，按比例扣减子件库存 (OUT)
      for (const item of bomItems) {
        const consumeQty = Number(item.quantity) * order.quantity;
        await InventoryService.recordStockMovement(
          item.childId,
          "OUT",
          consumeQty,
          order.orderNumber, // 关联单号为生产工单号
        );
      }

      // 3. 增加产成品的库存 (IN)
      await InventoryService.recordStockMovement(
        order.productId,
        "IN",
        order.quantity,
        order.orderNumber,
      );

      // 4. 更新工单状态
      const [updatedOrder] = await tx
        .update(productionOrders)
        .set({ status: "COMPLETED", updatedAt: new Date() })
        .where(eq(productionOrders.id, orderId))
        .returning();

      return updatedOrder;
    });
  }
}
