import { db } from "../../db/index";
import { suppliers } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class SupplierService {
  // 创建供应商
  static async createSupplier(data: any) {
    const code = `VEN-${new Date().getTime().toString().slice(-6)}`; // 自动生成简易供应商编码
    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        code,
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        status: data.status || "ACTIVE",
      })
      .returning();
    return newSupplier;
  }

  // 获取供应商列表
  static async getSupplierList() {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }
}
