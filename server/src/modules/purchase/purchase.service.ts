import { db } from "../../db/index";
import {
  purchaseOrders,
  purchaseOrderItems,
  suppliers,
  warehouses,
  products,
} from "../../db/schema";
import { InventoryService } from "../inventory/inventory.service";
import { eq, desc } from "drizzle-orm";

export class PurchaseService {
  static async createPO(data: any) {
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

    return await db.transaction(async (tx) => {
      let supplierId = data.supplierId;
      if (!supplierId || supplierId === "SYSTEM_DEFAULT") {
        const [firstSupplier] = await tx.select().from(suppliers).limit(1);
        supplierId = firstSupplier ? firstSupplier.id : null;
      }

      if (!supplierId) {
        throw new Error("创建失败：系统内缺少供应商主数据，请先创建供应商");
      }

      const [newPO] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber,
          supplierId: supplierId,
          status: "DRAFT",
        })
        .returning();

      if (data.items && data.items.length > 0) {
        await tx.insert(purchaseOrderItems).values(
          data.items.map((item: any) => ({
            poId: newPO.id,
            productId: item.productId,
            quantity: item.quantity,
            price:
              item.price !== undefined && item.price !== null
                ? item.price.toString()
                : "0.00",
          })),
        );
      }
      return newPO;
    });
  }

  static async getPOList() {
    // 1. 先查出所有的采购订单主表及供应商信息
    const pos = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        createdAt: purchaseOrders.createdAt,
        supplierName: suppliers.name,
        supplierCode: suppliers.code,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.createdAt));

    if (pos.length === 0) return [];

    // 2. 联查采购明细表与物料主数据表，补全 SKU 和物料名称
    const allItems = await db
      .select({
        id: purchaseOrderItems.id,
        poId: purchaseOrderItems.poId,
        productId: purchaseOrderItems.productId,
        quantity: purchaseOrderItems.quantity,
        price: purchaseOrderItems.price,
        sku: products.sku,
        name: products.name,
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id));

    // 3. 将明细行分配组装到对应的采购单对象的 items 属性中
    return pos.map((po) => ({
      ...po,
      items: allItems.filter((item) => item.poId === po.id),
    }));
  }

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

      const [mainWh] = await tx
        .select()
        .from(warehouses)
        .where(eq(warehouses.type, "MAIN"))
        .limit(1);

      if (!mainWh) {
        throw new Error(
          "收货失败：未检测到系统中配置了业务类型为 [MAIN] 的物理仓库",
        );
      }

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
