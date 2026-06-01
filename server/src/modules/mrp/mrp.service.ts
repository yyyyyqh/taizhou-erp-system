import { BomService } from "../bom/bom.service";
import { db } from "../../db/index";
import { inventory, products } from "../../db/schema";
import { eq } from "drizzle-orm";

interface MrpInput {
  productId: string;
  quantity: number;
  dueDate: Date; // 期望交付日期
}

interface MrpResultItem {
  productId: string;
  sku: string;
  name: string;
  type: string;
  level: number;
  grossRequirement: number;
  currentStock: number;
  safetyStock: number;
  netRequirement: number;
  leadTime: number;
  suggestedReleaseDate: Date; // 建议下单/开工时间
}

export class MrpService {
  static async calculateMrp(input: MrpInput): Promise<MrpResultItem[]> {
    // 1. 获取目标成品的物料主数据
    const [targetProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId));

    if (!targetProduct) throw new Error("未找到目标物料");

    // 2. 获取目标成品的当前库存
    const [targetInv] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, input.productId));
    const targetStock = targetInv?.stock || 0;

    // 3. 计算成品的净需求
    const targetNet = Math.max(
      0,
      input.quantity + targetProduct.safetyStock - targetStock,
    );

    // 计算成品的建议开工时间 = 交付时间 - 提前期
    const targetReleaseDate = new Date(input.dueDate);
    targetReleaseDate.setDate(
      targetReleaseDate.getDate() - targetProduct.leadTime,
    );

    const mrpList: MrpResultItem[] = [
      {
        productId: targetProduct.id,
        sku: targetProduct.sku,
        name: targetProduct.name,
        type: targetProduct.type,
        level: 0,
        grossRequirement: input.quantity,
        currentStock: targetStock,
        safetyStock: targetProduct.safetyStock,
        netRequirement: targetNet,
        leadTime: targetProduct.leadTime,
        suggestedReleaseDate: targetReleaseDate,
      },
    ];

    // 4. 如果成品存在净需求，则需要递归展开 BOM 计算子件
    if (targetNet > 0) {
      // 利用我们之前写好的 PostgreSQL 递归 CTE 获取全层级 BOM 树
      const bomTree: any = await BomService.getBomTree(input.productId);

      // 建立一个父级净需求与交付日期的快速映射，方便子项推导
      const parentMap = new Map<
        string,
        { netRequirement: number; dueDate: Date }
      >();
      parentMap.set(targetProduct.id, {
        netRequirement: targetNet,
        dueDate: targetReleaseDate,
      });

      // 按层级从小到大深度遍历（BOM 树已按 level 排序）
      for (const node of bomTree) {
        // 4.1 获取当前子项的实时库存
        const [invItem] = await db
          .select()
          .from(inventory)
          .where(eq(inventory.productId, node.child_id));
        const currentStock = invItem?.stock || 0;

        // 4.2 找到直接父级的计划数据
        const parentPlan = parentMap.get(node.parent_id);
        const parentNet = parentPlan ? parentPlan.netRequirement : 0;
        const parentReleaseDate = parentPlan
          ? parentPlan.dueDate
          : input.dueDate;

        // 4.3 核心 MRP 逻辑计算
        // 毛需求 = 父级净需求 * 单件用量
        const grossRequirement = parentNet * parseFloat(node.unit_quantity);
        // 净需求 = 毛需求 + 安全库存 - 当前库存
        const netRequirement = Math.max(
          0,
          grossRequirement + node.safety_stock - currentStock,
        );

        // 建议下单时间 = 父级开工时间 - 子项自身的提前期
        const suggestedReleaseDate = new Date(parentReleaseDate);
        suggestedReleaseDate.setDate(
          suggestedReleaseDate.getDate() - node.lead_time,
        );

        // 缓存当前项的计算结果，供它的下级子件（若有）计算使用
        parentMap.set(node.child_id, {
          netRequirement,
          dueDate: suggestedReleaseDate,
        });

        mrpList.push({
          productId: node.child_id,
          sku: node.sku,
          name: node.name,
          type: node.type,
          level: node.level,
          grossRequirement,
          currentStock,
          safetyStock: node.safety_stock,
          netRequirement,
          leadTime: node.lead_time,
          suggestedReleaseDate,
        });
      }
    }

    return mrpList;
  }
}
