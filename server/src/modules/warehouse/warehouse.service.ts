import { db } from "../../db/index";
import { warehouses } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class WarehouseService {
  // 创建自定义仓库
  static async createWarehouse(data: any) {
    const [newWarehouse] = await db
      .insert(warehouses)
      .values({
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        type: data.type, // MAIN(大仓) / WIP(线边) / FG(成品)
      })
      .returning();
    return newWarehouse;
  }

  // 获取仓库全量列表
  static async getWarehouseList() {
    return await db
      .select()
      .from(warehouses)
      .orderBy(desc(warehouses.createdAt));
  }
}
