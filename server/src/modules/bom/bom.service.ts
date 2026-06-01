import { db } from "../../db/index";
import { bomHeaders, bomItems, products } from "../../db/schema";
import { sql, eq, and } from "drizzle-orm";

export class BomService {
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

  static async getSingleLevelBom(parentId: string) {
    let [header] = await db
      .select()
      .from(bomHeaders)
      .where(
        and(eq(bomHeaders.productId, parentId), eq(bomHeaders.status, "DRAFT")),
      );

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

    if (!header) return [];

    return await db
      .select({
        id: bomItems.id,
        childId: bomItems.childId,
        quantity: bomItems.quantity,
        childSku: products.sku,
        childName: products.name,
        childType: products.type,
        childLeadTime: products.leadTime,
        childSafetyStock: products.safetyStock,
      })
      .from(bomItems)
      .innerJoin(products, eq(bomItems.childId, products.id))
      .where(eq(bomItems.bomHeaderId, header.id));
  }

  static async removeBomItem(id: string) {
    return await db.delete(bomItems).where(eq(bomItems.id, id)).returning();
  }

  static async publishBom(productId: string) {
    return await db.transaction(async (tx) => {
      await tx
        .update(bomHeaders)
        .set({ status: "ARCHIVED" })
        .where(
          and(
            eq(bomHeaders.productId, productId),
            eq(bomHeaders.status, "ACTIVE"),
          ),
        );

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
