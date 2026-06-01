import { db } from "../../db/index";
import {
  products,
  inventory,
  purchaseOrders,
  productionOrders,
} from "../../db/schema";
import { sql, eq } from "drizzle-orm";

export class DashboardService {
  static async getOverview() {
    // 1. 统计总 SKU 数量
    const skuResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    // 2. 统计总库存和各类型库存分布
    const inventoryStats = await db
      .select({
        type: products.type,
        totalStock: sql<number>`sum(${inventory.stock})`,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .groupBy(products.type);

    let fertStock = 0,
      halbStock = 0,
      rohStock = 0;
    inventoryStats.forEach((stat) => {
      if (stat.type === "FERT") fertStock = Number(stat.totalStock);
      if (stat.type === "HALB") halbStock = Number(stat.totalStock);
      if (stat.type === "ROH") rohStock = Number(stat.totalStock);
    });

    // 3. 统计在途采购单 (PENDING)
    const poResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "PENDING"));

    // 4. 统计在制生产单 (PENDING)
    const prdOResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productionOrders)
      .where(eq(productionOrders.status, "PENDING"));

    return {
      totalSku: Number(skuResult[0].count),
      stockDistribution: {
        total: fertStock + halbStock + rohStock,
        fert: fertStock,
        halb: halbStock,
        roh: rohStock,
      },
      pendingPO: Number(poResult[0].count),
      pendingPrdO: Number(prdOResult[0].count),
    };
  }
}
