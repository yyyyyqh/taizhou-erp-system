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
    // 💡 修复点：移除了外层的 db.transaction，防止与 InventoryService 内部事务冲突死锁
    const [order] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, orderId));

    if (!order || order.status === "COMPLETED")
      throw new Error("工单不存在或已完工");

    const bomItems: any = await BomService.getSingleLevelBom(order.productId);

    // 动态获取线边仓和成品仓的 ID
    const wipWh = await InventoryService.getWarehouseByCode("W-WIP");
    const fgWh = await InventoryService.getWarehouseByCode("W-FG");

    // 1. 遍历 BOM，按比例扣减子件库存 (从 WIP 线边仓扣减！)
    for (const item of bomItems) {
      const consumeQty = Number(item.quantity) * order.quantity;
      await InventoryService.recordStockMovement(
        item.childId,
        wipWh.id, // 👈 强制从线边仓扣料
        "OUT",
        consumeQty,
        order.orderNumber,
      );
    }

    // 2. 增加产成品的库存 (增加到 FG 成品仓！)
    await InventoryService.recordStockMovement(
      order.productId,
      fgWh.id, // 👈 强制成品入发货仓
      "IN",
      order.quantity,
      order.orderNumber,
    );

    // 3. 更新工单状态
    const [updatedOrder] = await db
      .update(productionOrders)
      .set({ status: "COMPLETED", updatedAt: new Date() })
      .where(eq(productionOrders.id, orderId))
      .returning();

    return updatedOrder;
  }
}
