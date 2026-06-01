import { db } from "../../db/index";
import {
  products,
  inventory,
  purchaseOrders,
  purchaseOrderItems,
  suppliers,
  productionOrders,
} from "../../db/schema";
import { BomService } from "../bom/bom.service";
import { eq, and } from "drizzle-orm";

export class MrpService {
  static async autoCreateDocument(
    productId: string,
    quantity: number,
    type?: string,
  ) {
    let materialType = type;
    let targetProduct: any = null;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) throw new Error("目标物料不存在");
    materialType = materialType || product.type;
    targetProduct = product;

    return await db.transaction(async (tx) => {
      if (materialType === "ROH") {
        const [supplier] = await tx.select().from(suppliers).limit(1);
        const supplierId = supplier ? supplier.id : null;
        if (!supplierId) throw new Error("自动转单失败：系统中无可用供应商");

        const [po] = await tx
          .insert(purchaseOrders)
          .values({
            poNumber: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            supplierId: supplierId,
            status: "DRAFT",
          })
          .returning();

        await tx.insert(purchaseOrderItems).values({
          poId: po.id,
          productId: productId,
          quantity: quantity,
          price: targetProduct.price ? targetProduct.price.toString() : "0.00",
        });

        return po;
      } else {
        const orderNumber = `WO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return await tx
          .insert(productionOrders)
          .values({
            orderNumber,
            productId,
            quantity: quantity,
            status: "DRAFT",
          })
          .returning();
      }
    });
  }

  static async calculateMRP(productId: string, targetQuantity: number) {
    const [targetProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    if (!targetProduct) throw new Error("目标物料不存在");

    // 1. 精准聚合当前实际库存 (对齐 schema.ts 中的 stock 字段)
    const allInventory = await db.select().from(inventory);
    const stockMap = new Map<string, number>();
    for (const item of allInventory) {
      const current = stockMap.get(item.productId) || 0;
      stockMap.set(item.productId, current + Number(item.stock || 0));
    }

    // 2. 精准聚合在途库存：必须是 DRAFT 状态且明细中包含该物料
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
      if (item.productId) {
        const current = onOrderMap.get(item.productId) || 0;
        onOrderMap.set(item.productId, current + Number(item.quantity || 0));
      }
    }

    const bomComponents: any = await BomService.getSingleLevelBom(productId);
    const mrpResults = [];

    for (const item of bomComponents) {
      // 3. 强类型转换，杜绝隐式字符串拼接
      const bomQty = Number(item.quantity || 1);
      const grossRequirement = bomQty * targetQuantity; // 毛需求 = 单用量 * 目标产出数量
      const currentStock = Number(stockMap.get(item.childId) || 0);
      const onOrderStock = Number(onOrderMap.get(item.childId) || 0);
      const safetyStock = Number(item.childSafetyStock || 0);

      // 4. 标准 ERP 净需求运算核心公式
      // 净缺口 = (毛需求 + 安全库存) - (现有库存 + 在途采购)
      let netRequirement =
        grossRequirement + safetyStock - (currentStock + onOrderStock);
      if (netRequirement < 0) netRequirement = 0;

      // 5. 建议交期计算
      const today = new Date();
      const suggestOrderDate = new Date();
      const leadTime = Number(item.childLeadTime || 0);
      suggestOrderDate.setDate(today.getDate() - leadTime);

      const formattedDate =
        leadTime > 0 ? suggestOrderDate.toISOString().slice(0, 10) : "-";

      // 6. 打印核心推演日志，方便在控制台肉眼排错
      console.log(
        `[MRP推演] 物料:${item.childSku} | 毛需求:${grossRequirement} | 安全库存:${safetyStock} | 现有库存:${currentStock} | 在途:${onOrderStock} => 净缺口:${netRequirement}`,
      );

      mrpResults.push({
        productId: item.childId,
        sku: item.childSku,
        name: item.childName,
        type: item.childType,
        grossRequirement,
        currentStock,
        onOrderStock,
        safetyStock,
        netRequirement,
        leadTime,
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
