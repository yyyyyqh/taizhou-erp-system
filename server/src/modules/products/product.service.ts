import { db } from "../../db/index";
import { products, inventory } from "../../db/schema";
import { eq, desc, sql } from "drizzle-orm";

export class ProductService {
  // 1. 新建单个物料（剥离了错误的初始库存绑定逻辑）
  static async createProduct(data: any) {
    const [newProduct] = await db
      .insert(products)
      .values({
        sku: data.sku,
        name: data.name,
        type: data.type || "FERT",
        price: data.price?.toString() || "0",
        leadTime: data.leadTime || 0,
        safetyStock: data.safetyStock || 0,
        attributes: data.attributes || {},
      })
      .returning();

    return { product: newProduct };
  }

  // 2. 获取物料列表（智能聚合：把该物料在所有仓库的库存加起来展示）
  static async getProductList() {
    return await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        type: products.type,
        price: products.price,
        leadTime: products.leadTime,
        safetyStock: products.safetyStock,
        attributes: products.attributes,
        createdAt: products.createdAt,
        // 使用 SQL 聚合函数，汇总该物料在所有物理仓的总库存，没有则为 0
        stock: sql<number>`COALESCE(SUM(${inventory.stock}), 0)`.mapWith(
          Number,
        ),
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .groupBy(products.id) // 必须 Group By，否则多仓库会导致同一商品出现重复行
      .orderBy(desc(products.createdAt));
  }

  // 3. 批量导入物料（修复点：彻底移除强制写死库存的逻辑）
  static async bulkImport(items: any[]) {
    return await db
      .insert(products)
      .values(
        items.map((item) => ({
          sku: item.sku,
          name: item.name,
          type: item.type || "FERT",
          price: item.price?.toString() || "0",
          leadTime: item.leadTime || 0,
          safetyStock: item.safetyStock || 0,
        })),
      )
      .returning();
  }

  // 4. 修改物料信息 (保持不变)
  static async updateProduct(id: string, data: any) {
    const [updatedProduct] = await db
      .update(products)
      .set({
        sku: data.sku,
        name: data.name,
        type: data.type,
        price: data.price?.toString(),
        leadTime: data.leadTime,
        safetyStock: data.safetyStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }
}
