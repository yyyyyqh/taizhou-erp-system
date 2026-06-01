import { db } from "../../db/index";
import { bomHeaders, bomItems, products } from "../../db/schema";
import { sql, eq, and } from "drizzle-orm";

export class BomService {
  // --- 内部机制：自动获取或创建草稿表头 ---
  private static async getOrCreateDraftHeader(productId: string) {
    const [existing] = await db
      .select()
      .from(bomHeaders)
      .where(
        and(
          eq(bomHeaders.productId, productId),
          eq(bomHeaders.status, "DRAFT"),
        ),
      );
    if (existing) return existing.id;

    // 如果没有草稿，新建一个 V1.0 的草稿
    const [newHeader] = await db
      .insert(bomHeaders)
      .values({
        productId,
        version: "V1.0",
        status: "DRAFT",
      })
      .returning();
    return newHeader.id;
  }

  // 1. 添加子件 (永远挂载到 DRAFT 草稿上)
  static async addBomItem(parentId: string, childId: string, quantity: number) {
    const headerId = await this.getOrCreateDraftHeader(parentId);
    const [newItem] = await db
      .insert(bomItems)
      .values({
        bomHeaderId: headerId,
        childId,
        quantity: quantity.toString(),
      })
      .returning();
    return newItem;
  }

  // 2. 获取多层 BOM 树 (核心：只查 ACTIVE 生效版本，供 MRP 运算使用)
  static async getBomTree(parentId: string) {
    const query = sql`
      WITH RECURSIVE bom_tree AS (
        SELECT
          b.id as bom_id,
          h.product_id as parent_id,
          b.child_id,
          b.quantity::numeric as unit_quantity,
          b.quantity::numeric as total_quantity,
          1 as level,
          p.sku, p.name, p.type, p.lead_time, p.safety_stock
        FROM bom_headers h
        JOIN bom_items b ON h.id = b.bom_header_id
        JOIN products p ON p.id = b.child_id
        WHERE h.product_id = ${parentId} AND h.status = 'ACTIVE'

        UNION ALL

        SELECT
          b.id as bom_id,
          h.product_id as parent_id,
          b.child_id,
          b.quantity::numeric as unit_quantity,
          (b.quantity::numeric * t.total_quantity)::numeric as total_quantity,
          t.level + 1 as level,
          p.sku, p.name, p.type, p.lead_time, p.safety_stock
        FROM bom_headers h
        JOIN bom_items b ON h.id = b.bom_header_id
        JOIN bom_tree t ON t.child_id = h.product_id
        JOIN products p ON p.id = b.child_id
        WHERE h.status = 'ACTIVE'
      )
      SELECT * FROM bom_tree ORDER BY level, sku;
    `;
    const result = await db.execute(query);
    return result.rows;
  }

  // 3. 获取单层直接子件 (用于前端维护界面：优先查 DRAFT，没有再查 ACTIVE)
  static async getSingleLevelBom(parentId: string) {
    // 优先找草稿版本
    let [header] = await db
      .select()
      .from(bomHeaders)
      .where(
        and(eq(bomHeaders.productId, parentId), eq(bomHeaders.status, "DRAFT")),
      );

    // 没草稿就找已生效的版本
    if (!header) {
      [header] = await db
        .select()
        .from(bomHeaders)
        .where(
          and(
            eq(bomHeaders.productId, parentId),
            eq(bomHeaders.status, "ACTIVE"),
          ),
        );
    }

    if (!header) return []; // 都没有说明这还是个空产品

    return await db
      .select({
        id: bomItems.id,
        childId: bomItems.childId,
        quantity: bomItems.quantity,
        sku: products.sku,
        name: products.name,
        type: products.type,
      })
      .from(bomItems)
      .innerJoin(products, eq(bomItems.childId, products.id))
      .where(eq(bomItems.bomHeaderId, header.id));
  }

  // 4. 移除某个子件
  static async removeBomItem(id: string) {
    return await db.delete(bomItems).where(eq(bomItems.id, id)).returning();
  }

  // 5. 新增：发布并生效 BOM
  static async publishBom(productId: string) {
    return await db.transaction(async (tx) => {
      // 第一步：把旧的已生效版本全部标记为 ARCHIVED(废弃)
      await tx
        .update(bomHeaders)
        .set({ status: "ARCHIVED" })
        .where(
          and(
            eq(bomHeaders.productId, productId),
            eq(bomHeaders.status, "ACTIVE"),
          ),
        );

      // 第二步：把当前的 DRAFT 草稿激活为 ACTIVE
      const [published] = await tx
        .update(bomHeaders)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(
          and(
            eq(bomHeaders.productId, productId),
            eq(bomHeaders.status, "DRAFT"),
          ),
        )
        .returning();

      return published;
    });
  }
}
