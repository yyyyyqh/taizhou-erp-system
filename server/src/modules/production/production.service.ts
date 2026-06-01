import { db } from "../../db/index";
// 💡 修复点 1：确保从 schema 中引入了 warehouses 表
import { productionOrders, products, warehouses } from "../../db/schema";
import { InventoryService } from "../inventory/inventory.service";
import { BomService } from "../bom/bom.service";
import { eq, desc } from "drizzle-orm";

export class ProductionService {
  // 1. 创建生产工单
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

  // 2. 获取工单列表
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

  // 3. 核心业务：完工汇报 (Backflush 动态多仓扣减与入库)
  static async completeOrder(orderId: string) {
    const [order] = await db
      .select()
      .from(productionOrders)
      .where(eq(productionOrders.id, orderId));

    if (!order || order.status === "COMPLETED")
      throw new Error("工单不存在或已完工");

    // 获取当前成品的单级 BOM 配方
    const bomItems: any = await BomService.getSingleLevelBom(order.productId);

    // 💡 修复点 2：彻底干掉 W-WIP 和 W-FG 硬编码，改由 type 业务属性动态锁定物理仓记录
    const [wipWh] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.type, "WIP"))
      .limit(1);

    const [fgWh] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.type, "FG"))
      .limit(1);

    if (!wipWh || !fgWh) {
      throw new Error(
        "完工流转失败：系统中必须同时配置有业务类型为 [车间线边仓(WIP)] 和 [成品发货仓(FG)] 的基础物理仓主数据！",
      );
    }

    // 1. 遍历 BOM，按比例扣减子件库存 (从动态获取的 WIP 线边仓扣除)
    for (const item of bomItems) {
      const consumeQty = Number(item.quantity) * order.quantity;
      await InventoryService.recordStockMovement(
        item.childId,
        wipWh.id, // 👈 动态绑定的线边仓实体 ID
        "OUT",
        consumeQty,
        order.orderNumber,
      );
    }

    // 2. 增加产成品的库存 (自动归档到动态获取的 FG 成品发货仓)
    await InventoryService.recordStockMovement(
      order.productId,
      fgWh.id, // 👈 动态绑定的成品仓实体 ID
      "IN",
      order.quantity,
      order.orderNumber,
    );

    // 3. 更新工单状态为已完成
    const [updatedOrder] = await db
      .update(productionOrders)
      .set({ status: "COMPLETED", updatedAt: new Date() })
      .where(eq(productionOrders.id, orderId))
      .returning();

    return updatedOrder;
  }
}
