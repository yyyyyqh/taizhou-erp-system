import { db } from "../../db/index";
import { bomItems } from "../../db/schema";
import { sql } from "drizzle-orm";

export class BomService {
  static async addBomItem(parentId: string, childId: string, quantity: number) {
    const [newItem] = await db
      .insert(bomItems)
      .values({
        parentId,
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
          b.parent_id,
          b.child_id,
          b.quantity::numeric as unit_quantity,
          b.quantity::numeric as total_quantity,
          1 as level,
          p.sku,
          p.name,
          p.type,
          p.lead_time,
          p.safety_stock
        FROM bom_items b
        JOIN products p ON p.id = b.child_id
        WHERE b.parent_id = ${parentId}

        UNION ALL

        SELECT
          b.id as bom_id,
          b.parent_id,
          b.child_id,
          b.quantity::numeric as unit_quantity,
          (b.quantity::numeric * t.total_quantity)::numeric as total_quantity,
          t.level + 1 as level,
          p.sku,
          p.name,
          p.type,
          p.lead_time,
          p.safety_stock
        FROM bom_items b
        JOIN bom_tree t ON t.child_id = b.parent_id
        JOIN products p ON p.id = b.child_id
      )
      SELECT * FROM bom_tree ORDER BY level, sku;
    `;

    const result = await db.execute(query);
    return result.rows;
  }
}
