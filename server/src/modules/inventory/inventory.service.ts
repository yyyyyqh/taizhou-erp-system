import { db } from "../../db/index";
import {
  inventory,
  inventoryLedger,
  warehouses,
  products,
} from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export class InventoryService {
  // 1. 自动保障机制：获取仓库，没有则自动初始化三大基础物理仓
  static async getWarehouseByCode(code: string) {
    let [wh] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.code, code));
    if (!wh) {
      const defaults = [
        { code: "W-MAIN", name: "原材料大仓", type: "MAIN" },
        { code: "W-WIP", name: "车间线边仓", type: "WIP" },
        { code: "W-FG", name: "成品发货仓", type: "FG" },
      ];
      for (const d of defaults) {
        const [exists] = await db
          .select()
          .from(warehouses)
          .where(eq(warehouses.code, d.code));
        if (!exists) await db.insert(warehouses).values(d);
      }
      [wh] = await db
        .select()
        .from(warehouses)
        .where(eq(warehouses.code, code));
    }
    return wh;
  }

  // 2. 核心台账记录 (强制要求传入 warehouseId)
  static async recordStockMovement(
    productId: string,
    warehouseId: string,
    type: "IN" | "OUT",
    quantity: number,
    referenceNo?: string,
  ) {
    return await db.transaction(async (tx) => {
      // 查找该物料在【特定仓库】的现有库存
      let [invRecord] = await tx
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, productId),
            eq(inventory.warehouseId, warehouseId),
          ),
        );

      let currentStock = invRecord ? invRecord.stock : 0;
      let newStock =
        type === "IN" ? currentStock + quantity : currentStock - quantity;

      if (newStock < 0)
        throw new Error("该仓库对应物料库存不足，无法执行扣减！");

      // 更新或插入库存
      if (invRecord) {
        await tx
          .update(inventory)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(inventory.id, invRecord.id));
      } else {
        await tx
          .insert(inventory)
          .values({ productId, warehouseId, stock: newStock });
      }

      // 记录带有物理仓库维度的流水
      await tx.insert(inventoryLedger).values({
        productId,
        warehouseId,
        type,
        quantity,
        balance: newStock,
        referenceNo: referenceNo || "SYSTEM",
      });
    });
  }

  // 3. 获取库存列表 (联表查询，带出仓库名称)
  static async getInventoryList() {
    return await db
      .select({
        id: inventory.id,
        productId: products.id,
        sku: products.sku,
        name: products.name,
        type: products.type,
        warehouseName: warehouses.name,
        stock: inventory.stock,
        updatedAt: inventory.updatedAt,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
      .orderBy(desc(inventory.updatedAt));
  }

  // 4. 库存调拨 (从一个仓转移到另一个仓)
  static async transferStock(
    productId: string,
    fromWhCode: string,
    toWhCode: string,
    quantity: number,
  ) {
    return await db.transaction(async (tx) => {
      const fromWh = await this.getWarehouseByCode(fromWhCode);
      const toWh = await this.getWarehouseByCode(toWhCode);

      // 第一步：从源仓库扣减 (OUT)
      await this.recordStockMovement(
        productId,
        fromWh.id,
        "OUT",
        quantity,
        `TF-${new Date().getTime().toString().slice(-6)}`, // 生成一个简易调拨单号
      );

      // 第二步：向目标仓库增加 (IN)
      await this.recordStockMovement(
        productId,
        toWh.id,
        "IN",
        quantity,
        `TF-${new Date().getTime().toString().slice(-6)}`,
      );

      return true;
    });
  }

  static async getLedger(productId: string) {
    return await db
      .select({
        id: inventoryLedger.id,
        productId: inventoryLedger.productId,
        warehouseName: warehouses.name,
        type: inventoryLedger.type,
        quantity: inventoryLedger.quantity,
        balance: inventoryLedger.balance,
        referenceNo: inventoryLedger.referenceNo,
        createdAt: inventoryLedger.createdAt,
      })
      .from(inventoryLedger)
      .innerJoin(warehouses, eq(inventoryLedger.warehouseId, warehouses.id))
      .where(eq(inventoryLedger.productId, productId))
      .orderBy(desc(inventoryLedger.createdAt));
  }
}
