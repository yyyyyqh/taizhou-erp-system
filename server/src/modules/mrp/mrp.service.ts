import { db } from "../../db/index";
import {
  products,
  inventory,
  purchaseOrders,
  purchaseOrderItems,
} from "../../db/schema";
import { BomService } from "../bom/bom.service";
import { eq } from "drizzle-orm";

export class MrpService {
  static async calculateMRP(productId: string, targetQuantity: number) {
    const [targetProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    if (!targetProduct) throw new Error("目标物料不存在");

    const allInventory = await db.select().from(inventory);
    const stockMap = new Map<string, number>();
    for (const item of allInventory) {
      const current = stockMap.get(item.productId) || 0;
      stockMap.set(item.productId, current + Number(item.balance));
    }

    const openPoItems = await db
      .select({
        productId: purchaseOrderItems.productId,
        quantity: purchaseOrderItems.quantity,
      })
      .from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrderItems.poId, purchaseOrders.id))
      .where(eq(purchaseOrders.status, "DRAFT"));

    const onOrderMap = new Map<string, number>();
    for (const item of openPoItems) {
      const current = onOrderMap.get(item.productId) || 0;
      onOrderMap.set(item.productId, current + Number(item.quantity));
    }

    const bomComponents: any = await BomService.getSingleLevelBom(productId);
    const mrpResults = [];

    for (const item of bomComponents) {
      const grossRequirement = Number(item.quantity) * targetQuantity;
      const currentStock = stockMap.get(item.childId) || 0;
      const onOrderStock = onOrderMap.get(item.childId) || 0;

      let netRequirement =
        grossRequirement + item.childSafetyStock - currentStock - onOrderStock;
      if (netRequirement < 0) netRequirement = 0;

      const today = new Date();
      const suggestOrderDate = new Date();
      suggestOrderDate.setDate(today.getDate() - item.childLeadTime);

      const formattedDate =
        item.childLeadTime > 0
          ? suggestOrderDate.toISOString().slice(0, 10)
          : "-";

      mrpResults.push({
        productId: item.childId,
        sku: item.childSku,
        name: item.childName,
        type: item.childType,
        grossRequirement,
        currentStock,
        onOrderStock,
        safetyStock: item.childSafetyStock,
        netRequirement,
        leadTime: item.childLeadTime,
        suggestOrderDate: netRequirement > 0 ? formattedDate : "-",
        action:
          netRequirement > 0
            ? item.childType === "ROH"
              ? "建议发起采购"
              : "建议下达内制工单"
            : "库存充沛，无需动作",
      });
    }

    return {
      targetProduct: {
        sku: targetProduct.sku,
        name: targetProduct.name,
        quantity: targetQuantity,
      },
      planDate: new Date().toISOString().slice(0, 10),
      components: mrpResults,
    };
  }
}
